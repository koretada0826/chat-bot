"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";
import { importTemplate } from "@/lib/templates/import";

export async function importTemplateAction(formData: FormData) {
  const templateKey = String(formData.get("template_key") ?? "");
  if (!templateKey) throw new Error("業種が選ばれていません。");

  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");

  const supabase = await createClient();
  const { error } = await importTemplate(supabase, { projectId: project.id, templateKey });
  if (error) throw new Error(error);

  revalidatePath("/admin/faqs");
  redirect("/admin/faqs");
}
