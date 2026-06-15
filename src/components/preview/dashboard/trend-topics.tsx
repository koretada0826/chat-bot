import { TREND_TOPICS } from "@/lib/preview/demo-data";

export function TrendTopics() {
  return (
    <div className="flex flex-wrap gap-2">
      {TREND_TOPICS.map((t) => (
        <button
          key={t.tag}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition hover:shadow-sm ${
            t.hot
              ? "border-[var(--color-warn)]/30 bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
              : "border-[var(--color-hairline)] bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <span className="font-medium">{t.tag}</span>
          <span
            className={`rounded-full px-1.5 text-[10px] font-semibold ${
              t.hot ? "bg-[var(--color-warn)]/15" : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}
