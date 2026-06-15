"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProject } from "@/lib/auth/context";

// 使ってよいAIモデル（不正な文字列で全チャットが停止しないように許可リスト化）
const ALLOWED_MODELS = [
  "",
  "claude-opus-4-8",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
];

// 0〜1にそろえる
function clamp01(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

export async function updateSettings(formData: FormData) {
  const project = await getCurrentProject();
  if (!project) throw new Error("プロジェクトが見つかりません。");

  const greeting = String(formData.get("greeting_message") ?? "").trim();
  const placeholder = String(formData.get("placeholder") ?? "").trim();
  const fallback = String(formData.get("fallback_message") ?? "").trim();
  const showCategories = formData.get("show_categories") === "on";
  const inquiryEnabled = formData.get("inquiry_enabled") === "on";

  // しきい値は 0〜1 に強制し、low <= high の整合も保つ
  let tauHigh = clamp01(Number(formData.get("tau_faq_high")), 0.82);
  let tauLow = clamp01(Number(formData.get("tau_faq_low")), 0.7);
  const tauDoc = clamp01(Number(formData.get("tau_doc")), 0.75);
  if (tauLow > tauHigh) {
    const t = tauLow;
    tauLow = tauHigh;
    tauHigh = t;
  }

  // モデル名は許可リストのみ。未知の値は既定（空＝Claude既定）に倒す
  const rawModel = String(formData.get("llm_model") ?? "").trim();
  const llmModel = ALLOWED_MODELS.includes(rawModel) ? rawModel || null : null;

  const supabase = await createClient();
  // update ではなく upsert（行が無くても必ず作る＝無言で消えない）
  const { error } = await supabase.from("chatbot_settings").upsert(
    {
      project_id: project.id,
      greeting_message: greeting,
      placeholder,
      fallback_message: fallback,
      show_categories: showCategories,
      inquiry_enabled: inquiryEnabled,
      tau_faq_high: tauHigh,
      tau_faq_low: tauLow,
      tau_doc: tauDoc,
      llm_model: llmModel,
    },
    { onConflict: "project_id" },
  );
  if (error) throw new Error("保存に失敗しました: " + error.message);

  revalidatePath("/admin/settings");
}
