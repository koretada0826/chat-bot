import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// メール確認・マジックリンクの受け皿。
// 確認メールのリンクからここに戻り、コードをセッションに交換する。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 失敗時はログインへ（理由を付ける）
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
