import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-helper";
import { createAdminClient } from "@/lib/supabase/admin";

// ウィジェット(/widget)は「許可したサイト」だけが iframe で埋め込めるようにする。
// 他人のサイトに勝手に埋め込んで“なりすましサポート”に使われるのを防ぐ。
async function widgetFrameGuard(request: NextRequest) {
  const res = NextResponse.next();
  const allowed = ["'self'"];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowed.push(new URL(appUrl).origin);
    } catch {
      /* 無効URLは無視 */
    }
  }

  const key = request.nextUrl.searchParams.get("k");
  if (key) {
    try {
      const admin = createAdminClient();
      const { data: proj } = await admin
        .from("projects")
        .select("id")
        .eq("public_key", key)
        .maybeSingle();
      if (proj) {
        const { data } = await admin
          .from("embed_domains")
          .select("domain")
          .eq("project_id", proj.id)
          .eq("enabled", true);
        for (const d of data ?? []) {
          allowed.push(`https://${d.domain}`);
        }
      }
    } catch {
      /* 取得失敗時は自オリジンのみ許可 */
    }
  }

  res.headers.set("Content-Security-Policy", `frame-ancestors ${allowed.join(" ")};`);
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

// Next.js 16 で middleware は proxy に名前が変わった
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/widget") {
    return widgetFrameGuard(request);
  }
  return await updateSession(request);
}

export const config = {
  // 画像など静的ファイル以外で動かす
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
