"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { generateSuggestions } from "@/lib/improve/generate";
import { regenerateFaqEmbedding } from "@/lib/embeddings/faq";

// 未解決質問から改善候補を生成
export async function generateAction() {
  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");
  const supabase = await createClient();
  await generateSuggestions(supabase, project.id, project.organization_id);
  revalidatePath("/admin/suggestions");
}

// 改善候補を承認 → FAQとして公開
export async function approveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!id || !question || !answer) throw new Error("入力が不足しています。");

  const supabase = await createClient();

  const { data: sug } = await supabase
    .from("improvement_suggestions")
    .select("id, project_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!sug || sug.status !== "pending") throw new Error("この候補は処理できません。");

  // FAQを作成（公開）
  const { data: faq, error } = await supabase
    .from("faqs")
    .insert({
      project_id: sug.project_id,
      question,
      answer,
      status: "published",
      source_suggestion_id: id,
    })
    .select("id")
    .single();
  if (error || !faq) throw new Error("FAQ作成に失敗しました: " + error?.message);

  await regenerateFaqEmbedding(supabase, {
    projectId: sug.project_id,
    faqId: faq.id,
    question,
    answer,
  });

  await supabase
    .from("improvement_suggestions")
    .update({ status: "applied", applied_faq_id: faq.id })
    .eq("id", id);

  revalidatePath("/admin/suggestions");
  revalidatePath("/admin/faqs");
}

// 改善候補を却下
export async function rejectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("improvement_suggestions")
    .update({ status: "rejected" })
    .eq("id", id);
  revalidatePath("/admin/suggestions");
}
