import { FileText } from "lucide-react";
import type { ChatSource } from "@/lib/preview/demo-data";

export function SourceCards({ sources }: { sources: ChatSource[] }) {
  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[11px] font-medium text-neutral-400">参照元</p>
      {sources.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 rounded-lg border border-[var(--color-hairline)] bg-white px-2.5 py-2"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-neutral-800">{s.file}</p>
            <p className="text-[11px] text-neutral-400">p.{s.page}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--color-ai-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ai)]">
            類似度 {s.score.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
