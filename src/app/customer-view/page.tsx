"use client";

import { useState } from "react";
import Link from "next/link";
import { MockChat } from "@/components/preview/mock-chat";
import {
  MessageCircle,
  ArrowLeft,
  Search,
  ShoppingCart,
  Heart,
  Menu,
} from "lucide-react";

// お客様のサイトに貼られたチャットが「どう見えるか」を再現する単体プレビュー。
// 管理画面（メニュー・ダッシュボード）は一切表示されない＝本番のお客様の見え方。
export default function CustomerView() {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative min-h-screen bg-neutral-100">
      {/* 見本であることの注記バー（本番のお客様には出ません） */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        <span>
          これは「お客様にこう見える」プレビューです。お客様の画面に
          <strong className="font-semibold">管理画面のメニューは表示されません</strong>
          。右下のチャットだけが表示されます。
        </span>
        <Link
          href="/preview"
          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2.5 py-1 font-medium text-amber-800 hover:bg-amber-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          管理画面（見本）に戻る
        </Link>
      </div>

      {/* ↓ ここからは「お客様の会社のサイト」の例（ダミー） */}
      <FakeStore />

      {/* 右下に浮かぶチャット（本番ではサイトに貼った小窓）。
          開いている時はパネルだけ／閉じている時は丸ボタンだけ＝重ならない。 */}
      <div className="fixed bottom-5 right-5 z-50">
        {open ? (
          <div className="w-[min(92vw,22rem)]">
            <MockChat onClose={() => setOpen(false)} />
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:opacity-90"
            style={{ background: "#2b6cb0" }}
            aria-label="チャットを開く"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}

// お客様の会社のサイト（ダミーのオンラインショップ）
function FakeStore() {
  const products = [
    { name: "ベーシックTシャツ", price: "¥2,900" },
    { name: "キャンバストート", price: "¥3,600" },
    { name: "ステンレスボトル", price: "¥2,200" },
    { name: "オーガニックコーヒー", price: "¥1,480" },
    { name: "レザー名刺入れ", price: "¥4,800" },
    { name: "アロマキャンドル", price: "¥1,980" },
  ];

  return (
    <div className="pointer-events-none select-none">
      {/* ヘッダー */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
          <Menu className="h-5 w-5 text-neutral-400 md:hidden" />
          <span className="text-lg font-bold tracking-tight text-neutral-800">SAMPLE STORE</span>
          <nav className="ml-4 hidden gap-5 text-sm text-neutral-500 md:flex">
            <span>新着</span>
            <span>レディース</span>
            <span>メンズ</span>
            <span>雑貨</span>
            <span>セール</span>
          </nav>
          <div className="ml-auto flex items-center gap-4 text-neutral-400">
            <Search className="h-5 w-5" />
            <Heart className="h-5 w-5" />
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* ヒーローバナー */}
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="flex h-44 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-100 to-indigo-100">
          <div className="text-center">
            <p className="text-xl font-bold text-neutral-700">Summer Collection</p>
            <p className="mt-1 text-sm text-neutral-500">夏の新作が入荷しました</p>
          </div>
        </div>
      </div>

      {/* 商品グリッド */}
      <div className="mx-auto max-w-5xl px-5 pb-24">
        <p className="mb-4 text-sm font-semibold text-neutral-700">おすすめ商品</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p) => (
            <div key={p.name} className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="aspect-square rounded-lg bg-neutral-100" />
              <p className="mt-2 text-sm text-neutral-700">{p.name}</p>
              <p className="text-sm font-semibold text-neutral-900">{p.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
