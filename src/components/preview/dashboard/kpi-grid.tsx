import { TrendingUp, TrendingDown } from "lucide-react";
import { KPIS, type Kpi } from "@/lib/preview/demo-data";
import { Sparkline } from "./sparkline";

const TONE_COLOR: Record<Kpi["tone"], string> = {
  brand: "var(--color-brand)",
  ai: "var(--color-ai)",
  success: "var(--color-success)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  neutral: "#111827",
};

function KpiCard({ kpi }: { kpi: Kpi }) {
  const color = TONE_COLOR[kpi.tone];
  const deltaColor = kpi.good ? "var(--color-success)" : "var(--color-danger)";
  const DeltaIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-xl border border-[var(--color-hairline)] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">{kpi.label}</p>
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-medium"
          style={{ color: deltaColor }}
        >
          <DeltaIcon className="h-3 w-3" />
          {kpi.delta}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight" style={{ color }}>
        {kpi.value}
      </p>
      <div className="mt-1 -mb-1">
        <Sparkline data={kpi.spark} color={color} />
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">{kpi.note}</p>
    </div>
  );
}

export function KpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {KPIS.map((k) => (
        <KpiCard key={k.key} kpi={k} />
      ))}
    </div>
  );
}
