import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectByKey } from "@/lib/chat/public";
import { isAllowedOrigin, getClientIp } from "@/lib/chat/origin";
import { checkRateLimit } from "@/lib/chat/rate-limit";

export async function POST(request: Request) {
  // 連打防止（IP単位で 1分30回まで）。セッション量産による濫用を抑える。
  const ip = getClientIp(request);
  const rl = checkRateLimit(`session:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { message: "アクセスが多すぎます。少し待ってください。" } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 30) } },
    );
  }

  let body: {
    project_key?: string;
    page_url?: string;
    visitor_id?: string;
    external_user_id?: string;
    locale?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "JSONが不正です" } }, { status: 400 });
  }

  if (!body.project_key) {
    return NextResponse.json({ error: { message: "project_key が必要です" } }, { status: 400 });
  }

  const proj = await getProjectByKey(body.project_key);
  if (!proj) {
    return NextResponse.json({ error: { message: "プロジェクトが見つかりません" } }, { status: 404 });
  }

  // 許可されたサイトからのアクセスかを確認（curl等の直叩き・他サイト濫用を弾く）
  if (!(await isAllowedOrigin(request, proj.projectId))) {
    return NextResponse.json({ error: { message: "このサイトからは利用できません" } }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from("chat_sessions")
    .insert({
      project_id: proj.projectId,
      visitor_id: body.visitor_id ?? null,
      external_user_id: body.external_user_id ?? null,
      page_url: body.page_url ?? null,
      locale: body.locale ?? null,
      user_agent: request.headers.get("user-agent") ?? null,
    })
    .select("id")
    .single();
  if (error || !session) {
    return NextResponse.json({ error: { message: "セッション作成に失敗しました" } }, { status: 500 });
  }

  await admin.from("bot_events").insert({
    project_id: proj.projectId,
    session_id: session.id,
    event_type: "session_start",
  });

  return NextResponse.json({
    session_id: session.id,
    settings: {
      greeting: proj.settings.greeting_message,
      placeholder: proj.settings.placeholder,
      show_categories: proj.settings.show_categories,
      inquiry_enabled: proj.settings.inquiry_enabled,
      theme: proj.settings.theme,
      categories: proj.categories,
    },
  });
}
