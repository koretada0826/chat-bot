import { INDUSTRY_TEMPLATES } from "@/lib/templates/data";
import { SubmitButton } from "@/components/ui/submit-button";
import { importTemplateAction } from "./actions";

export default function TemplatesPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">業界テンプレート</h1>
      <p className="mt-1 text-sm text-neutral-500">
        業種を選ぶと、その業種のスターターFAQが入ります。最初から動かせて、あとから自由に編集できます。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INDUSTRY_TEMPLATES.map((t) => (
          <div key={t.key} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">{t.name}</h2>
              <span className="shrink-0 text-xs text-neutral-400">FAQ {t.faqs.length}件</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{t.description}</p>

            <form action={importTemplateAction} className="mt-4">
              <input type="hidden" name="template_key" value={t.key} />
              <SubmitButton
                pendingText="取り込み中…"
                className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                このテンプレを取り込む
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        ※ 取り込むと、選んだ業種のFAQが「公開」状態で追加されます。重複して取り込むと同じFAQが増えるのでご注意ください。
      </p>
    </div>
  );
}
