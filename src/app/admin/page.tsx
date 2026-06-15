import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { getDashboard } from "@/lib/analytics/dashboard";
import { SetupGuide } from "@/components/admin/setup-guide";

async function countOf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  projectId: string,
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);
  return count ?? 0;
}

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-neutral-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  new_faq: "新しいFAQ案",
  improve_faq: "FAQ改善案",
  merge_duplicate: "重複FAQの統合",
  new_document: "資料の追加",
  recategorize: "カテゴリ整理",
};

export default async function DashboardPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();
  const data = project ? await getDashboard(supabase, project.id) : null;

  // 登録状況（何を読み込ませたか）
  const [faqCount, docCount, dictCount] = project
    ? await Promise.all([
        countOf(supabase, "faqs", project.id),
        countOf(supabase, "documents", project.id),
        countOf(supabase, "dictionary_terms", project.id),
      ])
    : [0, 0, 0];
  const needsSetup = faqCount === 0 && docCount === 0;

  const maxTrend = Math.max(1, ...(data?.trend.map((t) => t.count) ?? [1]));

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">ダッシュボード</h1>
      <p className="mt-1 text-sm text-neutral-500">
        次に何を改善すれば問い合わせが減るか、をここに表示します。
      </p>

      {/* 何を登録すればいいかのガイド（まだFAQ・資料が無い間は目立たせる） */}
      <div className="mt-6">
        <SetupGuide faqCount={faqCount} docCount={docCount} dictCount={dictCount} />
      </div>
      {needsSetup && (
        <p className="mt-2 text-xs text-neutral-400">
          ※ まずFAQか資料を登録すると、チャットが答えられるようになります。
        </p>
      )}

      {/* 今やるべき改善 */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">今やるべき改善</h2>
          <Link href="/admin/suggestions" className="text-xs text-neutral-500 hover:underline">
            すべて見る →
          </Link>
        </div>
        {!data || data.suggestions.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            改善候補はまだありません。「改善候補」画面で生成できます。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.suggestions.map((s) => (
              <li key={s.id}>
                <Link
                  href="/admin/suggestions"
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <span className="text-neutral-800">{s.title ?? "（無題）"}</span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    {TYPE_LABEL[s.type] ?? s.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* KPIカード */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="自己解決率" value={pct(data?.rates.resolvedRate ?? null)} />
        <StatCard label="AI回答率" value={pct(data?.rates.aiAnswerRate ?? null)} />
        <StatCard label="未解決率" value={pct(data?.rates.unresolvedRate ?? null)} />
        <StatCard label="低評価率" value={pct(data?.rates.lowRatingRate ?? null)} />
      </div>

      {/* 質問数 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard label="今日の質問" value={`${data?.questions.today ?? 0}`} />
        <StatCard label="直近7日" value={`${data?.questions.last7 ?? 0}`} />
        <StatCard label="直近30日" value={`${data?.questions.last30 ?? 0}`} />
      </div>

      {/* 推移グラフ（簡易バー） */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">質問数の推移（14日）</h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {(data?.trend ?? []).length === 0 ? (
            <p className="text-sm text-neutral-400">まだデータがありません。</p>
          ) : (
            data!.trend.map((t) => (
              <div key={t.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-neutral-800"
                  style={{ height: `${(t.count / maxTrend) * 100}%` }}
                  title={`${t.day}: ${t.count}`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ランキング2列 */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">よくある質問</h2>
          {(data?.topQuestions ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">まだありません。</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data!.topQuestions.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-800">{q.question}</span>
                  <span className="ml-2 shrink-0 text-xs text-neutral-400">{q.count}件</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">解決できていない質問</h2>
          {(data?.topUnresolved ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">まだありません。</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data!.topUnresolved.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-800">{q.question}</span>
                  <span className="ml-2 shrink-0 text-xs text-neutral-400">{q.count}件</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
