// 公開チャットAPIの「どのサイトから呼ばれたか」を確認する部品。
// 自分のアプリ（デモ・iframeウィジェット）と、許可ドメインだけを通す。
// curl など Origin の無いアクセス（濫用の主経路）は弾く。
import { createAdminClient } from "@/lib/supabase/admin";

function hostOf(u: string | null): string | null {
  if (!u) return null;
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return null;
  }
}

function matchDomain(host: string, domain: string): boolean {
  const d = domain.toLowerCase().trim();
  if (d.startsWith("*.")) {
    const base = d.slice(2);
    return host === base || host.endsWith("." + base);
  }
  return host === d;
}

export function getClientIp(request: Request): string {
  // X-Forwarded-For は「クライアント, …, 直前の信頼プロキシ」の順。
  // ★ 先頭(最左)はクライアントが自由に詐称できる（毎回ランダムIPを付けてレート制限すり抜け）。
  //   Render等の信頼プロキシが付与する「最後(最右)」の値が本物のクライアントIPなので、そちらを使う。
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function isAllowedOrigin(
  request: Request,
  projectId: string,
): Promise<boolean> {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  const host = hostOf(origin);

  // ブラウザ以外（Originなし＝curl/スクリプト）は拒否。公開APIはブラウザ用。
  if (!host) return false;

  // 開発用 localhost は「完全一致」のみ許可（localhostevil.com 等の前方一致詐称を防ぐ）。
  // 本番(production)では localhost 許可自体を無効化する。
  if (process.env.NODE_ENV !== "production") {
    const h = host.split(":")[0]; // ポートを除く
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  }

  // 自分のアプリのオリジン（デモ画面・埋め込みiframe）は常に許可
  const appHost = hostOf(process.env.NEXT_PUBLIC_APP_URL ?? null);
  if (appHost && host === appHost) return true;

  // 許可ドメインに登録されたサイトだけ通す（未登録の外部サイト/直叩きは拒否＝fail-closed）。
  // ※ iframe埋め込みウィジェットは自アプリのオリジンで動くため、上の自オリジン許可で通る。
  //    顧客が script 直貼りなど別オリジンから直接APIを叩く場合のみ登録が必要。
  const admin = createAdminClient();
  const { data } = await admin
    .from("embed_domains")
    .select("domain")
    .eq("project_id", projectId)
    .eq("enabled", true);
  const domains = (data ?? []).map((d) => d.domain);
  return domains.some((d) => matchDomain(host, d));
}
