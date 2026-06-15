import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { Sparkles, Check } from "lucide-react";
import { SAMPLE_SUGGESTIONS } from "@/lib/preview/sample";

const input =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]";

export default function PreviewSuggestions() {
  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="改善候補"
        desc="答えられなかった質問から、AIが新しいFAQ案を作ります。確認・修正して公開できます。"
        action={<Badge tone="brand">改善候補 12件（上位3件）</Badge>}
      />

      <div className="space-y-4">
        {SAMPLE_SUGGESTIONS.map((s, i) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-center gap-2">
              <Badge tone="ai">
                <Sparkles className="h-3 w-3" /> 新FAQ案
              </Badge>
              <span className="text-xs text-neutral-500">未解決 {s.count}件をまとめ</span>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor={`q-${i}`} className="mb-1 block text-xs text-neutral-500">
                  質問
                </label>
                <input id={`q-${i}`} defaultValue={s.title} className={input} />
              </div>
              <div>
                <label htmlFor={`a-${i}`} className="mb-1 block text-xs text-neutral-500">
                  答え（下書き：内容を確認・修正してください）
                </label>
                <textarea id={`a-${i}`} rows={3} defaultValue={s.draftAnswer} className={input} />
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Check className="h-4 w-4" />
                承認して公開
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
