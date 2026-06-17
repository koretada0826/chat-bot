import { DifyChat } from "@/components/preview/dify-chat";

// 外部サイトに iframe で埋め込まれるチャット本体ページ。
// お客さん（エンドユーザー）が見る画面＝管理画面の「デモチャット」と同一（Dify・青）。
// k（プロジェクトキー＝public_key）を渡すと、会話がそのプロジェクトの
// ダッシュボードに記録され、解決/未解決のフィードバックも集まる。
export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  const { k } = await searchParams;

  return (
    <div className="aops-widget-root flex h-screen w-screen items-center justify-center bg-transparent p-2">
      <DifyChat projectKey={k} />
    </div>
  );
}
