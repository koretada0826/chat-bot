import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectByKey } from "@/lib/chat/public";
import { isAllowedOrigin, getClientIp } from "@/lib/chat/origin";
import { checkRateLimit } from "@/lib/chat/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`fb:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: "アクセスが多すぎます。少し待ってください。" } },
      { status: 429 },
    );
  }

  let body: {
    project_key?: string;
    session_id?: string;
    message_id?: string;
    rating?: string;
    comment?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "JSONが不正です" } }, { status: 400 });
  }

  const allowed = ["resolved", "unresolved", "up", "down"];
  if (!body.project_key || !body.session_id || !body.message_id || !allowed.includes(body.rating ?? "")) {
    return NextResponse.json({ error: { message: "入力が不正です" } }, { status: 400 });
  }

  const proj = await getProjectByKey(body.project_key);
  if (!proj) {
    return NextResponse.json({ error: { message: "プロジェクトが見つかりません" } }, { status: 404 });
  }

  if (!(await isAllowedOrigin(request, proj.projectId))) {
    return NextResponse.json({ error: { message: "このサイトからは利用できません" } }, { status: 403 });
  }

  const admin = createAdminClient();

  // メッセージがこのプロジェクトのものか確認
  const { data: msg } = await admin
    .from("chat_messages")
    .select("id, project_id, session_id, created_at")
    .eq("id", body.message_id)
    .maybeSingle();
  if (!msg || msg.project_id !== proj.projectId) {
    return NextResponse.json({ error: { message: "メッセージが不正です" } }, { status: 400 });
  }

  // session_id は信頼できる「メッセージ側」の値を使う（改ざん防止）
  const sessionId = msg.session_id;

  // 多重投稿は1票に（同じ回答×同じセッションは上書き）
  await admin.from("feedbacks").upsert(
    {
      message_id: body.message_id,
      session_id: sessionId,
      project_id: proj.projectId,
      rating: body.rating,
      comment: body.comment ?? null,
    },
    { onConflict: "message_id,session_id" },
  );

  await admin.from("bot_events").insert({
    project_id: proj.projectId,
    session_id: sessionId,
    event_type: "feedback",
    meta: { rating: body.rating },
  });

  // 「未解決」と言われたら、改善のもとして残す
  if (body.rating === "unresolved") {
    // この回答の「直前のユーザー発言（=実際の質問）」を引いて保存する
    const { data: userMsg } = await admin
      .from("chat_messages")
      .select("content_raw, content_normalized")
      .eq("session_id", msg.session_id)
      .eq("role", "user")
      .lt("created_at", msg.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userMsg?.content_raw) {
      // 同じ回答×同じセッションの「未解決」再送で増殖しないよう upsert（重複は無視）
      await admin.from("unresolved_questions").upsert(
        {
          project_id: proj.projectId,
          session_id: sessionId,
          message_id: body.message_id,
          question_raw: userMsg.content_raw,
          question_normalized: userMsg.content_normalized ?? userMsg.content_raw,
          reason: "feedback_unresolved",
        },
        { onConflict: "message_id,session_id", ignoreDuplicates: true },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    next: { show_inquiry: body.rating === "unresolved" && proj.settings.inquiry_enabled },
  });
}
