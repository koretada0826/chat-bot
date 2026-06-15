"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

export async function createTerm(formData: FormData) {
  const term = String(formData.get("term") ?? "").trim();
  const canonical = String(formData.get("canonical") ?? "").trim();
  const type = String(formData.get("type") ?? "synonym");
  if (!term || !canonical) throw new Error("両方の語を入力してください。");

  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");

  const supabase = await createClient();
  const { error } = await supabase
    .from("dictionary_terms")
    .insert({ project_id: project.id, term, canonical, type });
  if (error) throw new Error("追加に失敗しました: " + error.message);

  revalidatePath("/admin/dictionary");
}

export async function deleteTerm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("dictionary_terms")
    .delete()
    .eq("id", id);
  if (error) throw new Error("削除に失敗しました: " + error.message);

  revalidatePath("/admin/dictionary");
}
