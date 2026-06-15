import { DemoSidebar } from "@/components/preview/demo-sidebar";
import { DemoHeader } from "@/components/preview/demo-header";

// 見本（デモ）：認証もDBも不要。サンプルデータで「完成品っぽい」画面を見せる。
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[var(--color-canvas)]">
      <DemoSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
