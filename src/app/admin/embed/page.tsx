import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { CopyButton } from "@/components/ui/copy-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { addDomain, deleteDomain } from "./actions";

export default async function EmbedPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  const { data: proj } = project
    ? await supabase.from("projects").select("public_key").eq("id", project.id).maybeSingle()
    : { data: null };

  const { data: domains } = project
    ? await supabase
        .from("embed_domains")
        .select("id, domain, enabled")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.example.com";
  const snippet = `<script src="${appUrl}/widget.js" data-project="${proj?.public_key ?? "PUBLIC_KEY"}" async></script>`;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-900">埋め込みコード</h1>
      <p className="mt-1 text-sm text-neutral-500">
        このコードをWebサイトに貼ると、右下にチャットが表示されます。
      </p>

      {/* コード */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">貼り付けるコード</p>
          <CopyButton text={snippet} />
        </div>
        <pre className="overflow-x-auto rounded-md bg-neutral-900 p-4 text-xs text-neutral-100">
          {snippet}
        </pre>
        <p className="mt-2 text-xs text-neutral-400">
          ※ このコードを &lt;/body&gt; の直前に貼ると、右下にチャットボタンが表示されます。
        </p>
      </div>

      {/* 許可ドメイン */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-neutral-900">許可ドメイン</p>
        <p className="mb-3 text-xs text-neutral-400">
          チャットを表示するサイトのドメインを登録してください。
          <span className="text-amber-600">
            （※ ここに登録したサイトでのみ表示・動作します。未登録のサイトでは表示されません）
          </span>
        </p>

        <form action={addDomain} className="flex gap-2">
          <input
            name="domain"
            placeholder="example.com"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            追加
          </button>
        </form>

        <ul className="mt-3 divide-y divide-neutral-100">
          {(domains ?? []).length === 0 ? (
            <li className="py-2 text-sm text-neutral-400">まだ登録がありません。</li>
          ) : (
            (domains ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-neutral-800">{d.domain}</span>
                <form action={deleteDomain}>
                  <input type="hidden" name="id" value={d.id} />
                  <DeleteButton confirmText={`ドメイン「${d.domain}」を削除しますか？`} />
                </form>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
