"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClosedTrade } from "@/lib/domain/schemas";
import { formatSignedUsd } from "@/lib/format";

export function PnLBarChart({
  trades,
  height = 240,
}: {
  trades: ClosedTrade[];
  height?: number;
}) {
  const data = [...trades]
    .sort(
      (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
    )
    .map((t, i) => ({
      idx: i + 1,
      pnl: t.pnlUsd,
      symbol: t.symbol,
    }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis dataKey="idx" stroke="#52525b" fontSize={11} />
          <YAxis
            stroke="#52525b"
            fontSize={11}
            tickFormatter={(v) => `$${v}`}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => `Trade #${v}`}
            formatter={(value, _n, payload) => [
              formatSignedUsd(Number(value)),
              (payload && payload.payload?.symbol) || "PnL",
            ]}
          />
          <Bar dataKey="pnl">
            {data.map((d) => (
              <Cell
                key={d.idx}
                fill={d.pnl >= 0 ? "#34d399" : "#f43f5e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
