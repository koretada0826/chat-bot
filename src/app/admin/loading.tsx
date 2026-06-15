// 管理画面の読み込み中に出すスケルトン（白画面固着を防ぐ）
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-48 rounded bg-neutral-200" />
      <div className="mt-2 h-4 w-72 rounded bg-neutral-100" />
      <div className="mt-6 space-y-3">
        <div className="h-16 rounded-lg bg-neutral-100" />
        <div className="h-16 rounded-lg bg-neutral-100" />
        <div className="h-16 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}
