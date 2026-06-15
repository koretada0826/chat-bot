// 公開キー(public_key)から、プロジェクト・設定・カテゴリを取る部品。
// 公開APIの裏側で使う。必ず project_id を絞って使うこと。
import { createAdminClient } from "@/lib/supabase/admin";
import type { AnswerSettings } from "@/lib/answer";

export interface PublicProject {
  projectId: string;
  organizationId: string;
  settings: AnswerSettings & {
    greeting_message: string;
    placeholder: string;
    show_categories: boolean;
    inquiry_enabled: boolean;
    theme: Record<string, unknown>;
  };
  categories: { id: string; name: string }[];
}

export async function getProjectByKey(
  publicKey: string,
): Promise<PublicProject | null> {
  const admin = createAdminClient();

  const { data: project } = await admin
    .from("projects")
    .select("id, organization_id")
    .eq("public_key", publicKey)
    .maybeSingle();
  if (!project) return null;

  const { data: s } = await admin
    .from("chatbot_settings")
    .select(
      "greeting_message, placeholder, show_categories, inquiry_enabled, theme, tau_faq_high, tau_faq_low, tau_doc, llm_model, fallback_message",
    )
    .eq("project_id", project.id)
    .maybeSingle();

  const { data: cats } = await admin
    .from("faq_categories")
    .select("id, name")
    .eq("project_id", project.id)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });

  return {
    projectId: project.id,
    organizationId: project.organization_id,
    settings: {
      greeting_message: s?.greeting_message ?? "こんにちは！ご質問をどうぞ。",
      placeholder: s?.placeholder ?? "メッセージを入力…",
      show_categories: s?.show_categories ?? true,
      inquiry_enabled: s?.inquiry_enabled ?? true,
      theme: (s?.theme as Record<string, unknown>) ?? {},
      tau_faq_high: Number(s?.tau_faq_high ?? 0.82),
      tau_faq_low: Number(s?.tau_faq_low ?? 0.7),
      tau_doc: Number(s?.tau_doc ?? 0.75),
      llm_model: s?.llm_model ?? null,
      fallback_message:
        s?.fallback_message ??
        "登録されている情報からは確認できませんでした。お手数ですがお問い合わせください。",
    },
    categories: cats ?? [],
  };
}
