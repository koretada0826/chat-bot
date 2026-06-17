import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { DeleteButton } from "@/components/ui/delete-button";
import { createTerm, deleteTerm } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  synonym: "言い換え",
  jargon: "社内用語",
  abbrev: "略語",
};

export default async function DictionaryPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: terms } = project
    ? await supabase
        .from("dictionary_terms")
        .select("id, term, canonical, type, enabled")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">辞書</h1>
      <p className="mt-1 text-sm text-neutral-500">
        言い方の違いを揃えます。例「送料」を「配送料」に統一すると検索が当たりやすくなります。
      </p>

      {/* 追加フォーム */}
      <form
        action={createTerm}
        className="mt-6 grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
      >
        <input
          name="term"
          required
          placeholder="入力されうる語（例：送料）"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <input
          name="canonical"
          required
          placeholder="正しい語（例：配送料）"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <select
          name="type"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        >
          <option value="synonym">言い換え</option>
          <option value="jargon">社内用語</option>
          <option value="abbrev">略語</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          追加
        </button>
      </form>

      {/* 一覧 */}
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white">
        {(terms ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">まだ登録がありません。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(terms ?? []).map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="text-neutral-800">{t.term}</span>
                <span className="text-neutral-400">→</span>
                <span className="text-neutral-800">{t.canonical}</span>
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                  {TYPE_LABEL[t.type] ?? t.type}
                </span>
                <form action={deleteTerm} className="ml-auto">
                  <input type="hidden" name="id" value={t.id} />
                  <DeleteButton confirmText={`「${t.term} → ${t.canonical}」を削除しますか？`} />
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
