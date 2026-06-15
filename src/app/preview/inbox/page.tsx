"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Badge } from "@/components/ui/saas";
import {
  Headset,
  UserRound,
  Sparkles,
  Send,
  CheckCircle2,
  Bot,
} from "lucide-react";

type Status = "未対応" | "対応中" | "完了";
interface ThreadMsg {
  from: "user" | "operator" | "bot" | "system";
  text: string;
  time?: string;
}
interface Conversation {
  id: string;
  name: string;
  channel: string;
  time: string;
  status: Status;
  unread: boolean;
  suggestion: string;
  thread: ThreadMsg[];
}

const INITIAL: Conversation[] = [
  {
    id: "c1",
    name: "匿名のお客様",
    channel: "Webチャット",
    time: "たった今",
    status: "未対応",
    unread: true,
    suggestion:
      "海外発送は現在、国内のみの対応となっており承っておりません。ご希望に添えず申し訳ございません。",
    thread: [
      { from: "user", text: "海外発送はできますか？", time: "10:42" },
      { from: "bot", text: "登録情報では確認できませんでした。担当者におつなぎします。", time: "10:42" },
      { from: "system", text: "お客様が担当者を呼びました" },
    ],
  },
  {
    id: "c2",
    name: "山田 様",
    channel: "Webチャット",
    time: "3分前",
    status: "対応中",
    unread: false,
    suggestion:
      "対象のご注文を確認しました。返品手続きを進めます。送り先の住所に変更はございませんか？",
    thread: [
      { from: "user", text: "返品したいのですが、方法を教えてください", time: "10:31" },
      { from: "operator", text: "マイページの注文履歴からお手続きいただけます。対象のご注文はお決まりですか？", time: "10:33" },
      { from: "user", text: "先週届いたTシャツです", time: "10:35" },
    ],
  },
  {
    id: "c3",
    name: "匿名のお客様",
    channel: "Webチャット",
    time: "22分前",
    status: "完了",
    unread: false,
    suggestion: "",
    thread: [
      { from: "user", text: "領収書は発行できますか？", time: "10:10" },
      { from: "operator", text: "はい、マイページの注文詳細から発行いただけます。", time: "10:12" },
      { from: "user", text: "できました、ありがとうございました！", time: "10:14" },
    ],
  },
];

const STATUS_TONE: Record<Status, "warn" | "brand" | "success"> = {
  未対応: "warn",
  対応中: "brand",
  完了: "success",
};

const QUICK = ["少々お待ちください。", "ご確認ありがとうございます。", "ほかにご不明点はございますか？"];

export default function InboxPage() {
  const [convs, setConvs] = useState<Conversation[]>(INITIAL);
  const [selectedId, setSelectedId] = useState("c1");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = convs.find((c) => c.id === selectedId)!;

  // 返信などでスレッドが伸びたら最新へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [selected.thread.length, selectedId]);

  function sendReply() {
    const t = input.trim();
    if (!t) return;
    setInput("");
    setConvs((cs) =>
      cs.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              status: c.status === "完了" ? c.status : "対応中",
              unread: false,
              thread: [...c.thread, { from: "operator", text: t, time: "今" }],
            }
          : c,
      ),
    );
  }

  function complete() {
    setInput("");
    setConvs((cs) =>
      cs.map((c) => (c.id === selectedId ? { ...c, status: "完了", unread: false } : c)),
    );
  }

  function selectConv(id: string) {
    setSelectedId(id);
    setInput("");
    setConvs((cs) => cs.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Headset className="h-5 w-5 text-[var(--color-brand)]" />
        <h1 className="text-lg font-semibold text-neutral-900">有人チャット受信箱</h1>
        <span className="text-xs text-neutral-400">お客様から担当者への接続要求がここに届きます</span>
      </div>

      <Card className="flex h-[72vh] flex-col overflow-hidden p-0 md:flex-row">
        {/* 左：会話一覧 */}
        <div className="flex h-2/5 w-full shrink-0 flex-col border-b border-[var(--color-hairline)] md:h-auto md:w-[clamp(220px,32%,320px)] md:border-b-0 md:border-r">
          <div className="border-b border-[var(--color-hairline)] px-4 py-2.5 text-xs font-medium text-neutral-500">
            会話一覧
          </div>
          <div className="flex-1 overflow-y-auto">
            {convs.map((c) => {
              const active = c.id === selectedId;
              const last = c.thread[c.thread.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => selectConv(c.id)}
                  className={`flex w-full flex-col gap-1 border-b border-[var(--color-hairline)] px-4 py-3 text-left ${
                    active ? "bg-[var(--color-brand-soft)]" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="flex-1 truncate text-sm font-medium text-neutral-800">
                      {c.name}
                    </span>
                    {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-warn)]" />}
                  </div>
                  <p className="truncate pl-9 text-xs text-neutral-500">{last?.text}</p>
                  <div className="flex items-center gap-2 pl-9">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                    <span className="text-[11px] text-neutral-400">{c.time}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右：会話スレッド＋返信 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 border-b border-[var(--color-hairline)] px-5 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">{selected.name}</p>
              <p className="text-[11px] text-neutral-400">{selected.channel}</p>
            </div>
            <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
            {selected.status !== "完了" && (
              <button
                onClick={complete}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-hairline)] px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-[var(--color-success-soft)] hover:text-[var(--color-success)]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                対応完了にする
              </button>
            )}
          </div>

          {/* スレッド */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 px-5 py-4">
            {selected.thread.map((m, i) => {
              if (m.from === "system") {
                return (
                  <div key={i} className="flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-neutral-500 shadow-sm">
                      {m.text}
                    </span>
                  </div>
                );
              }
              if (m.from === "user") {
                return (
                  <div key={i} className="flex flex-col items-start">
                    <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-neutral-800 shadow-sm">
                      {m.text}
                    </div>
                    {m.time && <span className="mt-0.5 pl-1 text-[10px] text-neutral-400">お客様 · {m.time}</span>}
                  </div>
                );
              }
              // operator / bot は右側（自社側）
              const isBot = m.from === "bot";
              return (
                <div key={i} className="flex flex-col items-end">
                  <div
                    className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm shadow-sm"
                    style={
                      isBot
                        ? { background: "#fff", color: "#23507f" }
                        : { background: "var(--color-brand)", color: "#fff" }
                    }
                  >
                    {m.text}
                  </div>
                  <span className="mt-0.5 flex items-center gap-1 pr-1 text-[10px] text-neutral-400">
                    {isBot ? (
                      <>
                        <Bot className="h-3 w-3" /> AI
                      </>
                    ) : (
                      <>
                        <Headset className="h-3 w-3" /> 担当者
                      </>
                    )}
                    {m.time ? ` · ${m.time}` : ""}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* 返信エリア */}
          {selected.status === "完了" ? (
            <div className="border-t border-[var(--color-hairline)] px-5 py-4 text-center text-xs text-neutral-400">
              この会話は対応完了しています。
            </div>
          ) : (
            <div className="border-t border-[var(--color-hairline)] px-5 py-3">
              {/* AI提案・定型文 */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {selected.suggestion && (
                  <button
                    onClick={() => setInput(selected.suggestion)}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-ai-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-ai)] hover:opacity-90"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AIの提案を使う
                  </button>
                )}
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-full border border-[var(--color-hairline)] px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  rows={2}
                  placeholder="返信を入力（⌘/Ctrl + Enter で送信）"
                  className="flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[var(--color-brand)]"
                />
                <button
                  onClick={sendReply}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 text-sm font-medium text-white hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  送信
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <p className="mt-3 text-xs text-neutral-400">
        ※ 見本のため、お客様役の返信は自動では届きません。実際は、お客様の画面にこの返信がリアルタイムで表示されます。
      </p>
    </div>
  );
}
