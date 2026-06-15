import { Card, PageHeader } from "@/components/ui/saas";
import { MockChat } from "@/components/preview/mock-chat";
import { Palette } from "lucide-react";

const COLORS = ["#2b6cb0", "#0e9f6e", "#7c3aed", "#dc2626", "#ea580c", "#0f172a"];
const POSITIONS = ["右下", "左下", "中央下"];
const AVATARS = ["人物アイコン", "ロボット", "ロゴ画像"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--color-hairline)] py-3 last:border-0">
      <p className="mb-2 text-xs font-medium text-neutral-500">{label}</p>
      {children}
    </div>
  );
}

export default function DesignPage() {
  return (
    <div>
      <PageHeader
        icon={Palette}
        title="デザイン設定"
        desc="チャットの見た目を設定します。右のプレビューで、お客様にどう見えるかを確認しながら調整できます。"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_minmax(0,24rem)]">
        {/* 設定 */}
        <Card className="p-5">
          <Row label="テーマカラー">
            <div className="flex gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={c}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ${i === 0 ? "ring-neutral-400" : "ring-transparent"}`}
                  style={{ background: c }}
                  aria-label={`color ${c}`}
                />
              ))}
            </div>
          </Row>

          <Row label="表示位置">
            <div className="flex gap-2">
              {POSITIONS.map((p, i) => (
                <button
                  key={p}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    i === 0
                      ? "bg-[var(--color-brand)] text-white"
                      : "border border-[var(--color-hairline)] text-neutral-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Row>

          <Row label="アバター">
            <div className="flex gap-2">
              {AVATARS.map((a, i) => (
                <button
                  key={a}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    i === 0
                      ? "bg-[var(--color-brand)] text-white"
                      : "border border-[var(--color-hairline)] text-neutral-600"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </Row>

          <Row label="ボットの名前">
            <input
              defaultValue="AnswerOps Bot"
              aria-label="ボットの名前"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
            />
          </Row>

          <Row label="あいさつ文">
            <textarea
              rows={2}
              defaultValue="こんにちは！ご質問をどうぞ。下のカテゴリから選ぶこともできます。"
              aria-label="あいさつ文"
              className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
            />
          </Row>

          <div className="pt-3">
            <button className="rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              保存する
            </button>
          </div>
        </Card>

        {/* プレビュー */}
        <div>
          <p className="mb-2 text-center text-xs text-neutral-500">
            プレビュー（お客様の見え方）※実際に触れる見本です
          </p>
          <MockChat />
        </div>
      </div>
    </div>
  );
}
