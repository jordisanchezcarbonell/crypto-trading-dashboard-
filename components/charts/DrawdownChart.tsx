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
import { formatDate, formatPct } from "@/lib/format";

export function DrawdownChart({
  points,
  height = 200,
}: {
  points: EquityPoint[];
  height?: number;
}) {
  const data = points.map((p) => ({ ts: p.timestamp, dd: p.drawdownPct }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4} />
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
            tickFormatter={(v) => `${(v as number).toFixed(1)}%`}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => formatDate(v as string)}
            formatter={(value) => [formatPct(Number(value)), "Drawdown"]}
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke="#f43f5e"
            fill="url(#ddFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
