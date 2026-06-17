// Dify連携チャットの会話を、AnswerOpsのダッシュボード用テーブルに記録する“橋渡し”。
// ネイティブ回答エンジンと同じ器（chat_sessions / chat_messages / bot_events /
// unresolved_questions / usage_events）に書くことで、Difyで答えても
// 「質問ログ・質問数・よくある質問・AI回答率・使用量・改善候補」が機能する。
//
// ※ 記録はすべて best-effort。失敗してもチャット応答自体は止めない。
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectByKey } from "@/lib/chat/public";
import { recordLLMUsage } from "@/lib/usage/record";

export interface DifyLogInput {
  projectKey: string;
  sessionId: string | null; // 継続中の会話。無ければ新規セッションを作る。
  query: string;
  answer: string;
  latencyMs: number;
  totalTokens: number;
  pageUrl?: string | null;
  userAgent?: string | null;
}

export interface DifyLogResult {
  sessionId: string;
  messageId: string | null; // 記録した「AI返答」のID（フィードバック用）
}

export async function logDifyTurn(input: DifyLogInput): Promise<DifyLogResult | null> {
  try {
    const proj = await getProjectByKey(input.projectKey);
    if (!proj) return null;

    const admin = createAdminClient();

    // 1) セッション（無ければ新規作成。既存なら本プロジェクトのものか確認）
    let sessionId = input.sessionId;
    if (sessionId) {
      const { data: s } = await admin
        .from("chat_sessions")
        .select("id, project_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (!s || s.project_id !== proj.projectId) sessionId = null;
    }
    if (!sessionId) {
      const { data: created } = await admin
        .from("chat_sessions")
        .insert({
          project_id: proj.projectId,
          page_url: input.pageUrl ?? null,
          user_agent: input.userAgent ?? null,
        })
        .select("id")
        .single();
      if (!created) return null;
      sessionId = created.id;
      await admin.from("bot_events").insert({
        project_id: proj.projectId,
        session_id: sessionId,
        event_type: "session_start",
      });
    }
    if (!sessionId) return null; // ここで sessionId は string に確定

    // 2) ユーザーの質問
    await admin.from("chat_messages").insert({
      session_id: sessionId,
      project_id: proj.projectId,
      role: "user",
      content_raw: input.query,
    });
    await admin.from("bot_events").insert({
      project_id: proj.projectId,
      session_id: sessionId,
      event_type: "message_sent",
    });

    // 3) AIの返答（空＝答えられなかった と判定）
    const answered = input.answer.trim().length > 0;
    const { data: assistantMsg } = await admin
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        project_id: proj.projectId,
        role: "assistant",
        content_raw: input.answer,
        answer_type: answered ? "dify" : "unanswered",
        latency_ms: input.latencyMs,
        model: "dify",
        token_usage: input.totalTokens > 0 ? { total_tokens: input.totalTokens } : null,
      })
      .select("id")
      .single();
    const messageId = assistantMsg?.id ?? null;

    // 4) 出来事ログ（AI回答率の母数）
    await admin.from("bot_events").insert({
      project_id: proj.projectId,
      session_id: sessionId,
      event_type: answered ? "answer_served" : "unanswered",
      answer_type: answered ? "dify" : "unanswered",
    });

    // 5) 使用量（Difyのトークン）。コスト表は別モデルのため0計上でも、量は可視化される。
    if (input.totalTokens > 0) {
      await recordLLMUsage(admin, {
        organizationId: proj.organizationId,
        projectId: proj.projectId,
        feature: "dify_chat",
        model: "dify",
        inputTokens: 0,
        outputTokens: input.totalTokens,
      });
    }

    // 6) 空回答は未解決として残す（改善候補の素）
    if (!answered && messageId) {
      await admin.from("unresolved_questions").upsert(
        {
          project_id: proj.projectId,
          session_id: sessionId,
          message_id: messageId,
          question_raw: input.query,
          question_normalized: input.query,
          reason: "dify_empty",
        },
        { onConflict: "message_id,session_id", ignoreDuplicates: true },
      );
    }

    return { sessionId, messageId };
  } catch {
    // 記録失敗はチャットの妨げにしない
    return null;
  }
}
