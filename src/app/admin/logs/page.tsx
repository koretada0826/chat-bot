import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

export default async function LogsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: sessions } = project
    ? await supabase
        .from("chat_sessions")
        .select("id, started_at, page_url, status")
        .eq("project_id", project.id)
        .order("started_at", { ascending: false })
        .limit(100)
    : { data: [] };

  // 各セッションの最初のユーザー発言を取得（プレビュー用）
  const ids = (sessions ?? []).map((s) => s.id);
  const { data: firstMsgs } = ids.length
    ? await supabase
        .from("chat_messages")
        .select("session_id, content_raw, role, created_at")
        .in("session_id", ids)
        .eq("role", "user")
        .order("created_at", { ascending: true })
    : { data: [] };

  const previewBySession = new Map<string, string>();
  for (const m of firstMsgs ?? []) {
    if (!previewBySession.has(m.session_id)) {
      previewBySession.set(m.session_id, m.content_raw ?? "");
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">質問ログ</h1>
      <p className="mt-1 text-sm text-neutral-500">
        お客さんとの会話の記録です。クリックで全文が見られます。
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        {(sessions ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">まだ会話がありません。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(sessions ?? []).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/logs/${s.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-neutral-50"
                >
                  <span className="flex-1 truncate text-neutral-800">
                    {previewBySession.get(s.id) || "（発言なし）"}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {new Date(s.started_at).toLocaleString("ja-JP")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
