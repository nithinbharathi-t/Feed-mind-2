"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  responses: number;
}

interface ResponseChartProps {
  data: DataPoint[];
}

const PERIODS = [
  { label: "30d", days: 30 },
  { label: "7d", days: 7 },
  { label: "90d", days: 90 },
];

export function ResponseChart({ data }: ResponseChartProps) {
  const [period, setPeriod] = useState("30d");
  const days = PERIODS.find((p) => p.label === period)?.days ?? 30;
  const sliced = data.slice(-days);

  // Show every Nth label to avoid crowding
  const step = days <= 7 ? 1 : days <= 30 ? 5 : 10;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-[0.95rem] tracking-tight">Responses Over Time</h3>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPeriod(p.label)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                period === p.label
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-transparent text-muted-foreground border border-border hover:border-border/80 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {sliced.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
          No response data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={sliced} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              stroke="#4A5260"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={step - 1}
            />
            <YAxis
              stroke="#4A5260"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
              cursor={{ stroke: "rgba(108,99,255,0.3)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="responses"
              stroke="#6C63FF"
              strokeWidth={2}
              fill="url(#responseGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#6C63FF", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
