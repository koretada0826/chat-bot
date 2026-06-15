// 資料の「かけら（チャンク）」を意味で探す部品
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DocCandidate {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  headingPath: string | null;
  pageNo: number | null;
  score: number;
}

export async function searchDocuments(
  supabase: SupabaseClient,
  params: { projectId: string; queryEmbedding: number[] | null; count?: number },
): Promise<DocCandidate[]> {
  if (!params.queryEmbedding) return []; // 意味の数字が無いと探せない
  const { data, error } = await supabase.rpc("match_document_chunks", {
    p_project_id: params.projectId,
    p_query_embedding: params.queryEmbedding,
    p_match_threshold: 0,
    p_match_count: params.count ?? 5,
  });
  if (error || !data) return [];
  return (
    data as {
      chunk_id: string;
      document_id: string;
      document_title: string;
      content: string;
      heading_path: string | null;
      page_no: number | null;
      similarity: number;
    }[]
  ).map((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    documentTitle: r.document_title,
    content: r.content,
    headingPath: r.heading_path,
    pageNo: r.page_no,
    score: r.similarity,
  }));
}
