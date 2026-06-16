// Dify連携（共有APIキー）の「1日あたり総量」ハードキャップ。
// 連打防止(rate-limit)はIP単位なので、IPを変えられると課金が青天井になり得る。
// ここではIPに依存しない“全体の合計”で歯止めをかける（共有のDify請求を守る）。
//
// ※ 実装はプロセス内メモリ（1インスタンス内）。Renderの単一インスタンス運用では有効。
//   将来スケールする場合は分散KV(Upstash等)やDB集計へ置き換える。
//   その場合もこのインターフェイス（overBudget / addUsage）は据え置ける。

const DAILY_REQUEST_CAP = Number(process.env.DIFY_DAILY_REQUEST_CAP ?? 2000);
const DAILY_TOKEN_CAP = Number(process.env.DIFY_DAILY_TOKEN_CAP ?? 1_000_000);

let day = "";
let requests = 0;
let tokens = 0;

// UTC日付（YYYY-MM-DD）。日付が変わったらカウンタを自動リセット。
function rollover(now: number): void {
  const today = new Date(now).toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    requests = 0;
    tokens = 0;
  }
}

// 呼び出し前チェック。今日の総量が上限を超えていれば true（=止める）。
export function overDifyBudget(now: number): boolean {
  rollover(now);
  if (DAILY_REQUEST_CAP > 0 && requests >= DAILY_REQUEST_CAP) return true;
  if (DAILY_TOKEN_CAP > 0 && tokens >= DAILY_TOKEN_CAP) return true;
  return false;
}

// 1リクエストを計上（呼び出し直前に+1）。
export function addDifyRequest(now: number): void {
  rollover(now);
  requests += 1;
}

// 消費トークンを計上（Difyの metadata.usage.total_tokens を渡す）。
export function addDifyTokens(now: number, total: number): void {
  rollover(now);
  if (Number.isFinite(total) && total > 0) tokens += total;
}
