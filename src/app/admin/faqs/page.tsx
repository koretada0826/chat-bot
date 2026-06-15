import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { DeleteButton } from "@/components/ui/delete-button";
import { togglePublish, deleteFaq } from "./actions";

export default async function FaqsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: faqs } = project
    ? await supabase
        .from("faqs")
        .select("id, question, status, category_id, faq_categories(name)")
        .eq("project_id", project.id)
        .order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">FAQ</h1>
          <p className="mt-1 text-sm text-neutral-500">
            お客さんに答える「正しい答え」の一覧です。
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          新規FAQ
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        {(faqs ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">
            まだFAQがありません。「新規FAQ」から追加してください。
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(faqs ?? []).map((f) => {
              const category = Array.isArray(f.faq_categories)
                ? f.faq_categories[0]
                : f.faq_categories;
              const published = f.status === "published";
              return (
                <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                      published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {published ? "公開" : "下書き"}
                  </span>
                  <Link
                    href={`/admin/faqs/${f.id}`}
                    className="flex-1 truncate text-sm text-neutral-800 hover:underline"
                  >
                    {f.question}
                  </Link>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {category?.name ?? "未分類"}
                  </span>
                  <form action={togglePublish} className="shrink-0">
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="status" value={f.status} />
                    <button
                      type="submit"
                      className="text-xs text-neutral-500 hover:text-neutral-900"
                    >
                      {published ? "非公開に" : "公開に"}
                    </button>
                  </form>
                  <form action={deleteFaq} className="shrink-0">
                    <input type="hidden" name="id" value={f.id} />
                    <DeleteButton confirmText={`「${f.question}」を削除しますか？元に戻せません。`} />
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
