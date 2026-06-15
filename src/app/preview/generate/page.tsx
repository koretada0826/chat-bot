import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Wand2, Check, X, FileText } from "lucide-react";

const DRAFTS = [
  {
    q: "ログインできないときはどうすればいいですか？",
    a: "ユーザーIDとパスワードをご確認のうえ、パスワード再設定をお試しください。解消しない場合はサポートへご連絡ください。",
    source: "会員ログイン・パスワードFAQ.pdf p.3",
  },
  {
    q: "トースターのお手入れ方法を教えてください。",
    a: "電源コードを抜き、本体が冷めてからクラフトレイを外して拭いてください。研磨剤は使用しないでください。",
    source: "トースターXT-2023取扱説明書.pdf p.8",
  },
  {
    q: "配送日時の指定はできますか？",
    a: "ご注文時に、お届け日と時間帯（午前／14-16時など）をご指定いただけます。",
    source: "配送ポリシー.pdf p.2",
  },
];

export default function GeneratePage() {
  return (
    <div>
      <PageHeader
        icon={Wand2}
        title="Q&A自動生成"
        desc="登録した資料から、AIがFAQの下書きを作ります。中身を確認して「採用」を押すだけで、FAQが増やせます。"
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Wand2 className="h-3.5 w-3.5" />
            資料から再生成
          </button>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <Badge tone="ai">AIが生成した下書き {DRAFTS.length}件</Badge>
        <span className="text-xs text-neutral-400">採用するとFAQに追加されます</span>
      </div>

      <div className="space-y-3">
        {DRAFTS.map((d) => (
          <Card key={d.q} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">Q. {d.q}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">A. {d.a}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                <FileText className="h-3.5 w-3.5" />
                出典：{d.source}
              </span>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-success)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
                  <Check className="h-3.5 w-3.5" />
                  採用する
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50">
                  <X className="h-3.5 w-3.5" />
                  却下
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
