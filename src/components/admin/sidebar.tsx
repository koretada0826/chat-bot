"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/faqs", label: "FAQ" },
  { href: "/admin/templates", label: "業界テンプレート" },
  { href: "/admin/categories", label: "カテゴリ" },
  { href: "/admin/tags", label: "タグ" },
  { href: "/admin/dictionary", label: "辞書" },
  { href: "/admin/documents", label: "ドキュメント" },
  { href: "/admin/logs", label: "質問ログ" },
  { href: "/admin/unresolved", label: "未解決" },
  { href: "/admin/low-rated", label: "低評価" },
  { href: "/admin/suggestions", label: "改善候補" },
  { href: "/admin/usage", label: "使用量・コスト" },
  { href: "/admin/settings", label: "チャットボット設定" },
  { href: "/admin/embed", label: "埋め込み" },
  { href: "/admin/demo", label: "デモチャット" },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-4">
        <p className="text-sm font-semibold text-neutral-900">AnswerOps AI</p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">{orgName}</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post" className="border-t border-neutral-200 p-2">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100"
        >
          ログアウト
        </button>
      </form>
    </aside>
  );
}
