import { redirect } from "next/navigation";
import { getCurrentUser, getMyOrganizations } from "@/lib/auth/context";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // すでに会社があるなら管理画面へ
  const orgs = await getMyOrganizations();
  if (orgs.length > 0) redirect("/admin");

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
