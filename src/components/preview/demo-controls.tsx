"use client";

import { useState } from "react";

// 見本用のトグルスイッチ（見た目だけ切り替わる。保存はしない）。
// role="switch" + aria-checked でキーボード操作・読み上げに対応。
export function DemoToggle({ defaultOn = false, label }: { defaultOn?: boolean; label?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
        on ? "justify-end bg-[var(--color-brand)]" : "justify-start bg-neutral-300"
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

// 見本用のスライダー（数値が表示と連動する。保存はしない）。
export function DemoSlider({
  defaultValue = 75,
  labelledBy,
}: {
  defaultValue?: number;
  labelledBy?: string;
}) {
  const [v, setV] = useState(defaultValue);
  const shown = (v / 100).toFixed(2);
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
        aria-labelledby={labelledBy}
        aria-valuetext={`類似度 ${shown}`}
        className="flex-1 accent-[var(--color-brand)]"
      />
      <span className="w-12 text-right text-sm font-medium text-neutral-800">{shown}</span>
    </div>
  );
}
