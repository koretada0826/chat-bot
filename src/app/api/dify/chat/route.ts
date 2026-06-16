import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { getClientIp } from "@/lib/chat/origin";
import { overDifyBudget, addDifyRequest, addDifyTokens } from "@/lib/chat/dify-budget";

// AnswerOps ⇄ Dify 連携（Phase 1）。
// AnswerOpsのサーバー経由でDifyのチャットAPIを呼ぶ。APIキーはここ（サーバー側）だけで使い、ブラウザには出さない。
// 必要な環境変数（.env.local）:
//   DIFY_API_KEY   … Dify「APIアクセス」で発行したシークレットキー（app-xxxx）
//   DIFY_API_BASE  … 省略時は https://api.dify.ai/v1

const DIFY_BASE = process.env.DIFY_API_BASE || "https://api.dify.ai/v1";
const DIFY_KEY = process.env.DIFY_API_KEY;

const MAX_QUERY_LEN = 4000; // 巨大入力でのトークン課金濫用を防ぐ
const TIMEOUT_MS = 45_000; // ハング時にサーバーが詰まらないように

// お客様に見せる中立メッセージ（裏側のエンジン名や実装詳細は出さない＝白ラベル維持）
const GENERIC_ERROR = "ただいま回答できません。お手数ですが、時間をおいて再度お試しください。";

// 同一オリジン（自アプリ）からの呼び出しだけ許可。Originなし（curl/スクリプト直叩き）は拒否＝濫用防止。
function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  if (process.env.NODE_ENV !== "production") {
    const h = host.split(":")[0];
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && host === new URL(appUrl).host.toLowerCase()) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export async function POST(request: Request) {
  // 1) 直叩き拒否（ブラウザ・自オリジン以外をブロック）
  if (!originAllowed(request)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
  }

  // 2) レート制限（IP単位：1分20回 ＋ 1日300回）＝課金事故・濫用の防波堤
  const ip = getClientIp(request);
  const perMin = checkRateLimit(`dify:min:${ip}`, 20, 60_000);
  if (!perMin.allowed) {
    return NextResponse.json(
      { error: "短時間に送りすぎです。少し待ってから再度お試しください。" },
      { status: 429, headers: { "Retry-After": String(perMin.retryAfter ?? 30) } },
    );
  }
  const perDay = checkRateLimit(`dify:day:${ip}`, 300, 86_400_000);
  if (!perDay.allowed) {
    return NextResponse.json(
      { error: "本日のご利用上限に達しました。" },
      { status: 429, headers: { "Retry-After": String(perDay.retryAfter ?? 3600) } },
    );
  }

  // 2.5) 全体ハードキャップ（IP非依存）。IPを変えての総量での課金暴走を止める。
  const now = Date.now();
  if (overDifyBudget(now)) {
    console.error("[dify] 本日の全体上限に到達（DIFY_DAILY_*_CAP）");
    return NextResponse.json(
      { error: "本日のご利用が混み合っています。時間をおいて再度お試しください。" },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  // 3) 鍵未設定（運用者向け詳細はログだけに出し、お客様には中立メッセージ）
  if (!DIFY_KEY) {
    console.error("[dify] DIFY_API_KEY が未設定です（.env.local を確認してください）");
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  // 4) 入力検証
  let body: { query?: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "質問を入力してください。" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LEN) {
    return NextResponse.json({ error: "メッセージが長すぎます。" }, { status: 413 });
  }
  // user は信頼できるサーバー側で決める（クライアント任意指定でDify側の制限を回避させない）
  const user = `aops-${ip}`;

  // 5) Dify呼び出し（タイムアウト付き）。呼ぶ＝課金なので、先に1件計上しておく。
  addDifyRequest(now);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${DIFY_BASE}/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query,
        response_mode: "blocking",
        conversation_id: body.conversationId || "",
        user,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    console.error("[dify] 接続失敗", aborted ? "(timeout)" : e);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: aborted ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[dify] APIエラー ${res.status}: ${detail.slice(0, 400)}`);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  const data = await res.json().catch(() => null);
  if (!data) {
    console.error("[dify] 応答のJSON解釈に失敗");
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  // 消費トークンを全体カウンタに加算（次回以降の上限判定に反映）
  const usedTokens = Number(data?.metadata?.usage?.total_tokens ?? 0);
  if (usedTokens > 0) addDifyTokens(now, usedTokens);

  return NextResponse.json({
    answer: data.answer ?? "",
    conversationId: data.conversation_id ?? "",
    messageId: data.message_id ?? "",
  });
}
