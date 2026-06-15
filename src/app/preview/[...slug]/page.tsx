import Link from "next/link";
import { Hammer, ArrowLeft } from "lucide-react";

// 左メニューのうち、まだ見本ページを用意していない項目の受け皿（404を出さない）。
// 既存の preview/faqs などの具体ページが優先され、未定義のパスだけここに来る。
export default function PreviewPlaceholder() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-[var(--color-hairline)] bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <Hammer className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-neutral-900">この画面は準備中です</p>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          見本では、主要な「ダッシュボード」「チャット」「FAQ」「改善候補」「業界テンプレート」を体験できます。その他の画面は順次追加予定です。
        </p>
        <Link
          href="/preview"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードへ戻る
        </Link>
      </div>
    </div>
  );
}
