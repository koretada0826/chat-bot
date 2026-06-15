"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { regenerateFaqEmbedding } from "@/lib/embeddings/faq";

// FAQを新規作成（作成後は一覧へ）
export async function createFaq(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const publish = formData.get("publish") === "on";

  if (!question || !answer) throw new Error("質問と答えは必須です。");

  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");

  const supabase = await createClient();
  const { data: faq, error } = await supabase
    .from("faqs")
    .insert({
      project_id: project.id,
      category_id: categoryId,
      question,
      answer,
      status: publish ? "published" : "draft",
    })
    .select("id")
    .single();
  if (error || !faq) throw new Error("作成に失敗しました: " + error?.message);

  // 意味検索のためのベクトルを作る（失敗してもFAQ自体は作成済み）
  await regenerateFaqEmbedding(supabase, {
    projectId: project.id,
    faqId: faq.id,
    question,
    answer,
  });

  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

// FAQを更新
export async function updateFaq(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const categoryId = String(formData.get("category_id") ?? "") || null;
  if (!id || !question || !answer) throw new Error("入力が不足しています。");

  const supabase = await createClient();
  const { data: faq, error } = await supabase
    .from("faqs")
    .update({ question, answer, category_id: categoryId })
    .eq("id", id)
    .select("id, project_id")
    .single();
  if (error || !faq) throw new Error("更新に失敗しました: " + error?.message);

  // 内容が変わったので意味の数字を作り直す
  await regenerateFaqEmbedding(supabase, {
    projectId: faq.project_id,
    faqId: faq.id,
    question,
    answer,
  });

  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}

// 公開 / 非公開を切り替え
export async function togglePublish(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const current = String(formData.get("status") ?? "");
  const next = current === "published" ? "draft" : "published";

  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({ status: next })
    .eq("id", id);
  if (error) throw new Error("切り替えに失敗しました: " + error.message);

  revalidatePath("/admin/faqs");
}

// FAQを削除
export async function deleteFaq(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw new Error("削除に失敗しました: " + error.message);

  revalidatePath("/admin/faqs");
}
