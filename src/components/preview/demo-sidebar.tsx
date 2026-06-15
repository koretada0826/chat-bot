"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  Headset,
  CircleAlert,
  ThumbsDown,
  TrendingUp,
  FileQuestion,
  FolderTree,
  FileText,
  BookA,
  LayoutTemplate,
  Sparkles,
  Wand2,
  CopyCheck,
  PencilRuler,
  Bot,
  Eye,
  Palette,
  GitBranch,
  Search,
  Code2,
  Plug,
  Zap,
  Inbox,
  Settings2,
  Users,
  ShieldCheck,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import { SIDEBAR_BADGES, DEMO_PROJECT } from "@/lib/preview/demo-data";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "warn" | "danger" | "brand";
}
interface Group {
  title: string;
  items: Item[];
}

export const NAV: Group[] = [
  {
    title: "ホーム",
    items: [
      { label: "ダッシュボード", href: "/preview", icon: LayoutDashboard },
      { label: "使い方ガイド（事業者）", href: "/preview/guide", icon: BookOpen },
    ],
  },
  {
    title: "会話分析",
    items: [
      { label: "チャットログ", href: "/preview/logs", icon: MessagesSquare },
      { label: "有人チャット", href: "/preview/inbox", icon: Headset, badge: 1, badgeTone: "warn" },
      { label: "未解決質問", href: "/preview/unresolved", icon: CircleAlert, badge: SIDEBAR_BADGES.unresolved, badgeTone: "warn" },
      { label: "低評価回答", href: "/preview/low-rated", icon: ThumbsDown, badge: SIDEBAR_BADGES.negative, badgeTone: "danger" },
      { label: "トレンドトピック", href: "/preview/trends", icon: TrendingUp },
    ],
  },
  {
    title: "ナレッジ管理",
    items: [
      { label: "FAQ", href: "/preview/faqs", icon: FileQuestion },
      { label: "FAQカテゴリ", href: "/preview/categories", icon: FolderTree },
      { label: "業界テンプレート", href: "/preview/templates", icon: LayoutTemplate },
      { label: "ドキュメント", href: "/preview/documents", icon: FileText },
      { label: "用語辞書", href: "/preview/dictionary", icon: BookA },
    ],
  },
  {
    title: "AI改善",
    items: [
      { label: "改善候補", href: "/preview/suggestions", icon: Sparkles, badge: SIDEBAR_BADGES.improvements, badgeTone: "brand" },
      { label: "Q&A自動生成", href: "/preview/generate", icon: Wand2 },
      { label: "重複FAQチェック", href: "/preview/duplicates", icon: CopyCheck },
      { label: "回答改善提案", href: "/preview/answer-improve", icon: PencilRuler },
    ],
  },
  {
    title: "チャットボット",
    items: [
      { label: "チャットを試す", href: "/preview/chat", icon: Bot },
      { label: "お客様の見え方", href: "/customer-view", icon: Eye },
      { label: "デザイン設定", href: "/preview/design", icon: Palette },
      { label: "シナリオ設定", href: "/preview/scenario", icon: GitBranch },
      { label: "ドキュメント検索モード", href: "/preview/doc-search", icon: Search },
    ],
  },
  {
    title: "連携・公開",
    items: [
      { label: "Dify連携チャット", href: "/preview/dify-chat", icon: Zap },
      { label: "埋め込みコード", href: "/preview/embed", icon: Code2 },
      { label: "外部サービス連携", href: "/preview/integrations", icon: Plug },
      { label: "問い合わせフォーム", href: "/preview/inquiry", icon: Inbox },
    ],
  },
  {
    title: "設定",
    items: [
      { label: "プロジェクト設定", href: "/preview/project", icon: Settings2 },
      { label: "メンバー", href: "/preview/members", icon: Users },
      { label: "セキュリティ", href: "/preview/security", icon: ShieldCheck },
    ],
  },
];

const BADGE_TONE: Record<string, string> = {
  warn: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
};

// サイドバー本体（デスクトップ・モバイルドロワー共通の中身）
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {/* ロゴ */}
      <div className="flex items-center gap-2.5 border-b border-[var(--color-hairline)] px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
          A
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-neutral-900">AnswerOps AI</p>
          <p className="truncate text-xs text-neutral-500">{DEMO_PROJECT.name}</p>
        </div>
      </div>

      {/* メニュー */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/preview"
                    ? pathname === "/preview"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${
                      active
                        ? "bg-[var(--color-brand-soft)] font-medium text-[var(--color-brand)]"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          BADGE_TONE[item.badgeTone ?? "brand"]
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* フッター：接続状態 */}
      <div className="border-t border-[var(--color-hairline)] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <CircleDot className="h-3.5 w-3.5 text-[var(--color-warn)]" />
          <span>見本モード（未接続）</span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-500">
          サンプルデータを表示中。保存はされません。
        </p>
      </div>
    </>
  );
}

// デスクトップ用の固定サイドバー（md以上で表示）
export function DemoSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-hairline)] bg-white md:flex">
      <NavList />
    </aside>
  );
}
