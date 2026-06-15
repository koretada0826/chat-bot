// 使用量（トークン）を台帳(usage_events)に1件記録する部品
import type { SupabaseClient } from "@supabase/supabase-js";
import { llmCostUsd, embeddingCostUsd } from "./pricing";

interface RecordParams {
  organizationId: string;
  projectId?: string | null;
  feature: string; // chat_answer / doc_ingest / suggestion / faq_embed / query_embed
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

// AIの呼び出し1回ぶんの使用量を記録する。失敗してもアプリは止めない（best-effort）。
export async function recordLLMUsage(
  supabase: SupabaseClient,
  p: RecordParams & { inputTokens: number; outputTokens: number },
): Promise<void> {
  try {
    const total = p.inputTokens + p.outputTokens;
    const cost = llmCostUsd(p.model, p.inputTokens, p.outputTokens);
    await supabase.from("usage_events").insert({
      organization_id: p.organizationId,
      project_id: p.projectId ?? null,
      kind: "llm",
      feature: p.feature,
      model: p.model,
      input_tokens: p.inputTokens,
      output_tokens: p.outputTokens,
      total_tokens: total,
      cost_usd: cost,
    });
  } catch {
    /* 計測の失敗は無視 */
  }
}

export async function recordEmbeddingUsage(
  supabase: SupabaseClient,
  p: RecordParams & { totalTokens: number },
): Promise<void> {
  try {
    const cost = embeddingCostUsd(p.model, p.totalTokens);
    await supabase.from("usage_events").insert({
      organization_id: p.organizationId,
      project_id: p.projectId ?? null,
      kind: "embedding",
      feature: p.feature,
      model: p.model,
      input_tokens: p.totalTokens,
      output_tokens: 0,
      total_tokens: p.totalTokens,
      cost_usd: cost,
    });
  } catch {
    /* 計測の失敗は無視 */
  }
}
