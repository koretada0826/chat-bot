import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Settings2 } from "lucide-react";

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-[var(--color-hairline)] py-3 last:border-0 sm:flex sm:items-center sm:gap-4">
      <p className="w-40 shrink-0 text-xs font-medium text-neutral-500">{label}</p>
      <p className={`mt-1 text-sm text-neutral-800 sm:mt-0 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <div>
      <PageHeader
        icon={Settings2}
        title="プロジェクト設定"
        desc="このチャットボット（プロジェクト）の基本情報です。会社・サイトごとに1つのプロジェクトを作ります。"
        action={
          <button className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            保存する
          </button>
        }
      />

      <Card className="p-5">
        <div className="px-1">
          <Field label="プロジェクト名" value="ECサイト問い合わせデモ" />
          <Field label="プロジェクトキー" value="proj_ecsite_8x2k9" mono />
          <Field label="表示言語" value="日本語" />
          <Field label="タイムゾーン" value="(GMT+9) 東京" />
          <Field label="対応時間" value="平日 9:00〜18:00（時間外はフォーム案内）" />
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-neutral-400">プラン</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">スタンダード</p>
          <Badge tone="brand" className="mt-1.5">月 30,000 メッセージ</Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-400">今月の利用</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">8,420 / 30,000</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-[var(--color-brand)]" style={{ width: "28%" }} />
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-400">作成日</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">2026/5/20</p>
          <p className="mt-1.5 text-xs text-neutral-400">運用 23日目</p>
        </Card>
      </div>
    </div>
  );
}
