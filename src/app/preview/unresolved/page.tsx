import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { CircleAlert, Sparkles, ArrowRight } from "lucide-react";

const ITEMS = [
  { q: "海外発送はできますか？", count: 23, last: "5分前", tag: "配送", hint: "FAQ化で月23件削減" },
  { q: "定期便の解約方法を教えて", count: 18, last: "1時間前", tag: "定期便", hint: "FAQ化で月18件削減" },
  { q: "ギフト包装はできますか？", count: 12, last: "3時間前", tag: "ギフト", hint: "FAQ化で月12件削減" },
  { q: "領収書（インボイス）は発行できますか？", count: 9, last: "今日", tag: "支払い", hint: "FAQ化で月9件削減" },
  { q: "クーポンが使えません", count: 7, last: "昨日", tag: "その他", hint: "FAQ化で月7件削減" },
];

export default function UnresolvedPage() {
  return (
    <div>
      <PageHeader
        icon={CircleAlert}
        title="未解決質問"
        desc="AIが答えられなかった質問です。よく聞かれる順に並んでいます。FAQにすると、次から自動で答えられます。"
        action={<Badge tone="warn">未解決 14種類（上位5件）</Badge>}
      />

      <div className="space-y-2.5">
        {ITEMS.map((it) => (
          <Card key={it.q} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-neutral-900">{it.q}</p>
                <Badge tone="neutral">{it.tag}</Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {it.count}回 質問されています ・ 最終：{it.last}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-[var(--color-success)] sm:inline">{it.hint}</span>
              <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                <Sparkles className="h-3.5 w-3.5" />
                FAQ化する
              </button>
              <button className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50">
                詳細
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
