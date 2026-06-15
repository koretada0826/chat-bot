import { TriangleAlert, Sparkles, Activity } from "lucide-react";
import { INSIGHTS } from "@/lib/preview/demo-data";

const ALERT_TONE: Record<string, string> = {
  warn: "border-l-[var(--color-warn)] bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  danger: "border-l-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function InsightPanel() {
  return (
    <div className="space-y-4">
      {/* 今日のアラート */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <TriangleAlert className="h-3.5 w-3.5 text-[var(--color-warn)]" />
          今日のアラート
        </p>
        <ul className="space-y-1.5">
          {INSIGHTS.alerts.map((a, i) => (
            <li
              key={i}
              className={`rounded-md border-l-2 px-2.5 py-1.5 text-xs ${ALERT_TONE[a.tone]}`}
            >
              {a.text}
            </li>
          ))}
        </ul>
      </section>

      {/* AIからの提案 */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand)]" />
          AIからの提案
        </p>
        <ul className="space-y-1.5">
          {INSIGHTS.suggestions.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-md border border-[var(--color-hairline)] px-2.5 py-1.5 text-xs text-neutral-600"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-brand)]" />
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* 最近のイベント */}
      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Activity className="h-3.5 w-3.5 text-neutral-400" />
          最近のイベント
        </p>
        <ul className="space-y-2">
          {INSIGHTS.events.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-neutral-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
              {e}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
