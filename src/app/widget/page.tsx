import { DifyChat } from "@/components/preview/dify-chat";

// 外部サイトに iframe で埋め込まれるチャット本体ページ。
// お客さん（エンドユーザー）が見る画面＝管理画面の「デモチャット」と同一（Dify・青）。
export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>;
}) {
  // k（プロジェクトキー）は将来のマルチテナント用に受け取るが、
  // 現状は単一テナント（共有Difyアプリ）のため未使用。
  await searchParams;

  return (
    <div className="aops-widget-root flex h-screen w-screen items-center justify-center bg-transparent p-2">
      <DifyChat />
    </div>
  );
}
