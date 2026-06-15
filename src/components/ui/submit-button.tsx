"use client";

import { useFormStatus } from "react-dom";

// 送信中は自動で無効化＋文言切替する送信ボタン（二重送信・連打防止）。
// <form> の中で使うこと。
export function SubmitButton({
  children,
  pendingText = "処理中…",
  className = "rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
