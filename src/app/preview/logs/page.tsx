"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/saas";
import { Bot, Headset, ThumbsUp, ThumbsDown } from "lucide-react";

type Status = "解決" | "未解決" | "有人対応";
type Answer = "FAQ回答" | "AI生成回答" | "未解決";
type Rating = "up" | "down" | null;

interface TMsg {
  from: "user" | "bot" | "operator" | "system";
  text: string;
  time?: string;
  answerType?: "FAQ回答" | "AI生成回答";
}
interface Log {
  id: string;
  date: string;
  time: string;
  customer: string;
  answer: Answer;
  status: Status;
  rating: Rating;
  q: string;
  thread: TMsg[];
}

const LOGS: Log[] = [
  {
    id: "l1", date: "6/12", time: "10:42", customer: "匿名のお客様",
    answer: "未解決", status: "有人対応", rating: null, q: "海外発送はできますか？",
    thread: [
      { from: "user", text: "海外発送はできますか？", time: "10:42" },
      { from: "bot", text: "登録情報では確認できませんでした。担当者におつなぎします。", time: "10:42" },
      { from: "system", text: "担当者が会話に参加しました" },
      { from: "operator", text: "海外発送は現在、国内のみの対応です。ご希望に添えず申し訳ございません。", time: "10:45" },
    ],
  },
  {
    id: "l2", date: "6/12", time: "10:31", customer: "山田 様",
    answer: "FAQ回答", status: "解決", rating: "up", q: "返品の方法を教えてください",
    thread: [
      { from: "user", text: "返品の方法を教えてください", time: "10:31" },
      { from: "bot", text: "商品到着後7日以内で未使用の場合、マイページの注文履歴から返品手続きができます。", time: "10:31", answerType: "FAQ回答" },
      { from: "system", text: "お客様が「解決した」を選択しました" },
    ],
  },
  {
    id: "l3", date: "6/12", time: "09:58", customer: "匿名のお客様",
    answer: "AI生成回答", status: "解決", rating: "up", q: "ログインできなくなりました",
    thread: [
      { from: "user", text: "ログインできなくなりました", time: "09:58" },
      { from: "bot", text: "パスワード再設定をお試しください。ユーザーIDの確認、ブラウザの再起動もお試しください。（会員ログイン・パスワードFAQ p.3 を参照）", time: "09:58", answerType: "AI生成回答" },
    ],
  },
  {
    id: "l4", date: "6/12", time: "09:30", customer: "匿名のお客様",
    answer: "AI生成回答", status: "未解決", rating: "down", q: "定期便の解約方法を教えて",
    thread: [
      { from: "user", text: "定期便の解約方法を教えて", time: "09:30" },
      { from: "bot", text: "解約に関する情報が見つかりませんでした。", time: "09:30" },
      { from: "system", text: "お客様が「解決しなかった」を選択しました" },
    ],
  },
  {
    id: "l5", date: "6/11", time: "18:12", customer: "匿名のお客様",
    answer: "FAQ回答", status: "解決", rating: null, q: "送料はいくらですか？",
    thread: [
      { from: "user", text: "送料はいくらですか？", time: "18:12" },
      { from: "bot", text: "全国一律550円です。税込5,000円以上のご注文で送料無料になります。", time: "18:12", answerType: "FAQ回答" },
    ],
  },
  {
    id: "l6", date: "6/11", time: "15:03", customer: "鈴木 様",
    answer: "FAQ回答", status: "解決", rating: "up", q: "ギフト包装はできますか？",
    thread: [
      { from: "user", text: "ギフト包装はできますか？", time: "15:03" },
      { from: "bot", text: "はい、ご注文時にギフト包装をご指定いただけます（有料）。", time: "15:03", answerType: "FAQ回答" },
    ],
  },
  {
    id: "l7", date: "6/11", time: "11:20", customer: "匿名のお客様",
    answer: "未解決", status: "未解決", rating: null, q: "海外発送はできますか？",
    thread: [
      { from: "user", text: "海外発送はできますか？", time: "11:20" },
      { from: "bot", text: "登録されているFAQ・ドキュメント内では確認できませんでした。", time: "11:20" },
    ],
  },
  {
    id: "l8", date: "6/11", time: "10:05", customer: "匿名のお客様",
    answer: "AI生成回答", status: "解決", rating: "up", q: "トースターのお手入れ方法",
    thread: [
      { from: "user", text: "トースターのお手入れ方法", time: "10:05" },
      { from: "bot", text: "使用後は電源コードを抜き、本体が冷めてからトレイを外して拭いてください。（トースターXT-2023取扱説明書 p.8 を参照）", time: "10:05", answerType: "AI生成回答" },
    ],
  },
];

const STATUS_TONE: Record<Status, "success" | "warn" | "brand"> = {
  解決: "success", 未解決: "warn", 有人対応: "brand",
};
const ANSWER_TONE: Record<Answer, "brand" | "ai" | "neutral"> = {
  FAQ回答: "brand", AI生成回答: "ai", 未解決: "neutral",
};

const FILTERS = [
  { key: "all", label: "すべて" },
  { key: "unresolved", label: "未解決" },
  { key: "low", label: "低評価" },
  { key: "human", label: "有人対応" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function match(l: Log, f: FilterKey) {
  if (f === "all") return true;
  if (f === "unresolved") return l.status === "未解決";
  if (f === "low") return l.rating === "down";
  if (f === "human") return l.status === "有人対応";
  return true;
}

export default function LogsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState("l1");

  const list = LOGS.filter((l) => match(l, filter));
  // しぼり込んだ結果に選択中の会話が無ければ、先頭を表示する
  const selected = list.find((l) => l.id === selectedId) ?? list[0];

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-lg font-semibold text-neutral-900">チャットログ</h1>
        <span className="text-xs text-neutral-400">お客様との会話の記録（全{LOGS.length}件）</span>
      </div>
      <p className="mb-4 text-xs text-neutral-400">
        会話を選ぶと、やり取りの中身が見られます。未解決や低評価をしぼり込んで、改善のヒントを探せます。
      </p>

      {/* しぼり込み */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = LOGS.filter((l) => match(l, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-[var(--color-brand)] text-white"
                  : "border border-[var(--color-hairline)] text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {f.label}（{count}）
            </button>
          );
        })}
      </div>

      <Card className="flex h-[68vh] flex-col overflow-hidden p-0 md:flex-row">
        {/* 左：会話一覧 */}
        <div className="flex h-2/5 w-full shrink-0 flex-col border-b border-[var(--color-hairline)] md:h-auto md:w-[clamp(240px,38%,360px)] md:border-b-0 md:border-r">
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-neutral-400">該当する会話はありません。</p>
            )}
            {list.map((l) => {
              const active = l.id === selected?.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedId(l.id)}
                  className={`flex w-full flex-col gap-1 border-b border-[var(--color-hairline)] px-4 py-3 text-left ${
                    active ? "bg-[var(--color-brand-soft)]" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">{l.date} {l.time}</span>
                    <span className="truncate text-xs text-neutral-500">{l.customer}</span>
                    <span className="ml-auto">
                      {l.rating === "up" && <ThumbsUp className="h-3.5 w-3.5 text-[var(--color-success)]" />}
                      {l.rating === "down" && <ThumbsDown className="h-3.5 w-3.5 text-[var(--color-danger)]" />}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-neutral-800">{l.q}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={ANSWER_TONE[l.answer]}>{l.answer}</Badge>
                    <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右：会話の中身 */}
        <div className="flex min-w-0 flex-1 flex-col">
         {!selected ? (
          <div className="flex flex-1 items-center justify-center text-xs text-neutral-400">
            会話を選んでください
          </div>
         ) : (
          <>
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-hairline)] px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{selected.q}</p>
              <p className="text-[11px] text-neutral-400">
                {selected.date} {selected.time} ・ {selected.customer} ・ Webチャット
              </p>
            </div>
            <Badge tone={ANSWER_TONE[selected.answer]}>{selected.answer}</Badge>
            <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
            {selected.rating === "up" && <Badge tone="success">👍 解決した</Badge>}
            {selected.rating === "down" && <Badge tone="danger">👎 解決せず</Badge>}
          </div>

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
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[78%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[var(--color-brand)] px-3.5 py-2.5 text-sm text-white shadow-sm">
                      {m.text}
                    </div>
                  </div>
                );
              }
              const isOp = m.from === "operator";
              return (
                <div key={i} className="flex gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: isOp ? "#0e9f6e" : "#5a8ed6" }}
                  >
                    {isOp ? <Headset className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="inline-block max-w-full whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-700 shadow-sm">
                      {m.text}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {m.answerType && (
                        <Badge tone={m.answerType === "FAQ回答" ? "brand" : "ai"}>{m.answerType}</Badge>
                      )}
                      {isOp && <Badge tone="success">担当者</Badge>}
                      {m.time && <span className="text-[10px] text-neutral-400">{m.time}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
         )}
        </div>
      </Card>
    </div>
  );
}
