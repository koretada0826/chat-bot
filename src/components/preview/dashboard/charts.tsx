"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TREND_14D,
  STATUS_BREAKDOWN,
  CATEGORY_COUNTS,
  HOURLY_USAGE,
} from "@/lib/preview/demo-data";

const axis = { fontSize: 11, fill: "#9ca3af" };
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #eceef1",
  boxShadow: "0 4px 12px -4px rgba(0,0,0,0.1)",
};

// 質問数の推移（14日：質問数=エリア / AI回答・未解決=線）
export function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={TREND_14D} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
        <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="q" name="質問数" stroke="var(--color-brand)" strokeWidth={2} fill="url(#gq)" />
        <Line type="monotone" dataKey="ai" name="AI回答" stroke="var(--color-ai)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="un" name="未解決" stroke="var(--color-warn)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// 回答ステータス内訳（ドーナツ）
export function StatusDonut() {
  const total = STATUS_BREAKDOWN.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={180}>
        <PieChart>
          <Pie
            data={STATUS_BREAKDOWN}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            stroke="none"
          >
            {STATUS_BREAKDOWN.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-1.5">
        {STATUS_BREAKDOWN.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="flex-1 text-neutral-600">{s.name}</span>
            <span className="font-medium text-neutral-900">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// カテゴリ別質問数（横棒）
export function CategoryBar() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={CATEGORY_COUNTS} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" horizontal={false} />
        <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={axis} tickLine={false} axisLine={false} width={52} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f8fa" }} />
        <Bar dataKey="value" name="質問数" fill="var(--color-brand)" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 時間帯別利用（縦棒）
export function HourlyBar() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={HOURLY_USAGE} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
        <XAxis dataKey="h" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={32} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f7f8fa" }} />
        <Bar dataKey="v" name="利用数" fill="var(--color-ai)" radius={[4, 4, 0, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
