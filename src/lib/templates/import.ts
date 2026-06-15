// 業界テンプレートを、ある会社のプロジェクトに取り込む部品
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTemplate } from "./data";
import { regenerateFaqEmbedding } from "@/lib/embeddings/faq";

export async function importTemplate(
  supabase: SupabaseClient,
  params: { projectId: string; templateKey: string },
): Promise<{ imported: number; error?: string }> {
  const template = getTemplate(params.templateKey);
  if (!template) return { imported: 0, error: "テンプレートが見つかりません。" };

  const { projectId } = params;

  // 1. 既存カテゴリを取得（名前→IDのマップ）
  const { data: existingCats } = await supabase
    .from("faq_categories")
    .select("id, name")
    .eq("project_id", projectId);
  const catMap = new Map<string, string>();
  for (const c of existingCats ?? []) catMap.set(c.name, c.id);

  // 2. 足りないカテゴリを作る
  const neededCats = [...new Set(template.faqs.map((f) => f.category))];
  let order = (existingCats?.length ?? 0) + 1;
  for (const name of neededCats) {
    if (catMap.has(name)) continue;
    const { data: cat } = await supabase
      .from("faq_categories")
      .insert({ project_id: projectId, name, sort_order: order++ })
      .select("id")
      .single();
    if (cat) catMap.set(name, cat.id);
  }

  // 既存FAQの質問文（重複取り込みを防ぐため）
  const { data: existingFaqs } = await supabase
    .from("faqs")
    .select("question")
    .eq("project_id", projectId);
  const existingQuestions = new Set((existingFaqs ?? []).map((f) => f.question));

  // 3. FAQを作る（公開状態）＋ ベクトル生成（同じ質問は飛ばす）
  let imported = 0;
  for (const f of template.faqs) {
    if (existingQuestions.has(f.question)) continue;
    const { data: faq } = await supabase
      .from("faqs")
      .insert({
        project_id: projectId,
        category_id: catMap.get(f.category) ?? null,
        question: f.question,
        answer: f.answer,
        status: "published",
      })
      .select("id")
      .single();
    if (!faq) continue;

    await regenerateFaqEmbedding(supabase, {
      projectId,
      faqId: faq.id,
      question: f.question,
      answer: f.answer,
    });
    imported++;
  }

  // 4. プロジェクトの利用目的が未設定なら埋める
  await supabase
    .from("projects")
    .update({ use_case: template.useCase })
    .eq("id", projectId)
    .is("use_case", null);

  return { imported };
}
