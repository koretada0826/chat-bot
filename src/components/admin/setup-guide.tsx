import Link from "next/link";

interface Props {
  faqCount: number;
  docCount: number;
  dictCount: number;
  // プレビュー(見本)用にリンクの行き先を切り替える
  base?: "/admin" | "/preview";
  interactive?: boolean; // falseならリンクを無効化（見本）
}

interface Step {
  no: number;
  title: string;
  what: string;
  why: string;
  examples: string;
  href: string;
  count?: number;
  unit?: string;
}

export function SetupGuide({ faqCount, docCount, dictCount, base = "/admin", interactive = true }: Props) {
  const steps: Step[] = [
    {
      no: 1,
      title: "業種テンプレートを選ぶ",
      what: "あなたの業種を選ぶと、よくある質問が最初からまとめて入ります。",
      why: "ゼロから作らずに、その日から動かせます。",
      examples: "EC／不動産／通信／情シス／人事総務／役所 など",
      href: `${base}/templates`,
    },
    {
      no: 2,
      title: "FAQを登録する（質問と答え）",
      what: "お客さんからよく来る質問と、その正しい答えを登録します。テンプレを自社の内容に直すのが近道です。",
      why: "チャットボットの“答えの本”の中心。ここが充実するほど自己解決が増えます。",
      examples: "送料はいくら？／返品できる？／営業時間は？／手続きの方法は？",
      href: `${base}/faqs`,
      count: faqCount,
      unit: "件",
    },
    {
      no: 3,
      title: "ドキュメントを読み込ませる（資料）",
      what: "FAQに書ききれない詳しい資料を、ファイルでアップします（PDF・Word・CSV・テキスト）。中身からAIが答えます。",
      why: "細かい仕様や規程まで、FAQを1つずつ書かなくてもカバーできます。",
      examples: "業務マニュアル／利用規約／料金表／商品仕様書／社内手順書",
      href: `${base}/documents`,
      count: docCount,
      unit: "件",
    },
    {
      no: 4,
      title: "辞書に言い換えを登録する",
      what: "お客さんの砕けた言い方や社内用語を、正しい言葉に結びつけます。",
      why: "「そうりょう→送料」のように、いろんな聞き方でも答えに当たりやすくなります。",
      examples: "送料＝配送料／パス＝パスワード／略語・社内用語",
      href: `${base}/dictionary`,
      count: dictCount,
      unit: "件",
    },
    {
      no: 5,
      title: "あいさつ文・見た目を設定する",
      what: "最初のあいさつや、表示する色などを整えます。",
      why: "自社らしい第一印象に。",
      examples: "「こんにちは！ご質問をどうぞ」など",
      href: `${base}/settings`,
    },
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-900">はじめに：何を登録すればいい？</h2>
      <p className="mt-1 text-xs text-neutral-500">
        チャットボットに「答えのもと」を読み込ませます。下の順で登録すると、すぐ使い始められます。
      </p>

      <ol className="mt-4 space-y-3">
        {steps.map((s) => {
          const done = s.count !== undefined && s.count > 0;
          const inner = (
            <div className="flex gap-3 rounded-md border border-neutral-200 p-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-emerald-100 text-emerald-700" : "bg-neutral-900 text-white"
                }`}
              >
                {done ? "✓" : s.no}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-900">{s.title}</p>
                  {s.count !== undefined && (
                    <span className="shrink-0 text-xs text-neutral-400">
                      登録 {s.count}
                      {s.unit}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-600">{s.what}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  <span className="text-neutral-500">なぜ：</span>
                  {s.why}
                </p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  <span className="text-neutral-500">例：</span>
                  {s.examples}
                </p>
              </div>
            </div>
          );
          return (
            <li key={s.no}>
              {interactive ? (
                <Link href={s.href} className="block transition hover:opacity-80">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        💡 コツ：FAQの答えは「自社の正しい情報」を入れてください。あいまい・古い情報を入れると、AIもその通りに答えてしまいます。
      </p>
    </div>
  );
}
