import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { ThumbsDown, PencilRuler } from "lucide-react";

const ITEMS = [
  {
    q: "定期便はいつでも解約できますか？",
    a: "解約に関する情報が見つかりませんでした。",
    reason: "回答が見つからず、お客様が「解決しなかった」を選択",
    down: 5,
    type: "未解決",
  },
  {
    q: "返品の送料は誰が負担しますか？",
    a: "返品は7日以内に承ります。",
    reason: "質問（送料の負担）に答えきれていない",
    down: 3,
    type: "回答不足",
  },
  {
    q: "支払い方法は何が使えますか？",
    a: "クレジットカードがご利用いただけます。",
    reason: "コンビニ払い・代引きの記載漏れ",
    down: 2,
    type: "情報が古い",
  },
];

export default function LowRatedPage() {
  return (
    <div>
      <PageHeader
        icon={ThumbsDown}
        title="低評価回答"
        desc="お客様が「解決しなかった」と評価した回答です。直すと、満足度と自己解決率が上がります。"
        action={<Badge tone="danger">低評価 7件（代表3件）</Badge>}
      />

      <div className="space-y-3">
        {ITEMS.map((it) => (
          <Card key={it.q} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">{it.q}</p>
              <Badge tone="danger">
                <ThumbsDown className="h-3 w-3" /> {it.down}
              </Badge>
            </div>
            <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
              現在の回答：{it.a}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--color-warn)]">
                <Badge tone="warn" className="mr-1.5">{it.type}</Badge>
                {it.reason}
              </p>
              <button className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                <PencilRuler className="h-3.5 w-3.5" />
                回答を改善する
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
