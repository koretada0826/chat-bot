// AIモデルの単価表（米ドル / 100万トークン）。
// ここを更新すれば以後のコスト計算に反映される。
// 値は概算。正確な請求は各プロバイダの明細で確認すること。

interface Price {
  input: number; // $ / 1M tokens
  output: number; // $ / 1M tokens
}

const LLM_PRICES: Record<string, Price> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

const EMBEDDING_PRICES: Record<string, number> = {
  // $ / 1M tokens（入力のみ）
  "text-embedding-3-small": 0.02,
  "text-embedding-3-large": 0.13,
};

const DEFAULT_LLM: Price = { input: 5, output: 25 };
const DEFAULT_EMBEDDING = 0.02;

// モデルIDは日付サフィックス付き（例 claude-opus-4-8-20260...）で返ることがあるため、
// 完全一致だけでなく前方一致でも単価を解決する。
function resolveLlm(model: string): Price {
  if (LLM_PRICES[model]) return LLM_PRICES[model];
  const key = Object.keys(LLM_PRICES).find((k) => model.startsWith(k));
  if (key) return LLM_PRICES[key];
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[pricing] 未知のLLMモデル "${model}" → 既定単価(Opus)を使用`);
  }
  return DEFAULT_LLM;
}

function resolveEmbedding(model: string): number {
  if (EMBEDDING_PRICES[model] !== undefined) return EMBEDDING_PRICES[model];
  const key = Object.keys(EMBEDDING_PRICES).find((k) => model.startsWith(k));
  return key ? EMBEDDING_PRICES[key] : DEFAULT_EMBEDDING;
}

export function llmCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = resolveLlm(model);
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export function embeddingCostUsd(model: string, totalTokens: number): number {
  const p = resolveEmbedding(model);
  return (totalTokens / 1_000_000) * p;
}

// 表示用：USD→円のざっくり換算（為替は固定の概算）
export const USD_TO_JPY = 150;
