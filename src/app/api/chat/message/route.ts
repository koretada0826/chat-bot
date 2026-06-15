import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectByKey } from "@/lib/chat/public";
import { answerQuestion } from "@/lib/answer";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { isAllowedOrigin, getClientIp } from "@/lib/chat/origin";
import { isOverDailyCap } from "@/lib/chat/quota";
import { sanitizeOutput } from "@/lib/guard/injection";

const MAX_LEN = 2000;

export async function POST(request: Request) {
  let body: { session_id?: string; project_key?: string; message?: string; page_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "JSONが不正です" } }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (!body.project_key || !body.session_id || !message) {
    return NextResponse.json({ error: { message: "入力が不足しています" } }, { status: 400 });
  }
  if (message.length > MAX_LEN) {
    return NextResponse.json({ error: { message: "メッセージが長すぎます" } }, { status: 400 });
  }

  // 連打しすぎを防ぐ（IP×プロジェクト単位で 1分30回まで）。
  // ※ session_id 単位だと新規IDを量産して回避できるため IP を基準にする。
  const ip = getClientIp(request);
  const rl = checkRateLimit(`msg:${ip}:${body.project_key}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: "短時間に送りすぎです。少し待ってください。" } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 30) } },
    );
  }

  const proj = await getProjectByKey(body.project_key);
  if (!proj) {
    return NextResponse.json({ error: { message: "プロジェクトが見つかりません" } }, { status: 404 });
  }

  // 許可サイトからのアクセスか確認
  if (!(await isAllowedOrigin(request, proj.projectId))) {
    return NextResponse.json({ error: { message: "このサイトからは利用できません" } }, { status: 403 });
  }

  const admin = createAdminClient();

  // コスト上限：1日の使用量が上限を超えていたら、AIを呼ばずに案内だけ返す（暴走防止）
  if (await isOverDailyCap(admin, proj.projectId)) {
    return NextResponse.json({
      message_id: null,
      answer: "申し訳ございません。本日のご利用が混み合っております。時間をおいて再度お試しください。",
      answer_type: "unanswered",
      sources: [],
      related_faqs: [],
      show_inquiry: proj.settings.inquiry_enabled,
    });
  }

  // セッションがこのプロジェクトのものか確認
  const { data: session } = await admin
    .from("chat_sessions")
    .select("id, project_id")
    .eq("id", body.session_id)
    .maybeSingle();
  if (!session || session.project_id !== proj.projectId) {
    return NextResponse.json({ error: { message: "セッションが不正です" } }, { status: 400 });
  }

  // ユーザーの発言を保存
  await admin.from("chat_messages").insert({
    session_id: session.id,
    project_id: proj.projectId,
    role: "user",
    content_raw: message,
  });
  await admin.from("bot_events").insert({
    project_id: proj.projectId,
    session_id: session.id,
    event_type: "message_sent",
  });

  // 回答エンジンを通す
  const started = Date.now();
  const result = await answerQuestion(admin, {
    projectId: proj.projectId,
    organizationId: proj.organizationId,
    settings: proj.settings,
    question: message,
  });
  const latency = Date.now() - started;

  const answered = result.answerType !== "unanswered";

  // AIの返答を保存
  const { data: assistantMsg } = await admin
    .from("chat_messages")
    .insert({
      session_id: session.id,
      project_id: proj.projectId,
      role: "assistant",
      content_raw: result.answer,
      content_normalized: result.normalizedQuestion,
      answer_type: result.answerType,
      confidence: result.confidence,
      latency_ms: latency,
    })
    .select("id")
    .single();

  const messageId = assistantMsg?.id ?? null;

  // 根拠（FAQ / 資料）を保存
  if (messageId && result.sources.length > 0) {
    await admin.from("answer_sources").insert(
      result.sources.map((s, i) => ({
        message_id: messageId,
        project_id: proj.projectId,
        source_type: s.type,
        faq_id: s.type === "faq" ? s.id : null,
        document_id: s.type === "document" ? s.documentId : null,
        chunk_id: s.type === "document" ? s.chunkId : null,
        score: result.confidence,
        rank: i + 1,
      })),
    );

    // 参照された資料の参照回数を加算（ランキング用）
    const docIds = [
      ...new Set(result.sources.filter((s) => s.type === "document").map((s) => (s as { documentId: string }).documentId)),
    ];
    for (const docId of docIds) {
      await admin.rpc("increment_document_reference", { p_document_id: docId });
    }
  }

  // 出来事ログ
  await admin.from("bot_events").insert({
    project_id: proj.projectId,
    session_id: session.id,
    event_type: answered ? "answer_served" : "unanswered",
    answer_type: result.answerType,
    meta: { reason: result.reason },
  });

  // 答えられなかったら「未解決質問」にためる
  if (result.answerType === "unanswered") {
    await admin.from("unresolved_questions").insert({
      project_id: proj.projectId,
      session_id: session.id,
      message_id: messageId,
      question_raw: message,
      question_normalized: result.normalizedQuestion,
      reason: result.reason,
      best_score: result.confidence,
    });
  }

  return NextResponse.json({
    message_id: messageId,
    answer: result.answer,
    answer_type: result.answerType,
    // お客さん向けには {type, id, title} だけ返す（資料は場所も付ける／機密フィルター適用）
    sources: result.sources.map((s) => ({
      type: s.type,
      id: s.id,
      title: sanitizeOutput(
        s.type === "document" && s.location ? `${s.title}（${s.location}）` : s.title,
      ),
    })),
    related_faqs: result.relatedFaqs,
    show_inquiry: result.answerType === "unanswered" && proj.settings.inquiry_enabled,
  });
}
