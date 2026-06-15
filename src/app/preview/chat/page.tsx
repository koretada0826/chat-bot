import { MockChat } from "@/components/preview/mock-chat";
import { MessagesSquare, FileSearch, Inbox, CheckCircle2 } from "lucide-react";

const FLOW = [
  {
    icon: MessagesSquare,
    title: "FAQから即答",
    body: "「送料はいくら？」などはFAQ回答ラベル付きで即座に返します。",
  },
  {
    icon: FileSearch,
    title: "ドキュメント検索",
    body: "「ログインできない」はPDF資料を参照し、出典ページ付きで回答します。",
  },
  {
    icon: Inbox,
    title: "答えられない時",
    body: "未登録の質問は未解決として記録し、問い合わせフォームへ案内します。",
  },
  {
    icon: CheckCircle2,
    title: "解決の確認",
    body: "回答ごとに「解決した／しなかった」を集計し、改善につなげます。",
  },
];

export default function PreviewChat() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">チャットを試す</h1>
      <p className="mt-1 text-sm text-neutral-500">
        実際のお客様が使う画面の見本です。下のチャットに質問を打ってみてください。
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)]">
        {/* 左：説明と試せる質問 */}
        <div className="order-2 space-y-5 lg:order-1">
          <div className="rounded-2xl border border-[var(--color-hairline)] bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">このチャットでできること</p>
            <div className="mt-4 space-y-4">
              {FLOW.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{f.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{f.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-hairline)] bg-white p-5">
            <p className="text-sm font-semibold text-neutral-900">試せる質問の例</p>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
              <li>・ 送料はいくらですか？（FAQ回答）</li>
              <li>・ ログインできなくなりました（資料を参照）</li>
              <li>・ トースターのお手入れ方法（資料を参照）</li>
              <li>・ 海外発送はできますか？（回答不能 → フォーム）</li>
            </ul>
          </div>
        </div>

        {/* 右：チャット本体 */}
        <div className="order-1 lg:order-2">
          <MockChat />
        </div>
      </div>
    </div>
  );
}
