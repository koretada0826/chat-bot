// かんたんなレート制限（連打しすぎを防ぐ）。
// メモリ上の簡易版（1サーバー内のみ）。本格運用では分散KV(Upstash等)に置き換える。

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (b.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { allowed: true };
}
