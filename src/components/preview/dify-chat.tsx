"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, Send, AlertCircle } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "bot";
  text: string;
  error?: boolean;
  feedbackId?: string | null; // ダッシュボード記録上のメッセージID（フィードバック用）
  feedbackGiven?: boolean;
}

const C = {
  bg: "#dbe8f4",
  header: "#cfe0f0",
  user: "#2b4f8e",
  botText: "#23507f",
  send: "#2b6cb0",
};

// projectKey を渡すと、会話がダッシュボードに記録され、解決/未解決ボタンが出る。
// 渡さない（見本ページ等）と、記録なしの素のチャットとして動く。
export function DifyChat({ projectKey }: { projectKey?: string | null } = {}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "g",
      role: "bot",
      text: "こんにちは！AnswerOps Bot です。ご質問をどうぞ。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const nextId = () => `m${++counter.current}`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/dify/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, conversationId, projectKey, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { id: nextId(), role: "bot", text: data.error || "エラーが発生しました", error: true },
        ]);
      } else {
        if (data.conversationId) setConversationId(data.conversationId);
        if (data.sessionId) setSessionId(data.sessionId);
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: "bot",
            text: data.answer || "（回答が空でした）",
            feedbackId: data.feedbackMessageId ?? null,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "bot",
          text: "ただいま回答できません。お手数ですが、時間をおいて再度お試しください。",
          error: true,
        },
      ]);
    }
    setLoading(false);
  }

  // 解決した/解決しない を記録（ダッシュボードの解決率・未解決・改善候補に反映）
  async function sendFeedback(msg: Msg, rating: "resolved" | "unresolved") {
    if (!projectKey || !msg.feedbackId || !sessionId) return;
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, feedbackGiven: true } : x)));
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_key: projectKey,
          session_id: sessionId,
          message_id: msg.feedbackId,
          rating,
        }),
      });
    } catch {
      /* フィードバックの失敗は致命的ではない */
    }
  }

  return (
    <div
      className="mx-auto flex h-[min(82vh,620px)] w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5"
      style={{ background: C.bg }}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: C.header }}>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "linear-gradient(135deg,#8bb6e6,#5a8ed6)" }}
        >
          <UserRound className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: C.user }}>
            AnswerOps Bot
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            オンライン
          </p>
        </div>
      </div>

      {/* メッセージ */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div
                className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm font-medium text-white shadow-sm"
                style={{ background: C.user }}
              >
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ background: m.error ? "#dc2626" : "linear-gradient(135deg,#8bb6e6,#5a8ed6)" }}
              >
                {m.error ? <AlertCircle className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="inline-block max-w-full whitespace-pre-wrap rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
                  style={{ color: m.error ? "#b91c1c" : C.botText }}
                >
                  {m.text}
                </div>
                {/* 引用（参照元）はお客様向けには非表示。
                    どのFAQで答えたかは、将来「ログ画面（管理者向け）」で確認できるようにする。 */}

                {/* 解決/未解決（projectKey接続時のみ・記録あり） */}
                {!m.error && projectKey && m.feedbackId && !m.feedbackGiven && (
                  <div className="mt-1.5 flex gap-3 text-[11px] text-neutral-500">
                    <button
                      type="button"
                      onClick={() => sendFeedback(m, "resolved")}
                      className="hover:text-emerald-600"
                    >
                      解決した
                    </button>
                    <button
                      type="button"
                      onClick={() => sendFeedback(m, "unresolved")}
                      className="hover:text-red-600"
                    >
                      解決しない
                    </button>
                  </div>
                )}
                {m.feedbackGiven && (
                  <p className="mt-1.5 text-[11px] text-neutral-400">フィードバックありがとうございます。</p>
                )}
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg,#8bb6e6,#5a8ed6)" }}
            >
              <UserRound className="h-4 w-4" />
            </span>
            <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-sm">
              <span className="sr-only">回答を生成中です</span>
              <span className="flex gap-1">
                <Dot /> <Dot /> <Dot />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 入力 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        aria-busy={loading}
        className="flex items-center gap-2 px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="質問を入力"
          placeholder="質問を入力してください"
          className="flex-1 rounded-full border border-white bg-white px-4 py-2.5 text-base text-neutral-700 shadow-sm outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-[#2b6cb0] focus-visible:ring-offset-1 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#2b6cb0] focus-visible:ring-offset-1 disabled:opacity-50"
          style={{ background: C.send }}
          aria-label="送信"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />;
}
