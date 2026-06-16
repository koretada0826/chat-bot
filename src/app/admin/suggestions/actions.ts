"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject, canWrite } from "@/lib/auth/context";
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

  // ★ 操作中プロジェクトと書き込み権限を確認（他プロジェクト/閲覧専用ユーザーの誤操作を防ぐ）
  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");
  if (!canWrite(project)) throw new Error("この操作の権限がありません。");

  const supabase = await createClient();

  const { data: sug } = await supabase
    .from("improvement_suggestions")
    .select("id, project_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!sug || sug.status !== "pending") throw new Error("この候補は処理できません。");
  // ★ 候補が「今操作しているプロジェクト」のものか照合（クロスプロジェクト公開を防ぐ）
  if (sug.project_id !== project.id) throw new Error("別プロジェクトの候補は操作できません。");

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

  // 意味検索用ベクトルを作る。鍵未設定等で失敗してもFAQ自体はキーワード検索で機能する。
  const emb = await regenerateFaqEmbedding(supabase, {
    projectId: sug.project_id,
    faqId: faq.id,
    question,
    answer,
  });
  if (!emb.ok) {
    // 失敗を握りつぶさずログに残す（意味検索が未反映だと運用者が気づけるように）
    console.error(`[suggestions] FAQ埋め込み生成に失敗 faq=${faq.id}: ${emb.error ?? "unknown"}`);
  }

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
