import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { DemoToggle } from "@/components/preview/demo-controls";
import { ShieldCheck, Globe, KeyRound, Gauge, Database, EyeOff } from "lucide-react";

const DOMAINS = ["https://example-store.co.jp", "https://shop.example.co.jp"];

export default function SecurityPage() {
  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="セキュリティ"
        desc="お客様と会社の情報を守るための設定です。むずかしく見えますが、初期設定のままでも安全に使えます。"
      />

      <div className="space-y-4">
        {/* 許可ドメイン */}
        <Card className="p-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <Globe className="h-4 w-4 text-[var(--color-brand)]" />
            チャットを表示できるサイト
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            ここに登録したサイトでだけチャットが動きます。他人のサイトに勝手に貼られるのを防ぎます。
          </p>
          <div className="mt-3 space-y-2">
            {DOMAINS.map((d) => (
              <div key={d} className="flex items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3 py-2">
                <span className="font-mono text-sm text-neutral-700">{d}</span>
                <Badge tone="success">許可中</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* APIキー */}
        <Card className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-[var(--color-brand)]" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">APIキー</p>
              <p className="font-mono text-xs text-neutral-400">sk_live_••••••••••••8x2k</p>
            </div>
          </div>
          <button className="rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50">
            再発行
          </button>
        </Card>

        {/* 上限・保護 */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-neutral-900">使いすぎ・情報の保護</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-neutral-600">
                <Gauge className="h-4 w-4 text-neutral-500" />
                1日の上限（使いすぎ防止）
              </span>
              <span className="text-right text-neutral-800">
                3,000 メッセージ / 日
                <span className="block text-[11px] text-neutral-500">（約50万トークン）</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-neutral-600">
                <EyeOff className="h-4 w-4 text-neutral-500" />
                個人情報の自動かくし（メール・電話番号などを伏せる）
              </span>
              <DemoToggle defaultOn label="個人情報の自動かくし" />
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-neutral-600">
                <Database className="h-4 w-4 text-neutral-500" />
                会話ログの保存期間
              </span>
              <span className="text-neutral-800">12か月</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
