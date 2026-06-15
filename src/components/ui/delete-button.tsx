"use client";

import { useFormStatus } from "react-dom";

// 削除前に確認ダイアログを出すボタン。<form action={deleteAction}> の中で使う。
// 誤クリックによる復旧不能な削除を防ぐ。
export function DeleteButton({
  confirmText = "本当に削除しますか？この操作は元に戻せません。",
  label = "削除",
  className = "text-xs text-neutral-400 hover:text-red-600",
}: {
  confirmText?: string;
  label?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? "削除中…" : label}
    </button>
  );
}
