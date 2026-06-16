import { redirect } from "next/navigation";
import { getCurrentUser, getMyOrganizations, getProjects } from "@/lib/auth/context";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 会社“と”プロジェクトが両方あればセットアップ完了 → 管理画面へ。
  // 会社だけ有ってプロジェクトが無い人（前回の途中失敗）は、ここで続きを作れるよう
  // フォームを表示する（即/adminに飛ばすと永久に詰まるため）。
  const orgs = await getMyOrganizations();
  if (orgs.length > 0) {
    const projects = await getProjects(orgs[0].organization_id);
    if (projects.length > 0) redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">
            ようこそ！最初の設定をしましょう
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            会社と、最初のチャットボット（プロジェクト）を作ります。
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
