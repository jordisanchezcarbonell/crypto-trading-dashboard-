"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@/lib/domain/schemas";
import { formatDate, formatUsd } from "@/lib/format";

export function EquityCurveChart({
  points,
  height = 260,
}: {
  points: EquityPoint[];
  height?: number;
}) {
  const data = points.map((p) => ({
    ts: p.timestamp,
    equity: p.equityUsd,
  }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => formatDate(v as string).slice(5)}
            stroke="#52525b"
            fontSize={11}
            minTickGap={40}
          />
          <YAxis
            stroke="#52525b"
            fontSize={11}
            tickFormatter={(v) => formatUsd(Number(v), { compact: true })}
            width={64}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => formatDate(v as string)}
            formatter={(value) => [formatUsd(Number(value)), "Equity"]}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#22d3ee"
            fill="url(#equityFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
