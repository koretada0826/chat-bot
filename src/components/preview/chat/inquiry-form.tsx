"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { INQUIRY_TYPES } from "@/lib/preview/demo-data";

export function InquiryForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] p-4 text-center">
        <CheckCircle2 className="mx-auto h-6 w-6 text-[var(--color-success)]" />
        <p className="mt-1.5 text-sm font-medium text-neutral-800">送信しました（見本）</p>
        <p className="mt-0.5 text-xs text-neutral-500">担当者に引き継がれます。</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-2.5 rounded-xl border border-[var(--color-hairline)] bg-white p-3.5"
    >
      <p className="text-xs font-semibold text-neutral-800">問い合わせフォーム</p>
      <p className="text-[11px] text-neutral-400">送信すると担当者に引き継がれます。</p>

      <Field label="お名前">
        <input className={input} placeholder="山田 太郎" required />
      </Field>
      <Field label="メールアドレス">
        <input type="email" className={input} placeholder="you@example.com" required />
      </Field>
      <Field label="会社名">
        <input className={input} placeholder="株式会社サンプル" />
      </Field>
      <Field label="問い合わせ種別">
        <select className={input} defaultValue="">
          <option value="" disabled>
            選択してください
          </option>
          {INQUIRY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="内容">
        <textarea rows={3} className={input} placeholder="お問い合わせ内容をご記入ください" />
      </Field>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Send className="h-4 w-4" />
        送信する
      </button>
    </form>
  );
}

const input =
  "w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-brand)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
