import { redirect } from "next/navigation";
import { getCurrentUser, getMyOrganizations, getProjects } from "@/lib/auth/context";
import { Sidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = await getMyOrganizations();
  // まだ会社が無ければ、最初のセットアップへ
  if (orgs.length === 0) redirect("/onboarding");

  // 会社はあるがプロジェクトが無い（前回の途中失敗）→ セットアップの続きへ。
  // これを入れないと、機能が一切使えない /admin に固定されてしまう。
  const projects = await getProjects(orgs[0].organization_id);
  if (projects.length === 0) redirect("/onboarding");

  const orgName = orgs[0]?.organizations?.name ?? "マイ組織";

  return (
    <div className="flex h-screen bg-[var(--color-canvas)]">
      <Sidebar orgName={orgName} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
