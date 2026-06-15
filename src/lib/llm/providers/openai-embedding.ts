// 文章を「意味の数字（ベクトル）」に変えるOpenAI embeddingの差し込み口
import OpenAI from "openai";
import type { EmbeddingProvider, EmbeddingResult } from "../types";

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly model: string;
  readonly dimensions: number;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI(); // 鍵は OPENAI_API_KEY から自動で読まれる
    this.model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
    this.dimensions = Number(process.env.EMBEDDING_DIMENSIONS ?? 1536);
  }

  async embed(texts: string[]): Promise<EmbeddingResult> {
    if (texts.length === 0) return { vectors: [], totalTokens: 0 };
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return {
      vectors: res.data.map((d) => d.embedding),
      totalTokens: res.usage?.total_tokens ?? 0,
    };
  }
}
