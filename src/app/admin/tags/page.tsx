import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { DeleteButton } from "@/components/ui/delete-button";
import { createTag, deleteTag } from "./actions";

export default async function TagsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: tags } = project
    ? await supabase
        .from("faq_tags")
        .select("id, name")
        .eq("project_id", project.id)
        .order("name", { ascending: true })
    : { data: [] };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">タグ</h1>
      <p className="mt-1 text-sm text-neutral-500">
        FAQを横断的に整理するためのラベルです。
      </p>
      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        ※ FAQへのタグ付けUIは近日対応予定です。現在はタグの作成・削除のみ行えます。
      </p>

      <form
        action={createTag}
        className="mt-6 flex gap-2 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <input
          name="name"
          placeholder="例：キャンペーン"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          追加
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {(tags ?? []).length === 0 ? (
          <p className="text-sm text-neutral-400">まだタグがありません。</p>
        ) : (
          (tags ?? []).map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm text-neutral-700"
            >
              {t.name}
              <form action={deleteTag} className="inline">
                <input type="hidden" name="id" value={t.id} />
                <DeleteButton
                  label="×"
                  confirmText={`タグ「${t.name}」を削除しますか？`}
                  className="text-neutral-300 hover:text-red-600"
                />
              </form>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
