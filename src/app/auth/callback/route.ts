import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// メール確認・マジックリンクの受け皿。
// 2方式に対応する:
//  (a) token_hash 方式（verifyOtp）… 端末に依存しない。別のスマホ/メールアプリで開いてもOK。
//  (b) code 方式（PKCE / exchangeCodeForSession）… 申込んだ同じブラウザでのみ成立。
// Supabaseのメールテンプレートが token_hash を渡す設定なら(a)が使われ、別端末でも通る。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/admin";
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // (a) 端末非依存の token_hash 方式を優先
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // (b) PKCE（同一ブラウザのみ）
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // 失敗時はログインへ（別端末で開いた可能性を示す理由を付ける）
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
