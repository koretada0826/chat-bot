"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // 確認リンクのコールバック失敗で戻ってきた場合の案内（クライアントのURL読み取りはマウント後に行う）
  useEffect(() => {
    if (new URLSearchParams(location.search).get("error") === "auth") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URLパラメータ(外部状態)をマウント後に反映する正当な用途
      setError(
        "確認リンクを処理できませんでした。登録した端末・ブラウザと同じものでリンクを開くか、下のフォームから登録メール・パスワードで直接ログインしてください。",
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    // 鍵はボタンを押したこの瞬間に用意する（ページ準備時には触らない）
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError("メールアドレスかパスワードが違います。");
      else router.push("/admin");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // メール確認のリンクから戻る受け皿を指定
          emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) setError(error.message);
      else {
        // メール確認が有効な場合はここで案内、無効ならそのまま入れる
        const { data } = await supabase.auth.getUser();
        if (data.user) router.push("/onboarding");
        else setNotice("確認メールを送りました。メール内のリンクを開いてください。");
      }
    }
    setLoading(false);
  }

  function switchMode(m: "login" | "signup") {
    setMode(m);
    setError(null);
    setNotice(null);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            AnswerOps AI
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            問い合わせを減らす、AIナレッジ運用基盤
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="mb-5 flex rounded-md border border-neutral-200 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded py-1.5 ${
                mode === "login"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded py-1.5 ${
                mode === "signup"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-neutral-700">
                メールアドレス
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-700">
                パスワード
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                placeholder="6文字以上"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading
                ? "処理中…"
                : mode === "login"
                  ? "ログイン"
                  : "アカウントを作る"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-500">
          <Link href="/preview" className="underline hover:text-neutral-900">
            ログインせずに見本を見る →
          </Link>
        </p>
      </div>
    </main>
  );
}
