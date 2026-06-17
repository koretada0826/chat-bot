import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

const REASON_LABEL: Record<string, string> = {
  low_confidence: "確信が低い",
  no_source: "該当情報なし",
  injection_blocked: "ブロック",
  sensitive_topic: "慎重な話題",
  feedback_unresolved: "未解決と評価",
};

export default async function UnresolvedPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: rows } = project
    ? await supabase
        .from("unresolved_questions")
        .select("id, question_raw, question_normalized, reason, best_score, created_at")
        .eq("project_id", project.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">未解決の質問</h1>
          <p className="mt-1 text-sm text-neutral-500">
            答えられなかった質問です。ここからFAQを増やすと問い合わせが減ります。
          </p>
        </div>
        <Link
          href="/admin/suggestions"
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          改善候補を作る →
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        {(rows ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">未解決の質問はありません。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(rows ?? []).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate text-neutral-800">
                  {r.question_raw}
                </span>
                <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  {REASON_LABEL[r.reason ?? ""] ?? r.reason ?? "—"}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {new Date(r.created_at).toLocaleDateString("ja-JP")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
