"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { LayoutTemplate, Check, ArrowRight } from "lucide-react";
import { INDUSTRY_TEMPLATES } from "@/lib/templates/data";
import { getActiveIndustry, setActiveIndustry } from "@/lib/preview/active";

export default function PreviewTemplates() {
  const [active, setActive] = useState<string | null>(null);
  const [justImported, setJustImported] = useState<string | null>(null);

  useEffect(() => {
    // ブラウザ保存(localStorage)はマウント後に読む（SSRとのズレ回避のため意図的にeffectで反映）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(getActiveIndustry());
  }, []);

  function handleImport(key: string) {
    setActiveIndustry(key);
    setActive(key);
    setJustImported(key);
  }

  return (
    <div>
      <PageHeader
        icon={LayoutTemplate}
        title="業界テンプレート"
        desc="会社ごとに業種を選ぶと、その業種のスターターFAQが入ります。会社Aは「EC」、会社Bは「不動産」…と別々に選べます。"
      />

      {justImported && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] px-4 py-3 text-sm text-neutral-700">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-[var(--color-success)]" />
            「{INDUSTRY_TEMPLATES.find((t) => t.key === justImported)?.name}」を取り込みました。
          </span>
          <span className="flex gap-3">
            <Link href="/preview/faqs" className="inline-flex items-center gap-1 font-medium text-[var(--color-brand)] hover:underline">
              FAQを見る <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/preview/chat" className="inline-flex items-center gap-1 font-medium text-[var(--color-brand)] hover:underline">
              チャットで試す <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {INDUSTRY_TEMPLATES.map((t) => {
          const isActive = active === t.key;
          return (
            <Card key={t.key} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-900">{t.name}</h2>
                <Badge tone="neutral">FAQ {t.faqs.length}件</Badge>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{t.description}</p>

              <ul className="mt-3 space-y-1 border-t border-[var(--color-hairline)] pt-3">
                {t.faqs.slice(0, 3).map((f, i) => (
                  <li key={i} className="truncate text-xs text-neutral-500">
                    ・{f.question}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleImport(t.key)}
                className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium ${
                  isActive
                    ? "border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] text-[var(--color-success)]"
                    : "bg-[var(--color-brand)] text-white hover:opacity-90"
                }`}
              >
                {isActive ? (
                  <>
                    <Check className="h-4 w-4" />
                    取り込み済み（もう一度押すと再取込）
                  </>
                ) : (
                  "このテンプレを取り込む"
                )}
              </button>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        ※ 見本ではブラウザ内にだけ保存されます（他の人には影響しません）。本番では選んだ業種のFAQが自社に入ります。
      </p>
    </div>
  );
}
