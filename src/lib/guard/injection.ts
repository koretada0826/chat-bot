// プロンプトインジェクション（ずるい命令）と、慎重に扱う話題を見張る部品
// LLMに渡す前の「足切り」。怪しいものはここで止める。

// システムの中身やAPIキー、設定を聞き出そうとする言い回し
const SECRET_PROBES = [
  /system\s*prompt/i,
  /システムプロンプト/,
  /api\s*key/i,
  /apiキー/i,
  /secret\s*key/i,
  /これまでの指示を(無視|忘れ)/,
  /ignore (the )?(previous|above) instructions/i,
  /あなたの(設定|ルール|指示)を(教え|表示|出力)/,
  /内部(id|ID|情報)を(教え|表示|出力)/,
  /プロンプトを(教え|表示|出力)/,
  /reveal (your )?(prompt|instructions|system)/i,
  /開発者モード/,
  /developer mode/i,
];

// 慎重に扱う話題（根拠が弱ければ回答せず窓口へ）
const SENSITIVE_TOPICS = [
  /契約(を|の)?(解約|解除|キャンセル)/,
  /違約金|解約金/,
  /(個人情報|マイナンバー|クレジットカード番号)/,
  /(法律|法的|訴訟|裁判)/,
  /(診断|症状|薬|医療|処方)/,
];

export type GuardReason =
  | "ok"
  | "injection_blocked"
  | "sensitive_topic";

export function checkInjection(text: string): {
  blocked: boolean;
  reason: GuardReason;
} {
  for (const re of SECRET_PROBES) {
    if (re.test(text)) return { blocked: true, reason: "injection_blocked" };
  }
  return { blocked: false, reason: "ok" };
}

export function isSensitiveTopic(text: string): boolean {
  return SENSITIVE_TOPICS.some((re) => re.test(text));
}

// 回答文に内部情報・機密（APIキー、JWT、メール、電話、UUID等）が混ざっていないかの最終チェック
export function sanitizeOutput(text: string): string {
  if (!text) return text;
  return text
    // OpenAI/汎用 sk- キー
    .replace(/sk-[a-zA-Z0-9_-]{16,}/g, "[非表示]")
    // JWT（Supabaseのservice_roleキー等。eyJ...で始まる3パート）
    .replace(/eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}/g, "[非表示]")
    // Bearer / Basic トークン
    .replace(/\b(Bearer|Basic)\s+[a-zA-Z0-9._\-+/=]{12,}/gi, "[非表示]")
    // メールアドレス
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[非表示]")
    // 電話番号（日本の一般的な桁・ハイフン）
    .replace(/0\d{1,4}-\d{1,4}-\d{3,4}/g, "[非表示]")
    .replace(/\b0\d{9,10}\b/g, "[非表示]")
    // UUID
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "[非表示]");
}
