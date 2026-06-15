// おしゃべりAI（LLM）と意味検索(embedding)の「共通の差し込み口」
// ここを統一しておくと、Claude / OpenAI / Gemini を後から取り替えられる。

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // JSONで返してほしいときに使う（プロンプトの構造化出力用）
  jsonSchema?: Record<string, unknown>;
}

export interface ChatResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
  model: string;
}

// すべてのAIプロバイダが必ず持つ「形」
export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
}

export interface EmbeddingResult {
  vectors: number[][];
  totalTokens: number;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<EmbeddingResult>;
}
