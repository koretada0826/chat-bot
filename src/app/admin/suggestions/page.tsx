import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { generateAction, approveAction, rejectAction } from "./actions";

interface Payload {
  question?: string;
  answer?: string;
  suggested_category?: string;
}
interface Evidence {
  count?: number;
  examples?: string[];
}

export default async function SuggestionsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: suggestions } = project
    ? await supabase
        .from("improvement_suggestions")
        .select("id, type, title, summary, payload, evidence, priority")
        .eq("project_id", project.id)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">改善候補</h1>
          <p className="mt-1 text-sm text-neutral-500">
            答えられなかった質問から、AIが新しいFAQ案を作ります。確認・修正して公開できます。
          </p>
        </div>
        <form action={generateAction}>
          <SubmitButton pendingText="AI生成中…（数十秒）">未解決から生成</SubmitButton>
        </form>
      </div>

      <div className="mt-6 space-y-4">
        {(suggestions ?? []).length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-500">
              改善候補はまだありません。未解決の質問がたまったら「未解決から生成」を押してください。
            </p>
          </div>
        ) : (
          (suggestions ?? []).map((s) => {
            const payload = (s.payload ?? {}) as Payload;
            const evidence = (s.evidence ?? {}) as Evidence;
            return (
              <div key={s.id} className="rounded-lg border border-neutral-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white">
                    新FAQ案
                  </span>
                  {evidence.count ? (
                    <span className="text-xs text-neutral-400">
                      未解決 {evidence.count}件をまとめ
                    </span>
                  ) : null}
                </div>

                <form action={approveAction} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={s.id} />
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">質問</label>
                    <input
                      name="question"
                      defaultValue={payload.question ?? s.title ?? ""}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">
                      答え（下書き：内容を確認・修正してください）
                    </label>
                    <textarea
                      name="answer"
                      rows={4}
                      defaultValue={payload.answer ?? ""}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <SubmitButton pendingText="公開中…">承認して公開</SubmitButton>
                  </div>
                </form>

                <form action={rejectAction} className="mt-2">
                  <input type="hidden" name="id" value={s.id} />
                  <DeleteButton label="却下する" confirmText="この改善候補を却下しますか？" />
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
