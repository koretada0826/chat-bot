import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { CopyCheck, Merge } from "lucide-react";

const PAIRS = [
  {
    sim: 94,
    a: "送料はいくらですか？",
    b: "配送料金について教えてください",
    note: "ほぼ同じ質問。1つにまとめると管理が楽になります。",
  },
  {
    sim: 88,
    a: "返品はできますか？",
    b: "商品を返品したい場合はどうすればいいですか？",
    note: "言い回し違いの重複。統合をおすすめします。",
  },
  {
    sim: 81,
    a: "支払い方法を教えてください",
    b: "クレジットカードは使えますか？",
    note: "片方がもう片方に含まれます。内容を確認のうえ統合を。",
  },
];

export default function DuplicatesPage() {
  return (
    <div>
      <PageHeader
        icon={CopyCheck}
        title="重複FAQチェック"
        desc="似たFAQを自動で見つけます。重複を1つにまとめると、回答のブレが減り、管理もシンプルになります。"
        action={<Badge tone="warn">重複の疑い {PAIRS.length}組</Badge>}
      />

      <div className="space-y-3">
        {PAIRS.map((p, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={p.sim >= 90 ? "danger" : "warn"}>類似度 {p.sim}%</Badge>
              <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                <Merge className="h-3.5 w-3.5" />
                統合する
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-[var(--color-hairline)] bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                {p.a}
              </div>
              <div className="rounded-lg border border-[var(--color-hairline)] bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                {p.b}
              </div>
            </div>
            <p className="mt-2 text-xs text-neutral-400">{p.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
