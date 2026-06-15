// Claude（おしゃべりAI）の差し込み口の中身
import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ChatMessage, ChatOptions, ChatResult } from "../types";

const DEFAULT_MODEL = "claude-opus-4-8";

export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  private client: Anthropic;

  constructor() {
    // 鍵は環境変数 ANTHROPIC_API_KEY から自動で読まれる
    this.client = new Anthropic();
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
    const model = options.model ?? DEFAULT_MODEL;

    // system メッセージは先頭にまとめる（残りは user/assistant）
    const systemText = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const params: Anthropic.MessageCreateParams = {
      model,
      max_tokens: options.maxTokens ?? 1024,
      // FAQ回答は速さ重視。思考はオフにし、最終回答だけ返すよう指示する。
      thinking: { type: "disabled" },
      system: systemText
        ? [
            {
              type: "text",
              text: systemText,
              // 根拠が大きいときのためにキャッシュ指定（小さい時は無視される）
              cache_control: { type: "ephemeral" },
            },
          ]
        : undefined,
      messages: turns,
    };

    // JSONで返してほしいときは構造化出力を使う
    if (options.jsonSchema) {
      params.output_config = {
        format: { type: "json_schema", schema: options.jsonSchema },
      };
    }

    const res = await this.client.messages.create(params);

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return {
      text,
      model: res.model,
      usage: {
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
      },
    };
  }
}
