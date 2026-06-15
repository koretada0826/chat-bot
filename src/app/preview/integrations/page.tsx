import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Plug, MessageCircle, MessagesSquare, Webhook, Mail } from "lucide-react";

const SERVICES = [
  { name: "LINE公式アカウント", desc: "LINEからの問い合わせにも自動で回答", icon: MessageCircle, color: "#06c755", connected: true },
  { name: "Slack", desc: "未解決・有人チャットの通知を受け取る", icon: MessagesSquare, color: "#4a154b", connected: true },
  { name: "Microsoft Teams", desc: "社内ヘルプデスクとして利用", icon: MessageCircle, color: "#5b5fc7", connected: false },
  { name: "Chatwork", desc: "問い合わせ通知をチャットワークへ", icon: MessageCircle, color: "#f93", connected: false },
  { name: "メール通知", desc: "重要な問い合わせをメールで受信", icon: Mail, color: "#2563eb", connected: true },
  { name: "Webhook（外部連携）", desc: "自社システムへイベントを送信", icon: Webhook, color: "#0f172a", connected: false },
];

export default function IntegrationsPage() {
  return (
    <div>
      <PageHeader
        icon={Plug}
        title="外部サービス連携"
        desc="ほかのサービスとつなげます。LINEやSlackと連携すると、対応や通知がもっと便利になります。"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.name} className="flex flex-col p-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ background: s.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="flex-1 text-sm font-semibold text-neutral-900">{s.name}</p>
                {s.connected && <Badge tone="neutral">接続済み（見本）</Badge>}
              </div>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-500">{s.desc}</p>
              <button
                className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  s.connected
                    ? "border border-[var(--color-hairline)] text-neutral-600 hover:bg-neutral-50"
                    : "bg-[var(--color-brand)] text-white hover:opacity-90"
                }`}
              >
                {s.connected ? "設定を見る" : "接続する"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
