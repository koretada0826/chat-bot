"use client";

import { useActionState } from "react";
import { createOrgAndProject, type OnboardingState } from "@/app/onboarding/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const USE_CASES = [
  "社外問い合わせ",
  "社内問い合わせ",
  "EC",
  "情報システム",
  "人事総務",
  "コールセンター",
  "その他",
];

export function OnboardingForm() {
  const [state, formAction] = useActionState<OnboardingState, FormData>(
    createOrgAndProject,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6"
    >
      <div>
        <label className="mb-1 block text-sm text-neutral-700">会社名</label>
        <input
          name="orgName"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          placeholder="株式会社サンプル"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-700">プロジェクト名</label>
        <input
          name="projectName"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          placeholder="サポート用チャットボット"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-700">利用目的（任意）</label>
        <select
          name="useCase"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        >
          <option value="">選択しない</option>
          {USE_CASES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitButton
        pendingText="作成中…"
        className="w-full rounded-md bg-neutral-900 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        作成して始める
      </SubmitButton>
    </form>
  );
}
