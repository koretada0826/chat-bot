import { Sparkles, ArrowRight, TrendingDown } from "lucide-react";
import { IMPROVEMENT_ACTIONS } from "@/lib/preview/demo-data";
import { Badge } from "@/components/ui/saas";

const PRIORITY_TONE = { 高: "danger", 中: "warn", 低: "neutral" } as const;

export function ImprovementActions() {
  return (
    <ul className="space-y-2.5">
      {IMPROVEMENT_ACTIONS.map((a) => (
        <li
          key={a.id}
          className="rounded-lg border border-[var(--color-hairline)] p-3.5 transition hover:border-neutral-300"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900">{a.question}</p>
            <Badge tone={PRIORITY_TONE[a.priority]}>優先度 {a.priority}</Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span>未解決 <b className="text-neutral-700">{a.unresolved}件</b></span>
            <span className="text-neutral-300">·</span>
            <span>類似質問 {a.similar}件</span>
            <span className="text-neutral-300">·</span>
            <span>推奨：<span className="text-neutral-700">{a.recommended}</span></span>
            <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
              <TrendingDown className="h-3 w-3" />
              推定削減 月{a.reduce}件
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-brand)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90">
              <Sparkles className="h-3.5 w-3.5" />
              {a.action === "generate" ? "FAQ案を生成" : "改善案を見る"}
            </button>
            <button className="inline-flex items-center gap-1 rounded-md border border-[var(--color-hairline)] px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50">
              詳細
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
