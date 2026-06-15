// 環境変数を見て、使うAIプロバイダを選んで返す「受付係」。
import type { LLMProvider, EmbeddingProvider } from "./types";
import { ClaudeProvider } from "./providers/claude";
import { OpenAIEmbeddingProvider } from "./providers/openai-embedding";

export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "claude";
  switch (provider) {
    case "claude":
      return new ClaudeProvider();
    // case "openai": return new OpenAIProvider();   // 将来追加
    // case "gemini": return new GeminiProvider();   // 将来追加
    default:
      throw new Error(`LLMプロバイダ "${provider}" は未対応です。`);
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER ?? "openai";
  switch (provider) {
    case "openai":
      return new OpenAIEmbeddingProvider();
    default:
      throw new Error(`Embeddingプロバイダ "${provider}" は未対応です。`);
  }
}

export type { LLMProvider, EmbeddingProvider } from "./types";
