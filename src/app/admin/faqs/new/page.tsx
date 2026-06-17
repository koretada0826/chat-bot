import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { FaqFields } from "@/components/admin/faq-fields";
import { createFaq } from "../actions";

export default async function NewFaqPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();
  const { data: categories } = project
    ? await supabase
        .from("faq_categories")
        .select("id, name")
        .eq("project_id", project.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  return (
    <div className="max-w-2xl">
      <Link href="/admin/faqs" className="text-sm text-neutral-500 hover:underline">
        ← FAQ一覧へ戻る
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-neutral-900">新規FAQ</h1>

      <form
        action={createFaq}
        className="mt-6 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <FaqFields categories={categories ?? []} showPublishToggle />
        <div className="mt-6 flex justify-end gap-2">
          <Link
            href="/admin/faqs"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            作成する
          </button>
        </div>
      </form>
    </div>
  );
}
