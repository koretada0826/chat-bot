import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ANSWER_TYPE_LABEL: Record<string, string> = {
  faq: "FAQ回答",
  rag: "資料回答",
  hybrid: "統合回答",
  unanswered: "回答不能",
  menu: "メニュー",
};

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id, started_at, page_url")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content_raw, answer_type, confidence, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl">
      <Link href="/admin/logs" className="text-sm text-neutral-500 hover:underline">
        ← 質問ログへ戻る
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-neutral-900">チャット履歴</h1>
      <p className="mt-1 text-xs text-neutral-400">
        {new Date(session.started_at).toLocaleString("ja-JP")}
        {session.page_url ? ` / ${session.page_url}` : ""}
      </p>

      <div className="mt-6 space-y-3">
        {(messages ?? []).map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.content_raw}
            </div>
            {m.role === "assistant" && m.answer_type && (
              <p className="mt-1 text-xs text-neutral-400">
                {ANSWER_TYPE_LABEL[m.answer_type] ?? m.answer_type}
                {m.confidence != null ? ` / 確信度 ${Math.round(Number(m.confidence) * 100)}%` : ""}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
