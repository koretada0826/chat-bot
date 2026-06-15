// 見本デモ用のサンプルデータ一式（ECサイト問い合わせデモ）。
// すべて表示用のダミー。保存・API連携はしない。

export const DEMO_PROJECT = {
  name: "ECサイト問い合わせデモ",
  botName: "AnswerOps Bot",
  status: "見本モード",
  botState: "テスト中" as "公開中" | "テスト中",
  lastSync: "5分前",
};

// 上部ヘッダーの期間フィルター
export const PERIODS = ["今日", "7日", "30日", "カスタム"] as const;

// サイドバーのバッジ
export const SIDEBAR_BADGES = {
  unresolved: 14, // 未解決の「質問の種類」数（トレンドトピック数と一致）
  negative: 7,
  improvements: 12,
};

// 今週の改善サマリー
export const IMPROVEMENT_SUMMARY = {
  headline:
    "未解決質問は「海外発送」「定期便解約」「ギフト包装」に集中しています。この3件をFAQ化すると、推定で月53件の問い合わせ削減が見込めます。",
  reducible: 53, // 件/月
  savedHours: 8.8, // 時間/週
  topTheme: "海外発送",
  recommended: "FAQを新規作成",
};

// KPIカード（8指標）
export interface Kpi {
  key: string;
  label: string;
  value: string;
  delta: string; // 前週比
  trend: "up" | "down";
  good: boolean; // 良い変化か
  tone: "brand" | "ai" | "success" | "warn" | "danger" | "neutral";
  note: string;
  spark: number[];
}

export const KPIS: Kpi[] = [
  { key: "conversations", label: "会話数", value: "1,247", delta: "+12.4%", trend: "up", good: true, tone: "brand", note: "今週の総会話数", spark: [62, 70, 58, 81, 96, 74, 88, 92, 110, 105, 118, 124, 130, 138] },
  { key: "users", label: "ユニークユーザー", value: "199", delta: "+7.8%", trend: "up", good: true, tone: "brand", note: "重複なしの利用者", spark: [12, 14, 11, 16, 18, 15, 17, 19, 21, 20, 22, 23, 25, 27] },
  { key: "selfResolve", label: "自己解決率", value: "74%", delta: "+8.2pt", trend: "up", good: true, tone: "success", note: "改善傾向", spark: [60, 62, 61, 64, 66, 68, 67, 69, 70, 71, 72, 72, 73, 74] },
  { key: "aiAnswer", label: "AI回答率", value: "81%", delta: "+5.4pt", trend: "up", good: true, tone: "ai", note: "良好", spark: [70, 72, 71, 74, 75, 76, 77, 78, 79, 79, 80, 80, 81, 81] },
  { key: "unresolved", label: "未解決率", value: "19%", delta: "-3.1pt", trend: "down", good: true, tone: "warn", note: "要改善", spark: [27, 26, 25, 24, 23, 23, 22, 22, 21, 21, 20, 20, 19, 19] },
  { key: "negative", label: "低評価率", value: "6%", delta: "-1.2pt", trend: "down", good: true, tone: "danger", note: "良好", spark: [9, 9, 8, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6] },
  { key: "savedHours", label: "推定削減時間", value: "8.8h", delta: "+2.1h", trend: "up", good: true, tone: "success", note: "今週の削減見込み", spark: [4, 4.5, 5, 5.4, 6, 6.3, 6.8, 7, 7.4, 7.7, 8, 8.3, 8.6, 8.8] },
  { key: "improvements", label: "FAQ改善候補", value: "12件", delta: "優先5件", trend: "up", good: false, tone: "neutral", note: "うち優先対応5件", spark: [4, 5, 6, 7, 8, 8, 9, 10, 10, 11, 11, 12, 12, 12] },
];

// 質問数の推移（14日：質問数 / AI回答 / 未解決）
export const TREND_14D = [
  { d: "5/29", q: 62, ai: 44, un: 18 }, { d: "5/30", q: 70, ai: 52, un: 18 },
  { d: "5/31", q: 58, ai: 43, un: 15 }, { d: "6/1", q: 81, ai: 62, un: 19 },
  { d: "6/2", q: 96, ai: 74, un: 22 }, { d: "6/3", q: 74, ai: 58, un: 16 },
  { d: "6/4", q: 88, ai: 69, un: 19 }, { d: "6/5", q: 92, ai: 73, un: 19 },
  { d: "6/6", q: 110, ai: 88, un: 22 }, { d: "6/7", q: 105, ai: 85, un: 20 },
  { d: "6/8", q: 118, ai: 96, un: 22 }, { d: "6/9", q: 124, ai: 101, un: 23 },
  { d: "6/10", q: 130, ai: 107, un: 23 }, { d: "6/11", q: 138, ai: 113, un: 25 },
];

// 回答ステータス内訳
export const STATUS_BREAKDOWN = [
  { name: "FAQ回答", value: 612, color: "var(--color-brand)" },
  { name: "ドキュメント回答", value: 398, color: "var(--color-ai)" },
  { name: "有人引き継ぎ", value: 64, color: "var(--color-success)" },
  { name: "未解決", value: 173, color: "var(--color-warn)" },
];

// カテゴリ別質問数
export const CATEGORY_COUNTS = [
  { name: "配送", value: 142 }, { name: "返品", value: 86 },
  { name: "ログイン", value: 64 }, { name: "支払い", value: 51 },
  { name: "キャンセル", value: 43 },
];

// 時間帯別利用（9〜21時）
export const HOURLY_USAGE = [
  { h: "9", v: 22 }, { h: "10", v: 41 }, { h: "11", v: 58 }, { h: "12", v: 47 },
  { h: "13", v: 63 }, { h: "14", v: 71 }, { h: "15", v: 66 }, { h: "16", v: 59 },
  { h: "17", v: 52 }, { h: "18", v: 44 }, { h: "19", v: 38 }, { h: "20", v: 29 },
  { h: "21", v: 18 },
];

// 改善アクション（今やるべき改善）
export interface ImprovementAction {
  id: string;
  question: string;
  unresolved: number;
  similar: number;
  priority: "高" | "中" | "低";
  recommended: string;
  reduce: number; // 月◯件
  action: "generate" | "improve";
}
export const IMPROVEMENT_ACTIONS: ImprovementAction[] = [
  { id: "a1", question: "海外発送はできますか？", unresolved: 23, similar: 8, priority: "高", recommended: "FAQ新規作成", reduce: 23, action: "generate" },
  { id: "a2", question: "定期便の解約方法を教えてください", unresolved: 18, similar: 5, priority: "高", recommended: "既存FAQ改善", reduce: 18, action: "improve" },
  { id: "a3", question: "ギフト包装はできますか？", unresolved: 12, similar: 4, priority: "中", recommended: "FAQ新規作成", reduce: 12, action: "generate" },
  { id: "a4", question: "領収書の宛名変更はできますか？", unresolved: 9, similar: 3, priority: "中", recommended: "FAQ新規作成", reduce: 9, action: "generate" },
  { id: "a5", question: "クーポンが使えません", unresolved: 7, similar: 6, priority: "低", recommended: "既存FAQ改善", reduce: 7, action: "improve" },
];

// トレンドトピック（タグ＋件数。highlight=未解決多）
export const TREND_TOPICS = [
  { tag: "配送", count: 142, hot: false }, { tag: "海外発送", count: 23, hot: true },
  { tag: "返品", count: 86, hot: false }, { tag: "キャンセル", count: 43, hot: false },
  { tag: "定期便", count: 38, hot: true }, { tag: "ギフト包装", count: 31, hot: true },
  { tag: "ログイン", count: 64, hot: false }, { tag: "支払い", count: 51, hot: false },
  { tag: "領収書", count: 27, hot: false }, { tag: "クーポン", count: 29, hot: true },
  { tag: "会員登録", count: 24, hot: false }, { tag: "メールアドレス", count: 19, hot: false },
  { tag: "交換", count: 22, hot: false }, { tag: "注文変更", count: 17, hot: false },
];

// FAQ別パフォーマンス
export interface FaqPerf {
  question: string;
  category: string;
  views: number;
  resolved: number;
  unresolved: number;
  resolveRate: number;
  negativeRate: number;
  state: "良好" | "改善余地" | "要改善";
}
export const FAQ_PERFORMANCE: FaqPerf[] = [
  { question: "送料はいくらですか？", category: "配送", views: 142, resolved: 129, unresolved: 13, resolveRate: 91, negativeRate: 3, state: "良好" },
  { question: "返品できますか？", category: "返品", views: 86, resolved: 67, unresolved: 19, resolveRate: 78, negativeRate: 8, state: "改善余地" },
  { question: "ログインできません", category: "アカウント", views: 64, resolved: 40, unresolved: 24, resolveRate: 62, negativeRate: 14, state: "要改善" },
  { question: "定期便を解約したい", category: "定期便", views: 58, resolved: 34, unresolved: 24, resolveRate: 59, negativeRate: 18, state: "要改善" },
  { question: "支払い方法を変更したい", category: "支払い", views: 51, resolved: 44, unresolved: 7, resolveRate: 86, negativeRate: 5, state: "良好" },
];

// 右インサイトパネル
export const INSIGHTS = {
  alerts: [
    { tone: "warn", text: "未解決率が上昇しています" },
    { tone: "danger", text: "ログイン関連の低評価が増えています" },
  ],
  suggestions: [
    "海外発送FAQを追加してください",
    "定期便解約FAQの回答文を短くしてください",
    "返品ポリシー.pdf を更新してください",
  ],
  events: [
    "FAQ「送料はいくらですか？」が142回表示",
    "ドキュメント「返品ポリシー.pdf」が38回参照",
    "未解決質問が新たに3件増えました",
  ],
};

// ===== チャット（見本）=====
export type ChatMode = "faq" | "doc" | "ai";

export interface ChatSource {
  file: string;
  page: number;
  score: number;
}

export interface ChatScript {
  keywords: string[];
  answerType: "FAQ回答" | "AI生成回答";
  answer: string;
  sources?: ChatSource[];
  related?: string[];
}

export const CHAT_GREETING =
  "こんにちは！AnswerOps Bot です。ご質問をどうぞ。下のカテゴリから選ぶこともできます。";

export const CHAT_CATEGORIES = ["配送について", "返品・交換", "ログイン", "支払い", "定期便"];

export const CHAT_SUGGESTED = [
  "送料はいくらですか？",
  "ログインできなくなりました",
  "トースターのお手入れ方法",
  "海外発送はできますか？",
];

export const CHAT_SCRIPTS: ChatScript[] = [
  {
    keywords: ["送料", "そうりょう", "配送料", "いくら", "配送について"],
    answerType: "FAQ回答",
    answer:
      "通常配送の送料は全国一律550円です。税込5,000円以上のご注文で送料無料になります。",
    related: ["配送日時を指定できますか？", "海外発送はできますか？"],
  },
  {
    keywords: ["返品", "へんぴん", "返金", "交換"],
    answerType: "FAQ回答",
    answer:
      "商品到着後7日以内で未使用の場合に限り、返品・交換を承ります。マイページの注文履歴からお手続きください。",
    related: ["返品送料は誰が負担しますか？", "サイズ交換はできますか？"],
  },
  {
    keywords: ["ログイン", "ろぐいん", "パスワード", "入れない", "サインイン"],
    answerType: "AI生成回答",
    answer:
      "ログインできない場合には、以下の可能性が考えられます。\n\n1. ユーザーIDとパスワードが正しく入力されているか確認してください。\n2. パスワードを忘れた場合は、パスワード再設定手順に従ってください。\n3. ブラウザを再起動し、再試行してください。\n4. キャッシュをクリアすると解消する場合があります。\n\nそれでも問題が続く場合は、サポート窓口へお問い合わせください。",
    sources: [
      { file: "会員ログイン・パスワードFAQ.pdf", page: 3, score: 0.89 },
      { file: "会員ログイン・パスワードFAQ.pdf", page: 4, score: 0.82 },
    ],
  },
  {
    keywords: ["トースター", "お手入れ", "手入れ", "掃除", "クラフトレイ"],
    answerType: "AI生成回答",
    answer:
      "トースターのお手入れ方法は以下の通りです。\n\n1. 使用後は必ず電源コードを抜いてください。\n2. 本体が完全に冷めてから、クラフトレイをスライドアウトしてください。\n3. 外部は軽く湿らせた布で拭いてください。強い洗剤や研磨剤は使用しないでください。",
    sources: [{ file: "トースターXT-2023取扱説明書.pdf", page: 8, score: 0.87 }],
  },
];

export const CHAT_UNANSWERED =
  "登録されているFAQ・ドキュメント内では確認できませんでした。\nこの質問は未解決として記録され、管理者の改善候補に追加されます。\n必要な場合は問い合わせフォームから担当者へ連絡できます。";

export const INQUIRY_TYPES = ["商品について", "配送について", "返品・交換", "その他"];
