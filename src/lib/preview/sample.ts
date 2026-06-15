// プレビュー（見本）用のサンプルデータ。Supabaseなしで画面を見せるためのもの。

export interface SampleFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: "published" | "draft";
  keywords: string[];
}

export const SAMPLE_FAQS: SampleFaq[] = [
  {
    id: "f1",
    question: "送料はいくらですか？",
    answer: "全国一律550円です。5,000円以上のご購入で送料無料になります。",
    category: "配送",
    status: "published",
    keywords: ["送料", "そうりょう", "配送料", "いくら", "無料", "配送", "はいそう"],
  },
  {
    id: "f2",
    question: "返品はできますか？",
    answer: "商品到着後7日以内で未使用の場合に限り、返品を承ります。マイページの注文履歴からお手続きください。",
    category: "返品・キャンセル",
    status: "published",
    keywords: ["返品", "へんぴん", "返金", "へんきん", "交換", "キャンセル"],
  },
  {
    id: "f3",
    question: "パスワードを忘れました",
    answer: "ログイン画面の「パスワードをお忘れの方」から、メールアドレスを入力して再設定できます。",
    category: "会員・ログイン",
    status: "published",
    keywords: ["パスワード", "ぱすわーど", "パス", "ログインできない", "ろぐいん", "再設定", "ログイン"],
  },
  {
    id: "f4",
    question: "支払い方法は何がありますか？",
    answer: "クレジットカード・コンビニ払い・代金引換がご利用いただけます。",
    category: "支払い",
    status: "published",
    keywords: ["支払い", "しはらい", "支払", "決済", "けっさい", "クレジット", "コンビニ", "代引き", "だいびき"],
  },
  {
    id: "f5",
    question: "営業時間を教えてください",
    answer: "カスタマーサポートの受付は平日10:00〜18:00です（土日祝を除く）。",
    category: "その他",
    status: "draft",
    keywords: ["営業時間", "えいぎょう", "受付", "うけつけ", "何時", "問い合わせ時間"],
  },
];

export const SAMPLE_CATEGORIES = ["配送", "返品・キャンセル", "会員・ログイン", "支払い", "その他"];

// ダッシュボード用のサンプル数値
export const SAMPLE_DASHBOARD = {
  rates: { resolved: 0.74, aiAnswer: 0.81, unresolved: 0.19, lowRating: 0.06 },
  questions: { today: 38, last7: 264, last30: 1120 },
  trend: [12, 18, 9, 22, 31, 14, 8, 11, 27, 33, 19, 24, 15, 38],
  topQuestions: [
    { question: "送料はいくらですか？", count: 142 },
    { question: "返品はできますか？", count: 98 },
    { question: "パスワードを忘れました", count: 76 },
    { question: "配達日はいつ？", count: 54 },
    { question: "領収書は発行できますか？", count: 41 },
  ],
  topUnresolved: [
    { question: "海外발送はできますか？", count: 23 },
    { question: "定期便の解約方法は？", count: 18 },
    { question: "ギフト包装はできますか？", count: 12 },
  ],
};

export const SAMPLE_SUGGESTIONS = [
  {
    id: "s1",
    title: "海外発送はできますか？",
    count: 23,
    draftAnswer: "申し訳ございませんが、現在は日本国内のみの発送となっております。海外への発送には対応しておりません。",
    category: "配送",
  },
  {
    id: "s2",
    title: "定期便の解約方法を教えてください",
    count: 18,
    draftAnswer: "マイページの「定期便の管理」から、次回お届け予定日の7日前までにお手続きいただけます。",
    category: "返品・キャンセル",
  },
  {
    id: "s3",
    title: "ギフト包装はできますか？",
    count: 12,
    draftAnswer: "ご注文時に「ギフト包装を希望する」をお選びいただくと、有料（330円）で承ります。",
    category: "その他",
  },
];
