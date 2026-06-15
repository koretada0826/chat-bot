// 回答エンジン本体：辞書→検索(FAQ+資料)→点数→AI回答→回答不能判定
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLLMProvider, getEmbeddingProvider } from "@/lib/llm";
import { normalizeWithDictionary } from "@/lib/guard/dictionary";
import { checkInjection, isSensitiveTopic, sanitizeOutput } from "@/lib/guard/injection";
import { searchFaqs, type FaqCandidate } from "@/lib/retrieval/faq";
import { searchDocuments } from "@/lib/retrieval/document";
import { recordLLMUsage, recordEmbeddingUsage } from "@/lib/usage/record";
import {
  SYSTEM_GUARD,
  FAQ_ANSWER_SCHEMA,
  HYBRID_ANSWER_SCHEMA,
  buildFaqAnswerPrompt,
  buildHybridAnswerPrompt,
} from "@/lib/llm/prompts";

export interface AnswerSettings {
  tau_faq_high: number;
  tau_faq_low: number;
  tau_doc: number;
  llm_model?: string | null;
  fallback_message: string;
}

export type AnswerReason =
  | "ok"
  | "low_confidence"
  | "no_source"
  | "injection_blocked"
  | "sensitive_topic";

export type AnswerSource =
  | { type: "faq"; id: string; title: string }
  | {
      type: "document";
      id: string;
      documentId: string;
      chunkId: string;
      title: string;
      location?: string;
    };

export interface AnswerResult {
  answerType: "faq" | "rag" | "hybrid" | "unanswered";
  answer: string;
  sources: AnswerSource[];
  relatedFaqs: { id: string; question: string }[];
  confidence: number;
  reason: AnswerReason;
  normalizedQuestion: string;
}

export async function answerQuestion(
  supabase: SupabaseClient,
  params: { projectId: string; organizationId: string; settings: AnswerSettings; question: string },
): Promise<AnswerResult> {
  const { projectId, organizationId, settings, question } = params;

  const unanswered = (reason: AnswerReason, confidence = 0, related: AnswerResult["relatedFaqs"] = []): AnswerResult => ({
    answerType: "unanswered",
    answer: settings.fallback_message,
    sources: [],
    relatedFaqs: related,
    confidence,
    reason,
    normalizedQuestion: question,
  });

  // 1. ずるい命令・機密の聞き出しを見張る
  if (checkInjection(question).blocked) return unanswered("injection_blocked");

  // 2. 辞書で言い方をそろえる
  const normalized = await normalizeWithDictionary(supabase, projectId, question);

  // 3. 質問を「意味の数字」にする（鍵が無ければスキップ）
  let queryEmbedding: number[] | null = null;
  try {
    const provider = getEmbeddingProvider();
    const { vectors, totalTokens } = await provider.embed([normalized]);
    queryEmbedding = vectors[0] ?? null;
    if (totalTokens > 0) {
      await recordEmbeddingUsage(supabase, {
        organizationId,
        projectId,
        feature: "query_embed",
        model: provider.model,
        totalTokens,
      });
    }
  } catch {
    queryEmbedding = null;
  }

  // 4. FAQと資料を探す
  const [faqs, docs] = await Promise.all([
    searchFaqs(supabase, { projectId, normalizedQuery: normalized, queryEmbedding, count: 5 }),
    searchDocuments(supabase, { projectId, queryEmbedding, count: 5 }),
  ]);

  const faqBest = faqs[0]?.score ?? 0;
  const docBest = docs[0]?.score ?? 0;
  const confidence = Math.max(faqBest, docBest);
  const related = faqs.slice(1, 4).map((c) => ({ id: c.faqId, question: c.question }));

  // 5. 慎重な話題で確信が低い → 念のため窓口へ
  if (isSensitiveTopic(normalized) && faqBest < settings.tau_faq_high) {
    return unanswered("sensitive_topic", confidence, related);
  }

  // 6. 採用する根拠を選ぶ
  const usableFaqs = faqs.filter((c) => c.score >= settings.tau_faq_low).slice(0, 3);
  const usableDocs = docs.filter((c) => c.score >= settings.tau_doc).slice(0, 4);

  // 根拠が何も無ければ回答不能
  if (usableFaqs.length === 0 && usableDocs.length === 0) {
    return unanswered(faqs.length === 0 && docs.length === 0 ? "no_source" : "low_confidence", confidence, related);
  }

  // 7. FAQだけで十分強いなら、FAQ専用の回答（資料を混ぜない）
  if (faqBest >= settings.tau_faq_high && usableDocs.length === 0) {
    return await answerFromFaqOnly(
      supabase,
      { organizationId, projectId },
      settings,
      normalized,
      usableFaqs,
      faqs,
      confidence,
      related,
    );
  }

  // 8. FAQ＋資料の統合回答
  try {
    const llm = getLLMProvider();
    const res = await llm.chat(
      [
        { role: "system", content: SYSTEM_GUARD },
        { role: "user", content: buildHybridAnswerPrompt(normalized, usableFaqs, usableDocs) },
      ],
      { model: settings.llm_model ?? undefined, jsonSchema: HYBRID_ANSWER_SCHEMA, maxTokens: 900 },
    );
    if (res.usage) {
      await recordLLMUsage(supabase, {
        organizationId,
        projectId,
        feature: "chat_answer",
        model: res.model,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
      });
    }
    const parsed = JSON.parse(res.text) as {
      answerable: boolean;
      answer: string;
      used_faq_ids: string[];
      used_chunk_ids: string[];
    };

    if (!parsed.answerable || !parsed.answer.trim()) {
      return unanswered("low_confidence", confidence, related);
    }

    const usedFaq = new Set(parsed.used_faq_ids);
    const usedChunk = new Set(parsed.used_chunk_ids);
    const sources: AnswerSource[] = [];
    for (const c of usableFaqs) {
      if (usedFaq.has(c.faqId)) sources.push({ type: "faq", id: c.faqId, title: c.question });
    }
    for (const c of usableDocs) {
      if (usedChunk.has(c.chunkId)) {
        sources.push({
          type: "document",
          id: c.chunkId,
          documentId: c.documentId,
          chunkId: c.chunkId,
          title: c.documentTitle,
          location: c.headingPath ?? (c.pageNo ? `p.${c.pageNo}` : undefined),
        });
      }
    }
    // 念のため最低1つは出典を残す
    if (sources.length === 0) {
      if (usableFaqs[0]) sources.push({ type: "faq", id: usableFaqs[0].faqId, title: usableFaqs[0].question });
      else if (usableDocs[0])
        sources.push({
          type: "document",
          id: usableDocs[0].chunkId,
          documentId: usableDocs[0].documentId,
          chunkId: usableDocs[0].chunkId,
          title: usableDocs[0].documentTitle,
        });
    }

    const usedDoc = sources.some((s) => s.type === "document");
    const usedFaqSrc = sources.some((s) => s.type === "faq");
    const answerType: AnswerResult["answerType"] = usedDoc && usedFaqSrc ? "hybrid" : usedDoc ? "rag" : "faq";

    return {
      answerType,
      answer: sanitizeOutput(parsed.answer),
      sources,
      relatedFaqs: related,
      confidence,
      reason: "ok",
      normalizedQuestion: normalized,
    };
  } catch {
    // AIの鍵が無い等で失敗 → ピッタリ合うFAQがあればそのまま返す
    if (faqBest >= settings.tau_faq_high && faqs[0]) {
      return {
        answerType: "faq",
        answer: sanitizeOutput(faqs[0].answer),
        sources: [{ type: "faq", id: faqs[0].faqId, title: faqs[0].question }],
        relatedFaqs: related,
        confidence,
        reason: "ok",
        normalizedQuestion: normalized,
      };
    }
    return unanswered("low_confidence", confidence, related);
  }
}

// FAQだけで答える（資料を混ぜない）
async function answerFromFaqOnly(
  supabase: SupabaseClient,
  ctx: { organizationId: string; projectId: string },
  settings: AnswerSettings,
  normalized: string,
  usableFaqs: FaqCandidate[],
  allFaqs: FaqCandidate[],
  confidence: number,
  related: AnswerResult["relatedFaqs"],
): Promise<AnswerResult> {
  try {
    const llm = getLLMProvider();
    const res = await llm.chat(
      [
        { role: "system", content: SYSTEM_GUARD },
        { role: "user", content: buildFaqAnswerPrompt(normalized, usableFaqs) },
      ],
      { model: settings.llm_model ?? undefined, jsonSchema: FAQ_ANSWER_SCHEMA, maxTokens: 800 },
    );
    if (res.usage) {
      await recordLLMUsage(supabase, {
        organizationId: ctx.organizationId,
        projectId: ctx.projectId,
        feature: "chat_answer",
        model: res.model,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
      });
    }
    const parsed = JSON.parse(res.text) as {
      answerable: boolean;
      answer: string;
      used_faq_ids: string[];
    };
    if (!parsed.answerable || !parsed.answer.trim()) {
      return {
        answerType: "unanswered",
        answer: settings.fallback_message,
        sources: [],
        relatedFaqs: related,
        confidence,
        reason: "low_confidence",
        normalizedQuestion: normalized,
      };
    }
    const used = new Set(parsed.used_faq_ids);
    const sources: AnswerSource[] = usableFaqs
      .filter((c) => used.has(c.faqId))
      .map((c) => ({ type: "faq" as const, id: c.faqId, title: c.question }));
    return {
      answerType: "faq",
      answer: sanitizeOutput(parsed.answer),
      sources: sources.length > 0 ? sources : [{ type: "faq", id: usableFaqs[0].faqId, title: usableFaqs[0].question }],
      relatedFaqs: related,
      confidence,
      reason: "ok",
      normalizedQuestion: normalized,
    };
  } catch {
    // 鍵が無くてもピッタリならそのまま返す
    return {
      answerType: "faq",
      answer: sanitizeOutput(allFaqs[0].answer),
      sources: [{ type: "faq", id: allFaqs[0].faqId, title: allFaqs[0].question }],
      relatedFaqs: related,
      confidence,
      reason: "ok",
      normalizedQuestion: normalized,
    };
  }
}
