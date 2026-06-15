import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function DemoPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data } = project
    ? await supabase
        .from("projects")
        .select("public_key")
        .eq("id", project.id)
        .maybeSingle()
    : { data: null };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">デモチャット</h1>
      <p className="mt-1 text-sm text-neutral-500">
        本番と同じ回答ロジックで、その場でテストできます。FAQを登録してから試してください。
      </p>

      <div className="mt-6 flex justify-center">
        {data?.public_key ? (
          <ChatPanel projectKey={data.public_key} />
        ) : (
          <p className="text-sm text-neutral-500">プロジェクトが見つかりません。</p>
        )}
      </div>
    </div>
  );
}
