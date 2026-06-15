import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { DemoToggle, DemoSlider } from "@/components/preview/demo-controls";
import { Search, FileText, CheckCircle2 } from "lucide-react";

const TARGETS = [
  { name: "会員ログイン・パスワードFAQ.pdf", on: true },
  { name: "トースターXT-2023取扱説明書.pdf", on: true },
  { name: "配送ポリシー.pdf", on: true },
  { name: "返品・交換規約.docx", on: false },
];

export default function DocSearchPage() {
  return (
    <div>
      <PageHeader
        icon={Search}
        title="ドキュメント検索モード"
        desc="FAQに無い質問でも、資料（PDFなど）の中から答えを探して回答します。出典ページも一緒に表示できます。"
        action={
          <Badge tone="success">
            <CheckCircle2 className="h-3 w-3" /> 有効
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 動作設定 */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-neutral-900">動作の設定</p>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">ドキュメント検索を使う</span>
              <DemoToggle defaultOn label="ドキュメント検索を使う" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">出典（ファイル・ページ）を表示</span>
              <DemoToggle defaultOn label="出典を表示" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">FAQで答えられない時だけ使う</span>
              <DemoToggle defaultOn label="FAQで答えられない時だけ使う" />
            </div>
            <div className="border-t border-[var(--color-hairline)] pt-3">
              <p id="threshold-label" className="text-neutral-600">
                一致のきびしさ（類似度しきい値）
              </p>
              <div className="mt-2">
                <DemoSlider defaultValue={75} labelledBy="threshold-label" />
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">高いほど「自信がある時だけ」答えます。</p>
            </div>
          </div>
        </Card>

        {/* 検索対象 */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-neutral-900">検索する資料</p>
          <div className="mt-3 space-y-2">
            {TARGETS.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-[var(--color-danger)]" />
                  <span className="truncate text-sm text-neutral-700">{t.name}</span>
                </span>
                <DemoToggle defaultOn={t.on} label={`${t.name} を検索対象にする`} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
