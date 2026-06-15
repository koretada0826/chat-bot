import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { updateSettings } from "./actions";

export default async function SettingsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: s } = project
    ? await supabase
        .from("chatbot_settings")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-900">チャットボット設定</h1>
      <p className="mt-1 text-sm text-neutral-500">
        あいさつ文や、回答の慎重さ（しきい値）を調整できます。
      </p>

      <form
        action={updateSettings}
        className="mt-6 space-y-5 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm text-neutral-700">最初のあいさつ</label>
          <input
            name="greeting_message"
            defaultValue={s?.greeting_message ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-700">入力欄のヒント文</label>
          <input
            name="placeholder"
            defaultValue={s?.placeholder ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-700">
            回答できないときの文面
          </label>
          <textarea
            name="fallback_message"
            rows={2}
            defaultValue={s?.fallback_message ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="show_categories"
              defaultChecked={s?.show_categories ?? true}
              className="h-4 w-4"
            />
            カテゴリメニューを表示
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="inquiry_enabled"
              defaultChecked={s?.inquiry_enabled ?? true}
              className="h-4 w-4"
            />
            問い合わせ案内を出す
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              即答のしきい値（高いほど慎重）
            </label>
            <input
              name="tau_faq_high"
              type="number"
              step="0.01"
              min="0"
              max="1"
              defaultValue={s?.tau_faq_high ?? 0.82}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              回答する最低ライン
            </label>
            <input
              name="tau_faq_low"
              type="number"
              step="0.01"
              min="0"
              max="1"
              defaultValue={s?.tau_faq_low ?? 0.7}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-700">
              資料を採用する最低ライン
            </label>
            <input
              name="tau_doc"
              type="number"
              step="0.01"
              min="0"
              max="1"
              defaultValue={s?.tau_doc ?? 0.75}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-700">
            使うAIモデル（空欄なら既定）
          </label>
          <input
            name="llm_model"
            defaultValue={s?.llm_model ?? ""}
            placeholder="claude-opus-4-8"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          保存する
        </button>
      </form>
    </div>
  );
}
