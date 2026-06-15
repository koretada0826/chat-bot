// 業務SaaS向けの最小UIプリミティブ（カード・バッジ・状態バッジ・見出し）

import type { LucideIcon } from "lucide-react";

// 各ページ共通のページ見出し（タイトル＋説明＋右側アクション）
export function PageHeader({
  title,
  desc,
  icon: Icon,
  action,
}: {
  title: string;
  desc?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-[var(--color-brand)]" />}
          <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        </div>
        {desc && <p className="mt-1 text-xs leading-relaxed text-neutral-500">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--color-hairline)] bg-white ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-neutral-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

const TONE: Record<string, string> = {
  brand: "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
  ai: "bg-[var(--color-ai-soft)] text-[var(--color-ai)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  warn: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral: "bg-neutral-100 text-neutral-600",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

// 「良好/改善余地/要改善」などの状態
export function StateBadge({ state }: { state: string }) {
  const tone: keyof typeof TONE =
    state === "良好"
      ? "success"
      : state === "要改善"
        ? "danger"
        : state === "改善余地"
          ? "warn"
          : "neutral";
  return <Badge tone={tone}>{state}</Badge>;
}
