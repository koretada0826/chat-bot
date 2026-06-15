"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Code2,
  FileBarChart,
  RefreshCw,
  CircleDot,
} from "lucide-react";
import { DEMO_PROJECT, PERIODS } from "@/lib/preview/demo-data";
import { MobileNav } from "./mobile-nav";

export function DemoHeader() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("7日");

  return (
    <div className="sticky top-0 z-10">
      {/* メインヘッダー */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-hairline)] bg-white px-4 py-2.5 md:px-5">
        {/* 左：ハンバーガー（スマホ）＋プロジェクト名と状態 */}
        <div className="flex items-center gap-3">
          <MobileNav />
          <h1 className="text-sm font-semibold text-neutral-900">{DEMO_PROJECT.name}</h1>
          <span className="hidden items-center gap-1 rounded-full bg-[var(--color-warn-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-warn)] sm:inline-flex">
            <CircleDot className="h-3 w-3" />
            {DEMO_PROJECT.status}
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-[var(--color-hairline)] px-2 py-0.5 text-xs text-neutral-600 sm:inline-flex">
            <CircleDot className="h-3 w-3 text-[var(--color-warn)]" />
            {DEMO_PROJECT.botState}
          </span>
          <span className="hidden items-center gap-1 text-xs text-neutral-500 lg:inline-flex">
            <RefreshCw className="h-3 w-3" />
            最終同期 {DEMO_PROJECT.lastSync}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* 期間フィルター */}
          <div className="hidden rounded-lg border border-[var(--color-hairline)] p-0.5 sm:flex">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  period === p
                    ? "bg-[var(--color-brand)] text-white"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* アクション */}
          <Link
            href="/preview/chat"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            デモチャットを開く
          </Link>
          <Link
            href="/preview/embed"
            className="hidden items-center gap-1.5 rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 sm:inline-flex"
          >
            <Code2 className="h-3.5 w-3.5" />
            埋め込みコード
          </Link>
          <Link
            href="/preview/guide"
            className="hidden items-center gap-1.5 rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 lg:inline-flex"
          >
            <FileBarChart className="h-3.5 w-3.5" />
            使い方ガイド
          </Link>
        </div>
      </header>

      {/* 見本モードの注意バー */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-700 md:px-5">
        見本モード：サンプルデータを表示しています。クリックや入力は試せますが、保存はされません。
      </div>
    </div>
  );
}
