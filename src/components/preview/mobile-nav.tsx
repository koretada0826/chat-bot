"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavList } from "./demo-sidebar";

// スマホ幅（md未満）でのナビ。ハンバーガー→スライドドロワー。
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-hairline)] text-neutral-600 hover:bg-neutral-50"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* 背景 */}
          <button
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          {/* ドロワー */}
          <div className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="メニューを閉じる"
              className="absolute right-2 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
