"use client";

// 管理画面内で予期せぬエラーが起きたときの受け皿（500画面にしない）
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-neutral-900">
        問題が発生しました
      </p>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        画面の読み込み中にエラーが発生しました。再読み込みしても直らない場合は、しばらくしてからお試しください。
      </p>
      {error?.message && (
        <p className="mt-2 max-w-md break-words text-xs text-neutral-400">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-5 rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        再読み込み
      </button>
    </div>
  );
}
