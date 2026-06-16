"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OnboardingState {
  error?: string;
}

// 会社（組織）と最初のプロジェクトをまとめて作る。
// useActionState 用に、失敗時は {error} を返す（throwしない＝500画面にしない）。
//
// ★ 重要: 作成は admin(service_role) で行う。
//   新規登録の瞬間はユーザーがどの組織にも所属していないため、
//   organization_members への「自己挿入」がRLSのブートストラップ規則で詰まりやすい
//   （自分が作った組織を“メンバーになる前”に参照する必要があり、権限が循環する）。
//   そこで本人確認だけユーザーセッションで行い、実際の作成はサーバー権限で
//   「値を必ず user.id に固定して」安全に行う（他人の組織は一切触れない）。
//   さらに各ステップを「無ければ作る」方式にし、途中失敗しても再送信で続きから復旧できる。
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

  // 1) 本人確認（誰の登録かを確定）。ここだけユーザーセッションを使う。
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2) 以降の作成はサーバー権限。値は必ず user.id に固定。
  const admin = createAdminClient();

  // 既存の所属組織（前回の途中失敗で残ったものを含む）を探して復旧する
  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let orgId = membership?.organization_id ?? null;

  // 所属はまだ無いが「自分が作った組織」が残っていれば再利用（メンバー登録前で失敗した残り）
  if (!orgId) {
    const { data: orphanOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    orgId = orphanOrg?.id ?? null;
  }

  // 組織が無ければ作る
  if (!orgId) {
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: orgName, created_by: user.id })
      .select("id")
      .single();
    if (orgErr || !org) {
      console.error("[onboarding] 組織作成に失敗", orgErr);
      return { error: "会社の作成に失敗しました。時間をおいて再度お試しください。" };
    }
    orgId = org.id;
  }

  // 自分をオーナーとして所属させる（無ければ作る）
  const { data: existingMember } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existingMember) {
    const { error: memErr } = await admin.from("organization_members").insert({
      organization_id: orgId,
      user_id: user.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });
    if (memErr) {
      console.error("[onboarding] メンバー登録に失敗", memErr);
      return { error: "メンバー登録に失敗しました。時間をおいて再度お試しください。" };
    }
  }

  // すでにプロジェクトがあればセットアップ済み → 管理画面へ
  const { data: existingProject } = await admin
    .from("projects")
    .select("id")
    .eq("organization_id", orgId)
    .limit(1)
    .maybeSingle();
  if (existingProject) redirect("/admin");

  // 最初のプロジェクトを作る
  const { data: project, error: projErr } = await admin
    .from("projects")
    .insert({ organization_id: orgId, name: projectName, use_case: useCase })
    .select("id")
    .single();
  if (projErr || !project) {
    console.error("[onboarding] プロジェクト作成に失敗", projErr);
    return { error: "プロジェクト作成に失敗しました。もう一度「作成」を押すと続きから再開できます。" };
  }

  // チャットボット設定の初期レコードを作る
  await admin.from("chatbot_settings").insert({ project_id: project.id });

  redirect("/admin");
}
