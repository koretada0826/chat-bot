"use client";

import { useEffect, useRef, useState } from "react";

interface Source {
  type: string;
  id: string;
  title: string;
}
interface RelatedFaq {
  id: string;
  question: string;
}
interface BotMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  messageId?: string | null;
  answerType?: "faq" | "unanswered";
  sources?: Source[];
  relatedFaqs?: RelatedFaq[];
  showInquiry?: boolean;
  feedbackGiven?: boolean;
}

interface Settings {
  greeting: string;
  placeholder: string;
  show_categories: boolean;
  inquiry_enabled: boolean;
  categories: { id: string; name: string }[];
}

export function ChatPanel({ projectKey }: { projectKey: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initFailed, setInitFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  const nextId = () => `m${++counter.current}`;

  // セッション開始（失敗時に再試行できるよう関数化）
  async function initSession() {
    setError(null);
    setInitFailed(false);
    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_key: projectKey, page_url: location.href }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionId(data.session_id);
      setSettings(data.settings);
      setMessages([{ id: nextId(), role: "assistant", text: data.settings.greeting }]);
    } catch {
      setInitFailed(true);
      setError("チャットを開始できませんでした。");
    }
  }

  useEffect(() => {
    // 初期化（外部システム=APIからセッション取得→stateへ反映）はマウント時に行う正当な用途
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || !sessionId || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_key: projectKey, session_id: sessionId, message: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 429(送りすぎ)など、サーバーのメッセージがあれば出す
        setError(data?.error?.message ?? "回答の取得に失敗しました。少し待って再度お試しください。");
        return;
      }
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          text: data.answer,
          messageId: data.message_id,
          answerType: data.answer_type,
          sources: data.sources,
          relatedFaqs: data.related_faqs,
          showInquiry: data.show_inquiry,
        },
      ]);
    } catch {
      setError("通信に失敗しました。電波の良い場所で再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(msg: BotMessage, rating: "resolved" | "unresolved") {
    if (!msg.messageId || !sessionId) return;
    setMessages((m) =>
      m.map((x) => (x.id === msg.id ? { ...x, feedbackGiven: true } : x)),
    );
    try {
      const res = await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_key: projectKey,
          session_id: sessionId,
          message_id: msg.messageId,
          rating,
        }),
      });
      const data = await res.json().catch(() => ({}));
      // 未解決のときは問い合わせ案内を表示する
      if (data?.next?.show_inquiry) {
        setMessages((m) =>
          m.map((x) => (x.id === msg.id ? { ...x, showInquiry: true } : x)),
        );
      }
    } catch {
      /* フィードバックの失敗は致命的ではない */
    }
  }

  return (
    <div className="flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      {/* ヘッダー */}
      <div className="border-b border-neutral-200 px-4 py-3">
        <p className="text-sm font-semibold text-neutral-900">サポートチャット</p>
        <p className="text-xs text-neutral-400">ご質問にお答えします</p>
      </div>

      {/* メッセージ一覧 */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {m.text}
            </div>

            {/* 参照元チップ */}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {m.sources.map((s) => (
                  <span
                    key={s.id}
                    className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                  >
                    出典: {s.title}
                  </span>
                ))}
              </div>
            )}

            {/* 関連FAQ */}
            {m.relatedFaqs && m.relatedFaqs.length > 0 && (
              <div className="mt-1.5 flex flex-col items-start gap-1">
                {m.relatedFaqs.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => send(f.question)}
                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    {f.question}
                  </button>
                ))}
              </div>
            )}

            {/* 解決/未解決 */}
            {m.role === "assistant" && m.messageId && !m.feedbackGiven && (
              <div className="mt-1.5 flex gap-2 text-xs text-neutral-400">
                <button onClick={() => sendFeedback(m, "resolved")} className="hover:text-emerald-600">
                  解決した
                </button>
                <button onClick={() => sendFeedback(m, "unresolved")} className="hover:text-red-600">
                  解決しない
                </button>
              </div>
            )}
            {m.feedbackGiven && (
              <p className="mt-1 text-xs text-neutral-400">フィードバックありがとうございます。</p>
            )}

            {/* 問い合わせ案内 */}
            {m.showInquiry && (
              <p className="mt-1.5 text-xs text-neutral-500">
                解決しない場合は、お問い合わせ窓口へご連絡ください。
              </p>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <div className="inline-block rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
              入力中…
            </div>
          </div>
        )}
      </div>

      {/* カテゴリ（最初だけ案内的に表示） */}
      {settings?.show_categories && settings.categories.length > 0 && messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-neutral-100 px-4 py-2">
          {settings.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => send(c.name)}
              className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-2 px-4 py-1.5">
          <p className="text-xs text-red-600">{error}</p>
          {initFailed && (
            <button
              onClick={initSession}
              className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
            >
              再試行
            </button>
          )}
        </div>
      )}

      {/* 入力欄 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-neutral-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={settings?.placeholder ?? "メッセージを入力…"}
          disabled={!sessionId}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <button
          type="submit"
          disabled={!sessionId || loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
