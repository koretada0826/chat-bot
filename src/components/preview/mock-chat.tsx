"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserRound,
  Headset,
  Send,
  FileQuestion,
  Search,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Inbox,
  HelpCircle,
  X,
} from "lucide-react";
import {
  CHAT_GREETING,
  CHAT_CATEGORIES,
  CHAT_SUGGESTED,
  CHAT_SCRIPTS,
  CHAT_UNANSWERED,
  type ChatMode,
  type ChatSource,
} from "@/lib/preview/demo-data";
import { SourceCards } from "./chat/source-card";
import { InquiryForm } from "./chat/inquiry-form";

interface Msg {
  id: string;
  role: "user" | "bot" | "operator" | "system";
  text: string;
  answerType?: "FAQ回答" | "AI生成回答";
  sources?: ChatSource[];
  related?: string[];
  unanswered?: boolean;
  showForm?: boolean;
  feedbackGiven?: boolean;
}

// この画面だけの「やわらかい水色」配色（参考イメージの雰囲気）
const C = {
  bg: "#dbe8f4",
  header: "#cfe0f0",
  user: "#2b4f8e",
  botText: "#23507f",
  send: "#2b6cb0",
  faq: "#2b6cb0",
  ai: "#3aa76d",
  human: "#0e9f6e", // 担当者（人）を表す緑
};

const OPERATOR_NAME = "サポート 田中";
const OP_REPLIES = [
  "承知しました。確認いたしますので、少々お待ちください。",
  "ご不便をおかけしております。担当部署に確認のうえ、ご案内します。",
  "ありがとうございます。内容を確認しました。ほかにお困りの点はございますか？",
];

// チャット内ヘルプ（お客様がその場で読める使い方）
const HELP_STEPS = [
  { t: "質問する", b: "カテゴリを選ぶか、知りたいことを文章で送ってください。" },
  { t: "答えを受け取る", b: "AIがその場で回答します。資料があれば出典ページも表示されます。" },
  { t: "解決したか教える", b: "「解決した／解決しなかった」を押すと、回答がより良くなります。" },
  { t: "解決しないときは", b: "「担当者（人）を呼ぶ」でオペレーターに交代、または問い合わせフォームへ。" },
];
const HELP_TIPS = [
  "短い言葉でも大丈夫です（例：「送料」「返品 方法」）。",
  "個人情報（パスワードやカード番号）は入力しないでください。",
];

const MODES: { key: ChatMode; label: string; icon: typeof FileQuestion }[] = [
  { key: "faq", label: "FAQ回答", icon: FileQuestion },
  { key: "doc", label: "ドキュメント検索", icon: Search },
  { key: "ai", label: "AIアシスト", icon: Sparkles },
];

function findScript(q: string) {
  return CHAT_SCRIPTS.find((s) => s.keywords.some((k) => q.includes(k)));
}

function Avatar() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
      style={{ background: "linear-gradient(135deg,#8bb6e6,#5a8ed6)" }}
    >
      <UserRound className="h-5 w-5" />
    </span>
  );
}

function OperatorAvatar() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
      style={{ background: "linear-gradient(135deg,#34d399,#0e9f6e)" }}
    >
      <Headset className="h-5 w-5" />
    </span>
  );
}

export function MockChat({ onClose }: { onClose?: () => void } = {}) {
  const [mode, setMode] = useState<ChatMode>("faq");
  const [messages, setMessages] = useState<Msg[]>([
    { id: "g", role: "bot", text: CHAT_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const opTurn = useRef(0);
  const nextId = () => `m${++counter.current}`;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing, connecting]);

  function send(text: string) {
    const q = text.trim();
    if (!q || typing || connecting) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId(), role: "user", text: q }]);

    // 有人対応中は、AIではなく担当者（人）からの返信を返す
    if (humanMode) {
      setTyping(true);
      setTimeout(() => {
        const reply = OP_REPLIES[opTurn.current % OP_REPLIES.length];
        opTurn.current += 1;
        setMessages((m) => [...m, { id: nextId(), role: "operator", text: reply }]);
        setTyping(false);
      }, 800);
      return;
    }

    setTyping(true);
    setTimeout(() => {
      const script = findScript(q);
      if (script) {
        setMessages((m) => [
          ...m,
          {
            id: nextId(),
            role: "bot",
            text: script.answer,
            answerType: script.answerType,
            sources: script.sources,
            related: script.related,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { id: nextId(), role: "bot", text: CHAT_UNANSWERED, unanswered: true },
        ]);
      }
      setTyping(false);
    }, 600);
  }

  // 担当者（人）におつなぎする
  function connectOperator() {
    if (humanMode || connecting) return;
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "system", text: "担当者におつなぎしています。少々お待ちください…" },
    ]);
    setConnecting(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: nextId(), role: "system", text: "担当者が会話に参加しました" },
        {
          id: nextId(),
          role: "operator",
          text: "お待たせしました。サポート担当の田中です。ご用件をうかがえますか？",
        },
      ]);
      setConnecting(false);
      setHumanMode(true);
    }, 1300);
  }

  // AIアシスタントに戻る
  function backToAI() {
    setHumanMode(false);
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "system", text: "AIアシスタントに戻りました" },
    ]);
  }

  function openForm(id: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, showForm: true } : x)));
  }
  function giveFeedback(id: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, feedbackGiven: true } : x)));
  }

  const onlyGreeting = messages.length <= 1;
  const activeMode = MODES.find((m) => m.key === mode)!;

  return (
    <div
      className="relative mx-auto flex h-[min(82vh,620px)] w-full max-w-md flex-col overflow-hidden rounded-3xl shadow-md ring-1 ring-black/5"
      style={{ background: C.bg }}
    >
      {/* ヘッダー */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: C.header }}>
        {humanMode ? <OperatorAvatar /> : <Avatar />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: humanMode ? C.human : C.user }}>
            {humanMode ? OPERATOR_NAME : "AnswerOps Bot"}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-neutral-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: humanMode ? C.human : "#10b981" }}
            />
            {humanMode ? "有人対応中" : "オンライン"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHelp(true)}
            aria-label="使い方"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/60 text-neutral-500 hover:bg-white"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-white"
            >
              終了
            </button>
          )}
        </div>
      </div>

      {/* チャット内ヘルプ（お客様がその場で読める「使い方」） */}
      {showHelp && (
        <div className="absolute inset-0 z-20 flex flex-col" style={{ background: C.bg }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: C.header }}>
            <HelpCircle className="h-4 w-4" style={{ color: C.user }} />
            <p className="flex-1 text-sm font-bold" style={{ color: C.user }}>
              チャットの使い方
            </p>
            <button
              onClick={() => setShowHelp(false)}
              aria-label="閉じる"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/60 text-neutral-500 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
            {HELP_STEPS.map((s, i) => (
              <div key={s.t} className="flex gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: C.send }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{s.t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{s.b}</p>
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-white px-3.5 py-3 shadow-sm">
              <p className="text-xs font-semibold text-neutral-700">上手に使うコツ</p>
              <ul className="mt-1.5 space-y-1">
                {HELP_TIPS.map((t) => (
                  <li key={t} className="text-xs leading-relaxed text-neutral-500">
                    ・{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="px-3 py-3">
            <button
              onClick={() => setShowHelp(false)}
              className="w-full rounded-full py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
              style={{ background: C.send }}
            >
              わかりました
            </button>
          </div>
        </div>
      )}

      {/* 有人対応バナー or モード切替 */}
      {humanMode ? (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
          style={{ background: "#e7f6ef", color: C.human }}
        >
          <Headset className="h-3.5 w-3.5" />
          <span className="flex-1">担当者（{OPERATOR_NAME}）が対応しています</span>
          <button
            onClick={backToAI}
            className="rounded-full border border-[var(--color-success)]/40 bg-white px-2 py-0.5 text-[11px] font-medium text-[var(--color-success)] hover:opacity-90"
          >
            AIに戻る
          </button>
        </div>
      ) : (
        <div className="flex gap-1.5 px-3 py-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                aria-pressed={active}
                className="flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition"
                style={
                  active
                    ? { background: C.user, color: "#fff" }
                    : { background: "rgba(255,255,255,0.55)", color: "#5b6b80" }
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* メッセージ */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {!humanMode && (
          <div className="flex justify-center">
            <span className="rounded-full bg-white/70 px-4 py-1 text-xs font-medium text-neutral-500">
              {activeMode.label}モード
            </span>
          </div>
        )}

        {messages.map((m) => {
          // システムメッセージ（中央のお知らせ）
          if (m.role === "system") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-neutral-500 shadow-sm">
                  {m.text}
                </span>
              </div>
            );
          }
          // ユーザー（右・濃紺）
          if (m.role === "user") {
            return (
              <div key={m.id} className="flex justify-end">
                <div
                  className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm font-medium text-white shadow-sm"
                  style={{ background: C.user }}
                >
                  {m.text}
                </div>
              </div>
            );
          }
          // 担当者（人）
          if (m.role === "operator") {
            return (
              <div key={m.id} className="flex gap-2">
                <OperatorAvatar />
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[11px] font-medium" style={{ color: C.human }}>
                    {OPERATOR_NAME}
                  </p>
                  <div className="inline-block max-w-full whitespace-pre-wrap rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-700 shadow-sm">
                    {m.text}
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ background: C.human }}
                      >
                        <Headset className="h-3 w-3" />
                        担当者
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          // ボット（AI）
          return (
            <div key={m.id} className="flex gap-2">
              <Avatar />
              <div className="min-w-0 flex-1">
                <div
                  className="inline-block max-w-full whitespace-pre-wrap rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
                  style={{ color: C.botText }}
                >
                  {m.text}
                  {m.answerType && (
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ background: m.answerType === "FAQ回答" ? C.faq : C.ai }}
                      >
                        {m.answerType === "FAQ回答" ? (
                          <FileQuestion className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {m.answerType}
                      </span>
                    </div>
                  )}
                </div>

                {m.sources && m.sources.length > 0 && <SourceCards sources={m.sources} />}

                {m.related && m.related.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-neutral-500">関連FAQ</p>
                    <div className="mt-1 flex flex-col items-start gap-1">
                      {m.related.map((r) => (
                        <button
                          key={r}
                          onClick={() => send(r)}
                          className="rounded-full bg-white px-3 py-1 text-xs text-neutral-600 shadow-sm hover:bg-white/80"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 回答不能の選択肢（担当者に繋ぐを優先表示） */}
                {m.unanswered && !m.showForm && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={connectOperator}
                      disabled={connecting || humanMode}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm disabled:opacity-50"
                      style={{ background: C.human }}
                    >
                      <Headset className="h-3.5 w-3.5" />
                      担当者（人）に繋ぐ
                    </button>
                    <button
                      onClick={() => openForm(m.id)}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                      style={{ background: C.send }}
                    >
                      <Inbox className="h-3.5 w-3.5" />
                      問い合わせフォーム
                    </button>
                    <button
                      onClick={() => send("送料はいくらですか？")}
                      className="rounded-full bg-white px-3 py-1.5 text-xs text-neutral-600 shadow-sm hover:bg-white/80"
                    >
                      関連FAQを見る
                    </button>
                  </div>
                )}

                {m.showForm && (
                  <div className="mt-2">
                    <InquiryForm />
                  </div>
                )}

                {m.answerType && !m.feedbackGiven && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-neutral-500">解決しましたか？</span>
                    <button
                      onClick={() => giveFeedback(m.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-600 shadow-sm hover:text-emerald-600"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      解決した
                    </button>
                    <button
                      onClick={() => giveFeedback(m.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-neutral-600 shadow-sm hover:text-rose-600"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      解決しなかった
                    </button>
                  </div>
                )}
                {m.feedbackGiven && (
                  <p className="mt-1.5 text-[11px] text-neutral-500">
                    フィードバックありがとうございます。
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {(typing || connecting) && (
          <div className="flex gap-2">
            {humanMode ? <OperatorAvatar /> : <Avatar />}
            <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-sm">
              <span className="flex gap-1">
                <Dot /> <Dot /> <Dot />
              </span>
            </div>
          </div>
        )}

        {/* 初回のカテゴリ・候補 */}
        {onlyGreeting && (
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {CHAT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-sm"
                  style={{ background: C.send }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CHAT_SUGGESTED.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs text-neutral-600 shadow-sm hover:bg-white/80"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 「担当者を呼ぶ」（いつでも呼べる導線） */}
      {!humanMode && (
        <div className="px-3">
          <button
            onClick={connectOperator}
            disabled={connecting}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/70 py-1.5 text-xs font-medium text-neutral-600 hover:bg-white disabled:opacity-50"
          >
            <Headset className="h-3.5 w-3.5" style={{ color: C.human }} />
            担当者（人）を呼ぶ
          </button>
        </div>
      )}

      {/* 入力 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={humanMode ? "担当者にメッセージを送る…" : "質問を入力してください"}
          className="flex-1 rounded-full border border-white bg-white px-4 py-2.5 text-sm text-neutral-700 shadow-sm outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={typing || connecting}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          style={{ background: humanMode ? C.human : C.send }}
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
