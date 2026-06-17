import {
  LayoutTemplate,
  ShoppingCart,
  Building2,
  Wifi,
  LifeBuoy,
  Users,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/lib/templates/data";
import { SubmitButton } from "@/components/ui/submit-button";
import { importTemplateAction } from "./actions";

// カードごとに色とアイコンを順番に割り当てる（業種データの並び順に対応）
const PALETTE: { chip: string; icon: LucideIcon }[] = [
  { chip: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]", icon: ShoppingCart },
  { chip: "bg-[var(--color-success-soft)] text-[var(--color-success)]", icon: Building2 },
  { chip: "bg-[var(--color-ai-soft)] text-[var(--color-ai)]", icon: Wifi },
  { chip: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]", icon: LifeBuoy },
  { chip: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]", icon: Users },
  { chip: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]", icon: Landmark },
];

export default function TemplatesPage() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <LayoutTemplate className="h-5 w-5" strokeWidth={2} />
        </span>
        <h1 className="text-lg font-semibold text-neutral-900">業界テンプレート</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        業種を選ぶと、その業種のスターターFAQが入ります。最初から動かせて、あとから自由に編集できます。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INDUSTRY_TEMPLATES.map((t, i) => {
          const p = PALETTE[i % PALETTE.length];
          const Icon = p.icon;
          return (
            <div
              key={t.key}
              className="rounded-xl border border-[var(--color-hairline)] bg-white p-5 transition hover:border-[var(--color-brand)] hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.chip}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-semibold text-neutral-900">{t.name}</h2>
                    <span className="shrink-0 rounded-full bg-[var(--color-brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-brand)]">
                      FAQ {t.faqs.length}件
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{t.description}</p>
                </div>
              </div>

              <form action={importTemplateAction} className="mt-4">
                <input type="hidden" name="template_key" value={t.key} />
                <SubmitButton
                  pendingText="取り込み中…"
                  className="w-full rounded-md bg-[var(--color-brand)] py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  このテンプレを取り込む
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        ※ 取り込むと、選んだ業種のFAQが「公開」状態で追加されます。重複して取り込むと同じFAQが増えるのでご注意ください。
      </p>
    </div>
  );
}
