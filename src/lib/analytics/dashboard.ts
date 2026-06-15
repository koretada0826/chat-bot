// ダッシュボードの数字を計算する部品
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardData {
  questions: { today: number; last7: number; last30: number };
  rates: {
    aiAnswerRate: number | null; // AI回答率
    resolvedRate: number | null; // 解決率
    unresolvedRate: number | null; // 未解決率
    lowRatingRate: number | null; // 低評価率
  };
  trend: { day: string; count: number }[];
  topQuestions: { question: string; count: number }[];
  topUnresolved: { question: string; count: number }[];
  suggestions: {
    id: string;
    type: string;
    title: string | null;
    priority: number;
  }[];
}

function sinceDaysISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

async function countRows(
  supabase: SupabaseClient,
  table: string,
  equals: Record<string, string>,
  since?: string,
): Promise<number> {
  // count だけ取得（行は取らない）
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [k, v] of Object.entries(equals)) q = q.eq(k, v);
  if (since) q = q.gte("created_at", since);
  const { count } = await q;
  return count ?? 0;
}

function ratio(a: number, b: number): number | null {
  const total = a + b;
  return total === 0 ? null : a / total;
}

export async function getDashboard(
  supabase: SupabaseClient,
  projectId: string,
): Promise<DashboardData> {
  // 質問数（今日 / 7日 / 30日）
  const [today, last7, last30] = await Promise.all([
    countRows(supabase, "chat_messages", { project_id: projectId, role: "user" }, sinceDaysISO(1)),
    countRows(supabase, "chat_messages", { project_id: projectId, role: "user" }, sinceDaysISO(7)),
    countRows(supabase, "chat_messages", { project_id: projectId, role: "user" }, sinceDaysISO(30)),
  ]);

  // AI回答率（直近30日）
  const since30 = sinceDaysISO(30);
  const [served, unanswered] = await Promise.all([
    countRows(supabase, "bot_events", { project_id: projectId, event_type: "answer_served" }, since30),
    countRows(supabase, "bot_events", { project_id: projectId, event_type: "unanswered" }, since30),
  ]);

  // フィードバック（解決 / 未解決 / 低評価）
  const [resolved, unresolvedFb, down, up] = await Promise.all([
    countRows(supabase, "feedbacks", { project_id: projectId, rating: "resolved" }, since30),
    countRows(supabase, "feedbacks", { project_id: projectId, rating: "unresolved" }, since30),
    countRows(supabase, "feedbacks", { project_id: projectId, rating: "down" }, since30),
    countRows(supabase, "feedbacks", { project_id: projectId, rating: "up" }, since30),
  ]);

  const totalFb = resolved + unresolvedFb + down + up;

  // ランキング・推移（RPC）
  const [trendRes, topQRes, topURes, sugRes] = await Promise.all([
    supabase.rpc("count_messages_by_day", { p_project_id: projectId, p_days: 14 }),
    supabase.rpc("top_questions", { p_project_id: projectId, p_days: 30, p_limit: 8 }),
    supabase.rpc("top_unresolved", { p_project_id: projectId, p_limit: 8 }),
    supabase
      .from("improvement_suggestions")
      .select("id, type, title, priority")
      .eq("project_id", projectId)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(5),
  ]);

  return {
    questions: { today, last7, last30 },
    rates: {
      aiAnswerRate: ratio(served, unanswered),
      resolvedRate: ratio(resolved, unresolvedFb),
      unresolvedRate: ratio(unresolvedFb, resolved),
      lowRatingRate: totalFb === 0 ? null : down / totalFb,
    },
    trend: ((trendRes.data as { day: string; cnt: number }[]) ?? []).map((r) => ({
      day: r.day,
      count: Number(r.cnt),
    })),
    topQuestions: ((topQRes.data as { question: string; cnt: number }[]) ?? []).map((r) => ({
      question: r.question,
      count: Number(r.cnt),
    })),
    topUnresolved: ((topURes.data as { question: string; cnt: number }[]) ?? []).map((r) => ({
      question: r.question,
      count: Number(r.cnt),
    })),
    suggestions: ((sugRes.data as { id: string; type: string; title: string | null; priority: number }[]) ?? []).map(
      (s) => ({ id: s.id, type: s.type, title: s.title, priority: Number(s.priority) }),
    ),
  };
}
