import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { PencilRuler, ArrowDown, Check } from "lucide-react";

const ITEMS = [
  {
    q: "返品の送料は誰が負担しますか？",
    before: "返品は商品到着後7日以内で承ります。",
    after:
      "返品は商品到着後7日以内で承ります。お客様都合の返品は送料をご負担ください。初期不良・誤発送の場合は当社が負担します。",
    why: "「送料の負担」に答えていなかったため追記",
  },
  {
    q: "支払い方法は何が使えますか？",
    before: "クレジットカードがご利用いただけます。",
    after: "クレジットカード・コンビニ払い・代金引換がご利用いただけます。",
    why: "実際に使える支払い方法の記載漏れを補完",
  },
];

export default function AnswerImprovePage() {
  return (
    <div>
      <PageHeader
        icon={PencilRuler}
        title="回答改善提案"
        desc="低評価や未解決の回答に対して、AIが「直した文」を提案します。前後を見比べて、良ければ反映できます。"
        action={<Badge tone="brand">提案 {ITEMS.length}件</Badge>}
      />

      <div className="space-y-3">
        {ITEMS.map((it) => (
          <Card key={it.q} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">{it.q}</p>

            <div className="mt-3 rounded-lg border border-[var(--color-hairline)] bg-neutral-50 px-3 py-2.5">
              <p className="mb-1 text-[11px] font-medium text-neutral-400">いまの回答</p>
              <p className="text-sm text-neutral-600">{it.before}</p>
            </div>

            <div className="my-1.5 flex justify-center">
              <ArrowDown className="h-4 w-4 text-neutral-300" />
            </div>

            <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-3 py-2.5">
              <p className="mb-1 text-[11px] font-medium text-[var(--color-success)]">AIの改善案</p>
              <p className="text-sm text-neutral-700">{it.after}</p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-400">理由：{it.why}</p>
              <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                <Check className="h-3.5 w-3.5" />
                この案を反映
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
