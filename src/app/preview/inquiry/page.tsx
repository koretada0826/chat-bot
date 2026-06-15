import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Inbox, Mail, Settings2 } from "lucide-react";

const SUBMISSIONS = [
  { name: "田中 様", email: "tanaka@example.com", type: "配送について", date: "6/12 10:48", status: "未対応" },
  { name: "匿名", email: "guest@example.com", type: "返品・交換", date: "6/12 09:15", status: "対応中" },
  { name: "鈴木 様", email: "suzuki@example.com", type: "商品について", date: "6/11 17:30", status: "完了" },
  { name: "高橋 様", email: "takahashi@example.com", type: "その他", date: "6/11 14:02", status: "完了" },
];

const STATUS_TONE: Record<string, "warn" | "brand" | "success"> = {
  未対応: "warn",
  対応中: "brand",
  完了: "success",
};

const FIELDS = ["お名前", "メールアドレス", "会社名", "問い合わせ種別", "内容"];

export default function InquiryPage() {
  return (
    <div>
      <PageHeader
        icon={Inbox}
        title="問い合わせフォーム"
        desc="チャットで解決しなかったお客様が、担当者に連絡するためのフォームです。届いた内容はここに一覧で残ります。"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
        {/* 受信一覧 */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-hairline)] px-5 py-3">
            <p className="text-sm font-semibold text-neutral-900">受信した問い合わせ</p>
            <Badge tone="warn">未対応 1件</Badge>
          </div>
         <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-hairline)] text-left text-xs text-neutral-500">
                <th className="px-5 py-2.5 font-medium">お客様</th>
                <th className="px-5 py-2.5 font-medium">種別</th>
                <th className="px-5 py-2.5 font-medium">受信</th>
                <th className="px-5 py-2.5 font-medium">状態</th>
              </tr>
            </thead>
            <tbody>
              {SUBMISSIONS.map((s, i) => (
                <tr key={i} className="border-b border-[var(--color-hairline)] last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-neutral-800">{s.name}</p>
                    <p className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                      <Mail className="h-3 w-3" />
                      {s.email}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{s.type}</td>
                  <td className="px-5 py-3 text-neutral-500">{s.date}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
        </Card>

        {/* フォーム項目設定 */}
        <Card className="p-5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <Settings2 className="h-4 w-4" />
            フォームの項目
          </p>
          <div className="mt-3 space-y-2">
            {FIELDS.map((f) => (
              <div
                key={f}
                className="flex items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-sm text-neutral-700"
              >
                {f}
                <span className="text-[11px] text-[var(--color-success)]">表示</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400">届いた内容はメール・Slackにも通知できます。</p>
        </Card>
      </div>
    </div>
  );
}
