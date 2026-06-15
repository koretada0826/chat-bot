// 「プラットフォーム運営者（あなた）」かどうかを判定する部品。
// .env.local の PLATFORM_ADMIN_EMAILS（カンマ区切り）に載っていれば運営者。
// 運営者は全企業の使用量を見られる。

export function isPlatformAdmin(email?: string | null): boolean {
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}
