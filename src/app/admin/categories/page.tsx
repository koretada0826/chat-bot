import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { DeleteButton } from "@/components/ui/delete-button";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: categories } = project
    ? await supabase
        .from("faq_categories")
        .select("id, name, is_public, sort_order")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">カテゴリ</h1>
      <p className="mt-1 text-sm text-neutral-500">
        質問の分類です。チャットのクリックメニューになります。
      </p>

      {/* 追加フォーム */}
      <form
        action={createCategory}
        className="mt-6 flex gap-2 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <input
          name="name"
          required
          placeholder="例：配送について"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          追加
        </button>
      </form>

      {/* 一覧 */}
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white">
        {(categories ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">
            まだカテゴリがありません。
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(categories ?? []).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-neutral-800">{c.name}</span>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <DeleteButton confirmText={`カテゴリ「${c.name}」を削除しますか？このカテゴリのFAQは未分類になります。`} />
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
