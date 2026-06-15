"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("カテゴリ名を入力してください。");

  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");

  const supabase = await createClient();
  const { error } = await supabase
    .from("faq_categories")
    .insert({ project_id: project.id, name });
  if (error) throw new Error("追加に失敗しました: " + error.message);

  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("faq_categories").delete().eq("id", id);
  if (error) throw new Error("削除に失敗しました: " + error.message);

  revalidatePath("/admin/categories");
}
