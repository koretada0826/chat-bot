// FAQの入力欄（新規・編集の両方で使い回す）
interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  defaultQuestion?: string;
  defaultAnswer?: string;
  defaultCategoryId?: string | null;
  showPublishToggle?: boolean;
}

export function FaqFields({
  categories,
  defaultQuestion = "",
  defaultAnswer = "",
  defaultCategoryId = null,
  showPublishToggle = false,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-700">質問</label>
        <input
          name="question"
          required
          defaultValue={defaultQuestion}
          placeholder="例：返品はできますか？"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-700">答え</label>
        <textarea
          name="answer"
          required
          rows={6}
          defaultValue={defaultAnswer}
          placeholder="例：商品到着後7日以内であれば返品を承ります。"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-700">
          カテゴリ（任意）
        </label>
        <select
          name="category_id"
          defaultValue={defaultCategoryId ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        >
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {showPublishToggle && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="publish" className="h-4 w-4" />
          作成と同時に公開する
        </label>
      )}
    </div>
  );
}
