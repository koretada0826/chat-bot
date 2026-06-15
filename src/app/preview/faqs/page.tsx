"use client";

import { useEffect, useState } from "react";
import { Card, Badge, PageHeader } from "@/components/ui/saas";
import { FileQuestion, Plus } from "lucide-react";
import { getActiveIndustry, getPool, industryName, type PoolFaq } from "@/lib/preview/active";

export default function PreviewFaqs() {
  const [faqs, setFaqs] = useState<PoolFaq[]>([]);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    // ブラウザ保存(localStorage)はマウント後に読む（SSRとのズレ回避のため意図的にeffectで反映）
    const key = getActiveIndustry();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFaqs(getPool(key));
    setLabel(industryName(key));
  }, []);

  return (
    <div>
      <PageHeader
        icon={FileQuestion}
        title="FAQ"
        desc={
          label
            ? `お客様に答える「正しい答え」の一覧です。（業種：${label}）`
            : "お客様に答える「正しい答え」の一覧です。"
        }
        action={
          <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            新規FAQ
          </button>
        }
      />

      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-[var(--color-hairline)]">
          {faqs.map((f, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Badge tone="success">公開</Badge>
              <span className="flex-1 truncate text-sm text-neutral-800">{f.question}</span>
              <span className="shrink-0 text-xs text-neutral-500">{f.category}</span>
            </li>
          ))}
          {faqs.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-neutral-400">読み込み中…</li>
          )}
        </ul>
      </Card>

      <p className="mt-3 text-xs text-neutral-500">
        ※ 見本では代表的なFAQのみ表示しています。「業界テンプレート」で業種を取り込むと、ここの一覧が切り替わります。
      </p>
    </div>
  );
}
