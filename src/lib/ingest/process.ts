// 資料を「読み取り→区切り→意味の数字→保存」までまとめる処理エンジン
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmbeddingProvider } from "@/lib/llm";
import { recordEmbeddingUsage } from "@/lib/usage/record";
import { extractText, type FileType } from "./extract";
import { chunkText } from "./chunk";

const MAX_CHUNKS = 400; // コスト・負荷の上限

export async function processDocument(
  supabase: SupabaseClient,
  params: {
    documentId: string;
    projectId: string;
    organizationId: string;
    fileType: FileType;
    buffer: Buffer;
  },
): Promise<{ ok: boolean; chunkCount: number; error?: string }> {
  const { documentId, projectId, organizationId, fileType, buffer } = params;

  await supabase.from("documents").update({ status: "processing", error: null }).eq("id", documentId);

  // 1. 文章を取り出す
  const { text, error } = await extractText(buffer, fileType);
  if (error || !text.trim()) {
    await supabase
      .from("documents")
      .update({ status: "failed", error: error ?? "文章を取り出せませんでした。" })
      .eq("id", documentId);
    return { ok: false, chunkCount: 0, error: error ?? "空の文章" };
  }

  // 2. 区切る
  const chunks = chunkText(text).slice(0, MAX_CHUNKS);
  if (chunks.length === 0) {
    await supabase.from("documents").update({ status: "failed", error: "区切れませんでした。" }).eq("id", documentId);
    return { ok: false, chunkCount: 0, error: "区切れませんでした。" };
  }

  // 3. 意味の数字をまとめて作る
  // ※ getEmbeddingProvider() 自体が鍵未設定でthrowするので、必ずtry内で呼ぶ
  let embeddings: number[][];
  try {
    const provider = getEmbeddingProvider();
    const { vectors, totalTokens } = await provider.embed(chunks.map((c) => c.content));
    embeddings = vectors;
    await recordEmbeddingUsage(supabase, {
      organizationId,
      projectId,
      feature: "doc_ingest",
      model: provider.model,
      totalTokens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("documents")
      .update({ status: "failed", error: "AIの鍵が必要です: " + msg })
      .eq("id", documentId);
    return { ok: false, chunkCount: 0, error: msg };
  }

  // 4. まず古いチャンクのIDを控える（新を入れてから消す＝途中失敗で知識を失わない）
  const { data: oldChunks } = await supabase
    .from("document_chunks")
    .select("id")
    .eq("document_id", documentId);
  const oldIds = (oldChunks ?? []).map((c) => c.id);

  const rows = chunks.map((c, i) => ({
    document_id: documentId,
    project_id: projectId,
    chunk_index: c.index,
    content: c.content,
    heading_path: c.headingPath,
    embedding: embeddings[i],
    token_count: Math.ceil(c.content.length / 2),
  }));
  const { error: insErr } = await supabase.from("document_chunks").insert(rows);
  if (insErr) {
    // 新規挿入に失敗。古いチャンクはそのまま残す（回答に使える状態を維持）
    await supabase.from("documents").update({ status: "failed", error: insErr.message }).eq("id", documentId);
    return { ok: false, chunkCount: 0, error: insErr.message };
  }
  // 挿入成功後に古いチャンクを削除
  if (oldIds.length > 0) {
    await supabase.from("document_chunks").delete().in("id", oldIds);
  }

  // 5. 完了
  await supabase
    .from("documents")
    .update({ status: "ready", chunk_count: chunks.length, error: null })
    .eq("id", documentId);

  return { ok: true, chunkCount: chunks.length };
}
