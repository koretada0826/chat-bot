import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { GitBranch, Plus, MessageSquare, CornerDownRight, Inbox } from "lucide-react";

const SCENARIOS = [
  {
    name: "配送の問い合わせ",
    trigger: "「配送」「送料」「いつ届く」",
    steps: [
      "「配送について」ボタンを表示",
      "選択肢：送料 / 配送日 / 海外発送",
      "それぞれのFAQ回答を表示",
    ],
    status: "公開中",
  },
  {
    name: "返品・交換の受付",
    trigger: "「返品」「交換」「返金」",
    steps: ["注文番号をたずねる", "返品理由を選択", "手続きページへ案内 or 担当者に接続"],
    status: "公開中",
  },
  {
    name: "営業時間外の案内",
    trigger: "18:00〜翌9:00 のアクセス",
    steps: ["「ただ今は営業時間外です」と表示", "問い合わせフォームへ案内"],
    status: "下書き",
  },
];

export default function ScenarioPage() {
  return (
    <div>
      <PageHeader
        icon={GitBranch}
        title="シナリオ設定"
        desc="「この質問が来たら、こう案内する」という道すじを作ります。よくある流れを決めておくと、お客様が迷いません。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            シナリオを作成
          </button>
        }
      />

      <div className="space-y-3">
        {SCENARIOS.map((s) => (
          <Card key={s.name} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
              <Badge tone={s.status === "公開中" ? "success" : "neutral"}>{s.status}</Badge>
            </div>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-400">
              <MessageSquare className="h-3.5 w-3.5" />
              きっかけ：{s.trigger}
            </p>
            <div className="mt-3 space-y-1.5">
              {s.steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                  <CornerDownRight className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[11px] font-semibold text-[var(--color-brand)]">
                    {i + 1}
                  </span>
                  {st}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-400">
        <Inbox className="h-3.5 w-3.5" />
        最後に「担当者に接続」を置けば、AIで解決しない時は人にバトンタッチできます。
      </p>
    </div>
  );
}
