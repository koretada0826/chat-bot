import Link from "next/link";
import { Card } from "@/components/ui/saas";
import {
  MessageSquare,
  Database,
  Lightbulb,
  Wrench,
  FileQuestion,
  FileText,
  BookA,
  Code2,
  MessagesSquare,
  CircleAlert,
  Sparkles,
  ThumbsDown,
  Wand2,
  ArrowRight,
  Building2,
  LifeBuoy,
  Headset,
} from "lucide-react";

// サービスの基本ループ（答える→溜める→気づく→直す）
const LOOP = [
  { icon: MessageSquare, title: "答える", body: "お客様の質問に、登録した内容でAIが自動で答えます。", color: "brand" },
  { icon: Database, title: "溜める", body: "質問と答えが自動で記録されていきます。", color: "ai" },
  { icon: Lightbulb, title: "気づく", body: "答えられなかった質問・低評価が一目でわかります。", color: "warn" },
  { icon: Wrench, title: "直す", body: "FAQを足す・直す。AIが下書きも作ります。", color: "success" },
];

// 事業者向けの4ステップ
const STEPS = [
  {
    n: 1,
    title: "登録する（答えのもとを入れる）",
    body: "まずは「答えのもと」を入れます。よくある質問（FAQ）・PDFなどの資料・専門用語の3つ。これが多いほど、AIがたくさん答えられます。",
    screens: [
      { label: "FAQ", href: "/preview/faqs", icon: FileQuestion },
      { label: "ドキュメント", href: "/preview/documents", icon: FileText },
      { label: "用語辞書", href: "/preview/dictionary", icon: BookA },
    ],
  },
  {
    n: 2,
    title: "公開する（サイトに貼る）",
    body: "発行された「埋め込みコード」を自社サイトに貼るだけ。お客様の画面にチャットが出るようになります。",
    screens: [{ label: "埋め込みコード", href: "/preview/embed", icon: Code2 }],
  },
  {
    n: 3,
    title: "たまるのを見る・人が対応する（運用）",
    body: "お客様の質問は自動でログにたまります。答えられなかったものは「未解決質問」に集まります。お客様が「担当者を呼ぶ」を押したときは、「有人チャット受信箱」に届き、その場で人が返信できます。",
    screens: [
      { label: "チャットログ", href: "/preview/logs", icon: MessagesSquare },
      { label: "未解決質問", href: "/preview/unresolved", icon: CircleAlert },
      { label: "有人チャット", href: "/preview/inbox", icon: Headset },
    ],
  },
  {
    n: 4,
    title: "直す（改善する）",
    body: "「改善候補」や「低評価回答」を見て、FAQを足したり直したり。AIが回答の下書きも作ってくれるので、ボタンひとつで増やせます。",
    screens: [
      { label: "改善候補", href: "/preview/suggestions", icon: Sparkles },
      { label: "低評価回答", href: "/preview/low-rated", icon: ThumbsDown },
      { label: "Q&A自動生成", href: "/preview/generate", icon: Wand2 },
    ],
  },
];

// よくある質問
const FAQ = [
  {
    q: "使うのにAIの料金は必要？",
    a: "FAQの即答（登録した文章を返すだけ）は軽い処理です。AIが文章を考えて答える機能を使う時だけ、AIの利用料がかかります。見本モードは無料で試せます。",
  },
  {
    q: "企業ごとに内容を変えられる？",
    a: "はい。プロジェクト（企業）ごとに、FAQも資料もデザインも別々に設定できます。会社が違えば中身も完全に分かれます。",
  },
  {
    q: "質問のデータは溜まっていく？",
    a: "本番ではすべて記録され、未解決の発見や改善に使えます（見本モードでは保存されません）。",
  },
];

const DOT: Record<string, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  ai: "bg-[var(--color-ai-soft)] text-[var(--color-ai)]",
  warn: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
};

export default function GuidePage() {
  return (
    <div className="space-y-6">
      {/* ヒーロー */}
      <Card className="overflow-hidden">
        <div className="bg-[var(--color-brand-soft)] px-6 py-7">
          <p className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)]">
            <Building2 className="h-3.5 w-3.5" />
            使い方ガイド（事業者向け）
          </p>
          <h1 className="mt-1 text-xl font-bold text-neutral-900">
            3分でわかる、AnswerOps AI の使い方
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            このページは、管理画面を使う「事業者（あなた）」向けです。お客様の質問に自動で答え、たまった質問から改善点に気づき、直していく——
            その流れを、下の順番どおりに進めれば大丈夫です。
          </p>
        </div>
      </Card>

      {/* 基本の流れ */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">まずは全体像（4つのくり返し）</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LOOP.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="relative p-4">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${DOT[s.color]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-neutral-900">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{s.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 事業者向け 4ステップ */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">
          管理画面の使い方（4ステップ）
        </h2>
        <div className="space-y-3">
          {STEPS.map((step) => (
            <Card key={step.n} className="p-5">
              <div className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white">
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-neutral-400">使う画面：</span>
                    {step.screens.map((sc) => {
                      const Icon = sc.icon;
                      return (
                        <Link
                          key={sc.href}
                          href={sc.href}
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-hairline)] px-2.5 py-1 text-xs text-neutral-600 hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {sc.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* よくある質問 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">よくある質問</h2>
        <div className="space-y-2.5">
          {FAQ.map((f) => (
            <Card key={f.q} className="p-4">
              <p className="text-sm font-semibold text-neutral-900">Q. {f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">A. {f.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* お客様にはどう見える？ */}
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ai-soft)] text-[var(--color-ai)]">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-neutral-900">お客様にはどう見える？</p>
            <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
              メニューなしの実物プレビューで確認できます。お客様向けの使い方は、チャット内の「？使い方」からお客様自身が読めます。
            </p>
          </div>
        </div>
        <Link
          href="/customer-view"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          お客様の見え方を見る
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
