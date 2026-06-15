// ログイン中の人と、その会社・プロジェクトをまとめて取ってくる部品
import { createClient } from "@/lib/supabase/server";

export interface Membership {
  organization_id: string;
  role: string;
  organizations: { id: string; name: string } | null;
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// 所属している会社の一覧を返す（無ければ空）
// ★ 必ず「自分の所属行」だけに絞る。
//   絞らないとRLSで同じ会社の他メンバー(owner等)の行も返り、
//   自分(viewer)が他人のroleを継承して権限昇格してしまう。
export async function getMyOrganizations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Membership[];
}

// ある会社のプロジェクト一覧
export async function getProjects(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, use_case, onboarding_completed_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export interface CurrentProject {
  id: string;
  name: string;
  organization_id: string;
  role: string; // この組織での自分の役割（owner/admin/member/viewer）
}

// 書き込み権限（owner / admin）かどうか
export function canWrite(project: CurrentProject | null): boolean {
  return !!project && (project.role === "owner" || project.role === "admin");
}

// いま操作しているプロジェクトを返す。
// MVPでは「最初の会社（サイドバーに出している会社）の最初のプロジェクト」を採用。
// ★ 必ず organization_id で明示的に絞る（複数組織所属時に別会社を操作しないため）。
// 将来は projects 切り替えUI / URLの projectId で差し替える。
export async function getCurrentProject(): Promise<CurrentProject | null> {
  const supabase = await createClient();

  // サイドバー表示と一致させるため、先頭の所属組織に固定する
  const orgs = await getMyOrganizations();
  const org = orgs[0];
  if (!org) return null;

  const { data } = await supabase
    .from("projects")
    .select("id, name, organization_id")
    .eq("organization_id", org.organization_id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { ...(data as Omit<CurrentProject, "role">), role: org.role };
}
