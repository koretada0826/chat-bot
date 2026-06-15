"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

export async function addDomain(formData: FormData) {
  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");
  const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
  if (!domain) throw new Error("ドメインを入力してください。");

  const supabase = await createClient();
  const { error } = await supabase
    .from("embed_domains")
    .insert({ project_id: project.id, domain });
  if (error) throw new Error("追加に失敗しました: " + error.message);
  revalidatePath("/admin/embed");
}

export async function deleteDomain(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("embed_domains").delete().eq("id", id);
  revalidatePath("/admin/embed");
}
