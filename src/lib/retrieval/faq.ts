// FAQを探して点数をつける部品
import type { SupabaseClient } from "@supabase/supabase-js";

export interface FaqCandidate {
  faqId: string;
  question: string;
  answer: string;
  score: number; // 0〜1くらい。高いほど「合っている」
}

// 文字2つずつ（bigram）の集合を作る
function bigrams(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

// 2つの文の「文字の重なり度合い」（0〜1）。
// ★ Jaccard（共通 / 全体）で正規化する。
//   以前は min(A,B) で割っていたため、短い質問が長いFAQの一部に含まれるだけで
//   score=1.0 になり（例:「返品」⊂「返品はできますか？」）、意味検索の鍵が無い時に
//   無関係なFAQを高確信で誤回答していた。Jaccardなら部分一致では満点にならない。
function bigramOverlap(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let common = 0;
  for (const g of A) if (B.has(g)) common++;
  return common / (A.size + B.size - common);
}

// 意味検索（pgvectorのRPC match_faqs）
async function embeddingSearch(
  supabase: SupabaseClient,
  projectId: string,
  queryEmbedding: number[],
  count: number,
): Promise<FaqCandidate[]> {
  const { data, error } = await supabase.rpc("match_faqs", {
    p_project_id: projectId,
    p_query_embedding: queryEmbedding,
    p_match_threshold: 0,
    p_match_count: count,
  });
  if (error || !data) return [];
  return (data as { faq_id: string; question: string; answer: string; similarity: number }[]).map(
    (r) => ({
      faqId: r.faq_id,
      question: r.question,
      answer: r.answer,
      score: r.similarity,
    }),
  );
}

// キーワード補助（意味検索が使えない/弱いとき用）
async function keywordSearch(
  supabase: SupabaseClient,
  projectId: string,
  normalizedQuery: string,
  count: number,
): Promise<FaqCandidate[]> {
  // 公開FAQを取得して、文字の重なりでJS側で採点（MVP向け・小〜中規模想定）
  const { data } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("project_id", projectId)
    .eq("status", "published")
    .limit(500);
  if (!data) return [];

  return data
    .map((f) => ({
      faqId: f.id,
      question: f.question,
      answer: f.answer,
      score: bigramOverlap(normalizedQuery, f.question),
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// 意味検索とキーワードを合わせて、点数の高い順に返す
export async function searchFaqs(
  supabase: SupabaseClient,
  params: {
    projectId: string;
    normalizedQuery: string;
    queryEmbedding: number[] | null;
    count?: number;
  },
): Promise<FaqCandidate[]> {
  const count = params.count ?? 5;

  const [emb, kw] = await Promise.all([
    params.queryEmbedding
      ? embeddingSearch(supabase, params.projectId, params.queryEmbedding, count)
      : Promise.resolve<FaqCandidate[]>([]),
    keywordSearch(supabase, params.projectId, params.normalizedQuery, count),
  ]);

  // faqIdごとに、意味とキーワードの良いほうを採用（キーワードは少し弱めに加味）
  const byId = new Map<string, FaqCandidate>();
  for (const c of emb) byId.set(c.faqId, { ...c });
  for (const c of kw) {
    const existing = byId.get(c.faqId);
    const kwScore = c.score * 0.85; // キーワードはやや控えめに評価
    if (!existing) {
      byId.set(c.faqId, { ...c, score: kwScore });
    } else {
      // 両方ヒットしたら、高いほうを採用＋少しボーナス
      existing.score = Math.min(1, Math.max(existing.score, kwScore) + 0.05);
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, count);
}
