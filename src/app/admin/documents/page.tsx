import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProject } from "@/lib/auth/context";
import { DeleteButton } from "@/components/ui/delete-button";
import { uploadDocument, reprocessDocument, deleteDocument } from "./actions";

// 大きめ資料の裏処理に余裕を持たせる（環境が許す範囲で）
export const maxDuration = 300;

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending: { text: "待機中", cls: "bg-neutral-100 text-neutral-500" },
  processing: { text: "処理中", cls: "bg-amber-50 text-amber-600" },
  ready: { text: "準備OK", cls: "bg-emerald-50 text-emerald-700" },
  failed: { text: "失敗", cls: "bg-red-50 text-red-600" },
};

export default async function DocumentsPage() {
  const project = await getCurrentProject();
  const supabase = await createClient();

  // 見回り：10分以上「処理中」のまま固まった資料は「失敗」に戻す（再処理できるように）
  if (project) {
    // Server Componentはリクエスト毎に1回実行されるため現在時刻の取得は妥当（純度ルールの誤検知）
    // eslint-disable-next-line react-hooks/purity
    const stuckBefore = new Date(Date.now() - 10 * 60_000).toISOString();
    await createAdminClient()
      .from("documents")
      .update({ status: "failed", error: "処理がタイムアウトしました。再処理してください。" })
      .eq("project_id", project.id)
      .eq("status", "processing")
      .lt("updated_at", stuckBefore);
  }

  const { data: docs } = project
    ? await supabase
        .from("documents")
        .select("id, title, file_type, status, chunk_count, error, created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">ドキュメント</h1>
      <p className="mt-1 text-sm text-neutral-500">
        PDF・Word・CSV・Markdown・txt をアップすると、その中身からも回答できます（RAG）。
      </p>

      {/* アップロード */}
      <form
        action={uploadDocument}
        className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,.csv,.md,.markdown,.txt"
          required
          className="flex-1 text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-brand)] file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          アップロード
        </button>
      </form>
      <p className="mt-1 text-xs text-neutral-400">
        ※ アップロード後、裏で読み取り処理が走ります。大きい資料は数十秒かかることがあります。「処理中」のまま変わらない場合は、少し待って再読み込み、または「再処理」を押してください。
      </p>

      {/* 一覧 */}
      <div className="mt-4 rounded-lg border border-neutral-200 bg-white">
        {(docs ?? []).length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">まだ資料がありません。</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(docs ?? []).map((d) => {
              const st = STATUS_LABEL[d.status] ?? STATUS_LABEL.pending;
              return (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${st.cls}`}>
                    {st.text}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-neutral-800">{d.title}</p>
                    {d.status === "ready" && (
                      <p className="text-xs text-neutral-400">{d.chunk_count}個のかけらに分割</p>
                    )}
                    {d.status === "failed" && d.error && (
                      <p className="truncate text-xs text-red-500">{d.error}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs uppercase text-neutral-400">
                    {d.file_type}
                  </span>
                  <form action={reprocessDocument} className="shrink-0">
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="text-xs text-neutral-500 hover:text-neutral-900">
                      再処理
                    </button>
                  </form>
                  <form action={deleteDocument} className="shrink-0">
                    <input type="hidden" name="id" value={d.id} />
                    <DeleteButton confirmText={`資料「${d.title}」を削除しますか？関連データも消えます。`} />
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
