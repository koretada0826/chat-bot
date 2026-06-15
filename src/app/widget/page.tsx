import { ChatPanel } from "@/components/chat/chat-panel";

// 外部サイトに iframe で埋め込まれるチャット本体ページ
export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;

  if (!k) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent p-4 text-sm text-neutral-500">
        プロジェクトキーがありません。
      </div>
    );
  }

  return (
    <div className="aops-widget-root h-screen w-screen bg-transparent p-2">
      <ChatPanel projectKey={k} />
    </div>
  );
}
