"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface OnboardingState {
  error?: string;
}

// 会社（組織）と最初のプロジェクトをまとめて作る。
// useActionState 用に、失敗時は {error} を返す（throwしない＝500画面にしない）。
export async function createOrgAndProject(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const orgName = String(formData.get("orgName") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim();
  const useCase = String(formData.get("useCase") ?? "").trim() || null;

  if (!orgName || !projectName) {
    return { error: "会社名とプロジェクト名は必須です。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // すでに会社があるなら二重作成しない
  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) redirect("/admin");

  // 1. 組織を作る
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name: orgName, created_by: user.id })
    .select("id")
    .single();
  if (orgErr || !org) {
    return { error: "会社の作成に失敗しました。時間をおいて再度お試しください。" };
  }

  // 2. 自分をオーナーとして所属させる
  const { error: memErr } = await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });
  if (memErr) {
    return { error: "メンバー登録に失敗しました。時間をおいて再度お試しください。" };
  }

  // 3. 最初のプロジェクトを作る
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, name: projectName, use_case: useCase })
    .select("id")
    .single();
  if (projErr || !project) {
    return { error: "プロジェクト作成に失敗しました。時間をおいて再度お試しください。" };
  }

  // 4. チャットボット設定の初期レコードを作る
  await supabase.from("chatbot_settings").insert({ project_id: project.id });

  redirect("/admin");
}
