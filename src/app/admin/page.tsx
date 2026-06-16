import Link from "next/link";
import {
  LayoutDashboard,
  CheckCircle2,
  Bot,
  CircleAlert,
  ThumbsDown,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  TrendingUp,
  Sparkles,
  ListChecks,
  HelpCircle,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
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

type Tone = "brand" | "ai" | "success" | "warn" | "danger" | "neutral";
const TONE_CHIP: Record<Tone, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  ai: "bg-[var(--color-ai-soft)] text-[var(--color-ai)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warn: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral: "bg-neutral-100 text-neutral-500",
};

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-hairline)] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${TONE_CHIP[tone]}`}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
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
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <LayoutDashboard className="h-5 w-5" strokeWidth={2} />
        </span>
        <h1 className="text-lg font-semibold text-neutral-900">ダッシュボード</h1>
      </div>
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
      <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Sparkles className="h-4 w-4 text-[var(--color-brand)]" strokeWidth={2} />
            今やるべき改善
          </h2>
          <Link
            href="/admin/suggestions"
            className="text-xs text-[var(--color-brand)] hover:underline"
          >
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
                  className="flex items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-sm hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
                >
                  <span className="flex items-center gap-2 text-neutral-800">
                    <ChevronRight className="h-4 w-4 text-[var(--color-brand)]" />
                    {s.title ?? "（無題）"}
                  </span>
                  <span className="rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand)]">
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
        <StatCard label="自己解決率" tone="success" icon={CheckCircle2} value={pct(data?.rates.resolvedRate ?? null)} />
        <StatCard label="AI回答率" tone="ai" icon={Bot} value={pct(data?.rates.aiAnswerRate ?? null)} />
        <StatCard label="未解決率" tone="warn" icon={CircleAlert} value={pct(data?.rates.unresolvedRate ?? null)} />
        <StatCard label="低評価率" tone="danger" icon={ThumbsDown} value={pct(data?.rates.lowRatingRate ?? null)} />
      </div>

      {/* 質問数 */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard label="今日の質問" tone="brand" icon={CalendarDays} value={`${data?.questions.today ?? 0}`} />
        <StatCard label="直近7日" tone="brand" icon={CalendarRange} value={`${data?.questions.last7 ?? 0}`} />
        <StatCard label="直近30日" tone="brand" icon={CalendarClock} value={`${data?.questions.last30 ?? 0}`} />
      </div>

      {/* 推移グラフ（簡易バー） */}
      <div className="mt-6 rounded-xl border border-[var(--color-hairline)] bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <TrendingUp className="h-4 w-4 text-[var(--color-brand)]" strokeWidth={2} />
          質問数の推移（14日）
        </h2>
        <div className="mt-4 flex h-32 items-end gap-1">
          {(data?.trend ?? []).length === 0 ? (
            <p className="text-sm text-neutral-400">まだデータがありません。</p>
          ) : (
            data!.trend.map((t) => (
              <div key={t.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[var(--color-brand)] to-[var(--color-ai)]"
                  style={{ height: `${Math.max(4, (t.count / maxTrend) * 100)}%` }}
                  title={`${t.day}: ${t.count}`}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ランキング2列 */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-hairline)] bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ListChecks className="h-4 w-4 text-[var(--color-success)]" strokeWidth={2} />
            よくある質問
          </h2>
          {(data?.topQuestions ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">まだありません。</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data!.topQuestions.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-800">{q.question}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                    {q.count}件
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-hairline)] bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <HelpCircle className="h-4 w-4 text-[var(--color-warn)]" strokeWidth={2} />
            解決できていない質問
          </h2>
          {(data?.topUnresolved ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-neutral-400">まだありません。</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data!.topUnresolved.map((q, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-neutral-800">{q.question}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-[var(--color-warn-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-warn)]">
                    {q.count}件
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
