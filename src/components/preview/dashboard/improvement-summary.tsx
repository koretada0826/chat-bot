import Link from "next/link";
import { Sparkles, ArrowRight, Clock, Target, TrendingDown } from "lucide-react";
import { IMPROVEMENT_SUMMARY } from "@/lib/preview/demo-data";

export function ImprovementSummary() {
  const s = IMPROVEMENT_SUMMARY;
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-brand)]/20 bg-gradient-to-br from-[var(--color-brand-soft)] to-white">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--color-brand)]">今週の改善サマリー</p>
            <p className="mt-1 text-sm leading-relaxed text-neutral-800">{s.headline}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric icon={<TrendingDown className="h-4 w-4" />} label="推定削減" value={`${s.reducible}件/月`} />
          <Metric icon={<Clock className="h-4 w-4" />} label="削減時間" value={`${s.savedHours}h/週`} />
          <Metric icon={<Target className="h-4 w-4" />} label="最優先テーマ" value={s.topTheme} />
          <Metric icon={<Sparkles className="h-4 w-4" />} label="推奨アクション" value={s.recommended} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Sparkles className="h-3.5 w-3.5" />
            FAQ案を生成
          </button>
          <Link
            href="/preview/unresolved"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            未解決質問を見る
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-hairline)] bg-white/70 p-3">
      <div className="flex items-center gap-1.5 text-[var(--color-brand)]">
        {icon}
        <span className="text-[11px] text-neutral-500">{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
