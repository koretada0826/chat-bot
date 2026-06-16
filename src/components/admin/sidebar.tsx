"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  CircleAlert,
  ThumbsDown,
  FileQuestion,
  LayoutTemplate,
  FolderTree,
  Tags,
  BookA,
  FileText,
  Sparkles,
  BarChart3,
  Settings2,
  Code2,
  Bot,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface Group {
  title: string;
  items: Item[];
}

// 実際の /admin ルートをグループ分け（ルートは変更しない）
const NAV: Group[] = [
  {
    title: "ホーム",
    items: [{ href: "/admin", label: "ダッシュボード", icon: LayoutDashboard }],
  },
  {
    title: "会話分析",
    items: [
      { href: "/admin/logs", label: "質問ログ", icon: MessagesSquare },
      { href: "/admin/unresolved", label: "未解決", icon: CircleAlert },
      { href: "/admin/low-rated", label: "低評価", icon: ThumbsDown },
    ],
  },
  {
    title: "ナレッジ管理",
    items: [
      { href: "/admin/faqs", label: "FAQ", icon: FileQuestion },
      { href: "/admin/templates", label: "業界テンプレート", icon: LayoutTemplate },
      { href: "/admin/categories", label: "カテゴリ", icon: FolderTree },
      { href: "/admin/tags", label: "タグ", icon: Tags },
      { href: "/admin/dictionary", label: "辞書", icon: BookA },
      { href: "/admin/documents", label: "ドキュメント", icon: FileText },
    ],
  },
  {
    title: "AI改善",
    items: [{ href: "/admin/suggestions", label: "改善候補", icon: Sparkles }],
  },
  {
    title: "チャットボット",
    items: [
      { href: "/admin/demo", label: "デモチャット", icon: Bot },
      { href: "/admin/settings", label: "チャットボット設定", icon: Settings2 },
      { href: "/admin/embed", label: "埋め込み", icon: Code2 },
    ],
  },
  {
    title: "運用",
    items: [{ href: "/admin/usage", label: "使用量・コスト", icon: BarChart3 }],
  },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-hairline)] bg-white">
      {/* ロゴ */}
      <div className="flex items-center gap-2.5 border-b border-[var(--color-hairline)] px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand)] text-sm font-bold text-white">
          A
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-neutral-900">AnswerOps AI</p>
          <p className="truncate text-xs text-neutral-500">{orgName}</p>
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
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${
                      active
                        ? "bg-[var(--color-brand-soft)] font-medium text-[var(--color-brand)]"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* フッター：接続状態（本番は実DBに接続済み） */}
      <div className="border-t border-[var(--color-hairline)] px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <CircleDot className="h-3.5 w-3.5 text-[var(--color-success)]" />
          <span>接続済み</span>
        </div>
        <form action="/auth/signout" method="post" className="mt-2">
          <button
            type="submit"
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
