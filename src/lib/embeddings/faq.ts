// FAQの「意味の数字（embedding）」を作って保存する部品
import type { SupabaseClient } from "@supabase/supabase-js";
import { getEmbeddingProvider } from "@/lib/llm";
import { recordEmbeddingUsage } from "@/lib/usage/record";

// 1件のFAQについて、古いベクトルを消して新しく作り直す
export async function regenerateFaqEmbedding(
  supabase: SupabaseClient,
  params: { projectId: string; faqId: string; question: string; answer: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const provider = getEmbeddingProvider();
    const content = `${params.question}\n${params.answer}`;
    const { vectors, totalTokens } = await provider.embed([content]);
    const embedding = vectors[0];

    // 古いものを消してから入れる（モデル混在を避ける）
    await supabase.from("faq_embeddings").delete().eq("faq_id", params.faqId);
    const { error } = await supabase.from("faq_embeddings").insert({
      faq_id: params.faqId,
      project_id: params.projectId,
      content,
      embedding,
      model: provider.model,
    });
    if (error) return { ok: false, error: error.message };

    // 使用量を記録（会社IDはプロジェクトから引く）
    const { data: proj } = await supabase
      .from("projects")
      .select("organization_id")
      .eq("id", params.projectId)
      .maybeSingle();
    if (proj?.organization_id) {
      await recordEmbeddingUsage(supabase, {
        organizationId: proj.organization_id,
        projectId: params.projectId,
        feature: "faq_embed",
        model: provider.model,
        totalTokens,
      });
    }

    return { ok: true };
  } catch (e) {
    // 鍵が無い等で失敗しても、FAQ保存そのものは止めない
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
