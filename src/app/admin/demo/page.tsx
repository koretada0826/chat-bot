import { Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { DifyChat } from "@/components/preview/dify-chat";

export default async function DemoPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();
  const { data } = project
    ? await supabase.from("projects").select("public_key").eq("id", project.id).maybeSingle()
    : { data: null };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          <Bot className="h-5 w-5" strokeWidth={2} />
        </span>
        <h1 className="text-lg font-semibold text-neutral-900">デモチャット</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        お客さんが実際に見るチャットと<span className="font-medium text-[var(--color-brand)]">同じ画面</span>です。
        ここで試した会話は<span className="font-medium text-[var(--color-brand)]">ダッシュボードにも記録</span>されます。
      </p>

      <div className="mt-6 flex justify-center">
        <DifyChat projectKey={data?.public_key} />
      </div>

      <p className="mx-auto mt-4 max-w-md text-center text-xs text-neutral-400">
        ※ このチャットを、お客さんのサイトに「埋め込み」ページから設置できます。
      </p>
    </div>
  );
}
