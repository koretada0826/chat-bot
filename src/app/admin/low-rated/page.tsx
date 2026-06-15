import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

export default async function LowRatedPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  // 低評価（down）や未解決のフィードバックと、その対象メッセージを取得
  const { data: rows } = project
    ? await supabase
        .from("feedbacks")
        .select(
          "id, rating, created_at, session_id, chat_messages(content_raw, content_normalized)",
        )
        .eq("project_id", project.id)
        .in("rating", ["down", "unresolved"])
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">低評価の回答</h1>
      <p className="mt-1 text-sm text-neutral-500">
        「解決しない」と評価された回答です。改善のヒントになります。
      </p>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        {(rows ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">低評価の回答はありません。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(rows ?? []).map((r) => {
              const msg = Array.isArray(r.chat_messages)
                ? r.chat_messages[0]
                : r.chat_messages;
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                      r.rating === "down"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {r.rating === "down" ? "低評価" : "未解決"}
                  </span>
                  <Link
                    href={`/admin/logs/${r.session_id}`}
                    className="flex-1 truncate text-neutral-800 hover:underline"
                  >
                    {msg?.content_raw || "（回答内容なし）"}
                  </Link>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {new Date(r.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
