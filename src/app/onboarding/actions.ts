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

  // ★ 途中失敗からの“復旧”に対応する。
  //   以前は「会社あり→即/adminへ」だったため、
  //   会社は出来たがプロジェクト作成で失敗した人が、二度とプロジェクトを作れず
  //   /admin で機能ゼロのまま固定（孤児化）していた。
  //   そこで「既存の会社があれば再利用し、足りない分（プロジェクト/設定）だけ作る」。

  // 既に所属している会社があるか
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let orgId = membership?.organization_id ?? null;

  if (orgId) {
    // 既に会社があり、プロジェクトも揃っていればセットアップ済み → /admin
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();
    if (existingProject) redirect("/admin");
    // 会社はあるがプロジェクトが無い＝前回の途中失敗。下でプロジェクトだけ作る。
  } else {
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
    orgId = org.id;
  }

  // 3. 最初のプロジェクトを作る
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .insert({ organization_id: orgId, name: projectName, use_case: useCase })
    .select("id")
    .single();
  if (projErr || !project) {
    // 会社は出来ているので、もう一度送信すればこのプロジェクト作成から再開できる
    return { error: "プロジェクト作成に失敗しました。もう一度「作成」を押すと続きから再開できます。" };
  }

  // 4. チャットボット設定の初期レコードを作る
  await supabase.from("chatbot_settings").insert({ project_id: project.id });

  redirect("/admin");
}
