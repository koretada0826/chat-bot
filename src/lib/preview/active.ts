// プレビュー（見本）で「いま選んでいる業種」をブラウザに覚えさせる部品。
// Supabaseなしでも「業種を取り込む→FAQ/チャットが切り替わる」を体験できるようにする。
import { SAMPLE_FAQS } from "./sample";
import { INDUSTRY_TEMPLATES, getTemplate } from "@/lib/templates/data";

export const PREVIEW_KEY = "aops_preview_industry";

export interface PoolFaq {
  question: string;
  answer: string;
  category: string;
  keywords?: string[];
}

export function getActiveIndustry(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PREVIEW_KEY);
}

export function setActiveIndustry(key: string) {
  if (typeof window !== "undefined") localStorage.setItem(PREVIEW_KEY, key);
}

export function industryName(key: string | null): string {
  if (!key) return "";
  return INDUSTRY_TEMPLATES.find((t) => t.key === key)?.name ?? "";
}

// いま選んでいる業種のFAQ集を返す。
// 未選択 or EC は、ひらがな対応キーワード付きのサンプルを使う（賢く見える）。
export function getPool(industryKey: string | null): PoolFaq[] {
  if (!industryKey || industryKey === "ec") {
    return SAMPLE_FAQS.map((f) => ({
      question: f.question,
      answer: f.answer,
      category: f.category,
      keywords: f.keywords,
    }));
  }
  const t = getTemplate(industryKey);
  if (!t) {
    return SAMPLE_FAQS.map((f) => ({
      question: f.question,
      answer: f.answer,
      category: f.category,
      keywords: f.keywords,
    }));
  }
  return t.faqs.map((f) => ({
    question: f.question,
    answer: f.answer,
    category: f.category,
    keywords: f.keywords,
  }));
}
