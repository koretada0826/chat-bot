import { Pencil, Sparkles, ScrollText } from "lucide-react";
import { FAQ_PERFORMANCE } from "@/lib/preview/demo-data";
import { StateBadge } from "@/components/ui/saas";

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right tabular-nums text-neutral-700">{value}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-100">
        <span
          className="block h-full rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </span>
    </div>
  );
}

export function FaqPerformanceTable() {
  const maxViews = Math.max(...FAQ_PERFORMANCE.map((f) => f.views));
  const maxResolved = Math.max(...FAQ_PERFORMANCE.map((f) => f.resolved));
  const maxUnresolved = Math.max(...FAQ_PERFORMANCE.map((f) => f.unresolved));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-[var(--color-hairline)] text-left text-xs text-neutral-400">
            <th className="px-2 pb-2 font-medium">FAQ</th>
            <th className="px-2 pb-2 font-medium">カテゴリ</th>
            <th className="px-2 pb-2 font-medium">表示回数</th>
            <th className="px-2 pb-2 font-medium">解決</th>
            <th className="px-2 pb-2 font-medium">未解決</th>
            <th className="px-2 pb-2 font-medium">解決率</th>
            <th className="px-2 pb-2 font-medium">低評価率</th>
            <th className="px-2 pb-2 font-medium">状態</th>
            <th className="px-2 pb-2 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {FAQ_PERFORMANCE.map((f) => (
            <tr key={f.question} className="border-b border-neutral-50 hover:bg-neutral-50/60">
              <td className="px-2 py-2.5 font-medium text-neutral-800">{f.question}</td>
              <td className="px-2 py-2.5 text-neutral-500">{f.category}</td>
              <td className="px-2 py-2.5 text-xs">
                <MiniBar value={f.views} max={maxViews} color="var(--color-brand)" />
              </td>
              <td className="px-2 py-2.5 text-xs">
                <MiniBar value={f.resolved} max={maxResolved} color="var(--color-success)" />
              </td>
              <td className="px-2 py-2.5 text-xs">
                <MiniBar value={f.unresolved} max={maxUnresolved} color="var(--color-warn)" />
              </td>
              <td className="px-2 py-2.5 tabular-nums text-neutral-700">{f.resolveRate}%</td>
              <td
                className="px-2 py-2.5 tabular-nums"
                style={{ color: f.negativeRate >= 10 ? "var(--color-danger)" : "#6b7280" }}
              >
                {f.negativeRate}%
              </td>
              <td className="px-2 py-2.5">
                <StateBadge state={f.state} />
              </td>
              <td className="px-2 py-2.5">
                <div className="flex justify-end gap-1 text-neutral-400">
                  <button title="編集" className="rounded p-1 hover:bg-neutral-100 hover:text-neutral-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button title="改善案" className="rounded p-1 hover:bg-neutral-100 hover:text-[var(--color-brand)]">
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                  <button title="ログ" className="rounded p-1 hover:bg-neutral-100 hover:text-neutral-700">
                    <ScrollText className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
