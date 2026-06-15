import { DifyChat } from "@/components/preview/dify-chat";
import { Card, PageHeader } from "@/components/ui/saas";
import { Plug, KeyRound, Server, MessageSquare } from "lucide-react";

const STEPS = [
  {
    icon: KeyRound,
    title: "1. DifyのAPIキーを取得",
    body: "Difyの対象アプリ → 左メニュー「APIアクセス」→ シークレットキー（app-xxxx）を発行・コピー。",
  },
  {
    icon: Server,
    title: "2. .env.local に設定",
    body: "プロジェクト直下の .env.local に DIFY_API_KEY=app-xxxx を追記し、開発サーバーを再起動。",
  },
  {
    icon: MessageSquare,
    title: "3. ここで試す",
    body: "右のチャットに質問 → AnswerOpsのサーバー経由でDifyが本物の回答を返します。",
  },
];

export default function DifyChatPage() {
  return (
    <div>
      <PageHeader
        icon={Plug}
        title="Dify連携チャット（B案・Phase 1）"
        desc="AnswerOpsの画面デザインのまま、回答はDifyの頭脳が返します。これが「答えるエンジン＝Dify／見た目・運営＝AnswerOps」の合体の第一歩です。"
      />

      <div className="mb-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-4 py-2.5 text-xs text-neutral-600">
        ※ このページは<strong className="font-medium text-neutral-800">実際にDifyへ接続して回答します</strong>（上部の「見本モード」バナーの対象外＝本物の回答です）。
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        {/* 左：セットアップ手順 */}
        <div className="order-2 space-y-4 lg:order-1">
          <Card className="p-5">
            <p className="text-sm font-semibold text-neutral-900">つなぎ方（3ステップ）</p>
            <div className="mt-4 space-y-4">
              {STEPS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{s.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{s.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-neutral-900">この先（Phase 2・3）</p>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-600">
              <li>・ Phase 2：会話を自分のDB（Supabase）に保存 → ダッシュボードが本物データで動く</li>
              <li>・ Phase 3：未解決→改善候補→承認でDifyにQ&Aを書き戻す（育てるループ）</li>
            </ul>
            <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              ※ APIキーは <code>.env.local</code> に置き、サーバー側だけで使います（ブラウザには出ません）。
              未設定のまま質問すると「DIFY_API_KEY が未設定です」と表示されます。
            </p>
          </Card>
        </div>

        {/* 右：連携チャット本体 */}
        <div className="order-1 lg:order-2">
          <DifyChat />
        </div>
      </div>
    </div>
  );
}
