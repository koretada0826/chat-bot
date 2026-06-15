import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// count=その話題の総質問数、unresolved=未解決率(%)。総数×未解決率がダッシュボードの未解決件数と整合する。
const TOPICS = [
  { name: "海外発送", count: 48, delta: 32, unresolved: 48 }, // 約23件が未解決
  { name: "定期便の解約", count: 36, delta: 18, unresolved: 50 }, // 約18件が未解決
  { name: "ギフト包装", count: 22, delta: 12, unresolved: 55 }, // 約12件が未解決
  { name: "返品・交換", count: 31, delta: -6, unresolved: 12 },
  { name: "送料・配送日", count: 29, delta: 4, unresolved: 8 },
  { name: "領収書", count: 18, delta: 9, unresolved: 50 },
  { name: "支払い方法", count: 18, delta: -3, unresolved: 9 },
  { name: "ログイン", count: 15, delta: 1, unresolved: 14 },
];

function Trend({ d }: { d: number }) {
  if (d > 3)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--color-warn)]">
        <TrendingUp className="h-3.5 w-3.5" />+{d}%
      </span>
    );
  if (d < -3)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--color-success)]">
        <TrendingDown className="h-3.5 w-3.5" />
        {d}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-neutral-400">
      <Minus className="h-3.5 w-3.5" />
      {d}%
    </span>
  );
}

export default function TrendsPage() {
  const max = Math.max(...TOPICS.map((t) => t.count));
  return (
    <div>
      <PageHeader
        icon={TrendingUp}
        title="トレンドトピック"
        desc="質問ログから話題を自動で抽出。増えている話題や、未解決が多い話題ほど、早めの対策が効きます。"
      />

      {/* タグ雲 */}
      <Card className="mb-4 p-5">
        <p className="mb-3 text-sm font-semibold text-neutral-900">いま多い話題</p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <span
              key={t.name}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                t.unresolved >= 40
                  ? "bg-[var(--color-warn-soft)] text-[var(--color-warn)]"
                  : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
              }`}
              style={{ fontSize: `${0.8 + (t.count / max) * 0.5}rem` }}
            >
              {t.name}（{t.count}）
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-neutral-400">オレンジ＝未解決が多い話題（対策の優先度が高い）</p>
      </Card>

      {/* 一覧 */}
      <Card className="overflow-hidden p-0">
       <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-hairline)] text-left text-xs text-neutral-500">
              <th className="px-5 py-2.5 font-medium">話題</th>
              <th className="px-5 py-2.5 font-medium">質問数（全体）</th>
              <th className="px-5 py-2.5 font-medium">前週比</th>
              <th className="px-5 py-2.5 font-medium">未解決率</th>
            </tr>
          </thead>
          <tbody>
            {TOPICS.map((t) => (
              <tr key={t.name} className="border-b border-[var(--color-hairline)] last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-800">{t.name}</td>
                <td className="px-5 py-3 text-neutral-600">{t.count}件</td>
                <td className="px-5 py-3">
                  <Trend d={t.delta} />
                </td>
                <td className="px-5 py-3">
                  <Badge tone={t.unresolved >= 40 ? "warn" : "neutral"}>{t.unresolved}%</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </Card>
    </div>
  );
}
