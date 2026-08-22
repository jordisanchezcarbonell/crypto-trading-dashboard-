"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ClosedTrade } from "@/lib/domain/schemas";
import { formatSignedUsd, formatUsd } from "@/lib/format";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
} from "./chart-theme";

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
    .map((t, i) => ({ idx: i + 1, pnl: t.pnlUsd, symbol: t.symbol }));

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="idx" {...axisProps} />
          <YAxis
            tickFormatter={(v) => formatUsd(Number(v), { compact: true })}
            width={56}
            {...axisProps}
          />
          {/* Zero line anchors the eye between winners and losers. */}
          <ReferenceLine y={0} stroke={CHART.axis} strokeOpacity={0.5} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={
              <ChartTooltip
                labelFormatter={(v) => `Trade #${v}`}
                nameFormatter={(entry) =>
                  (entry.payload?.symbol as string) ?? "PnL"
                }
                valueFormatter={(value) => formatSignedUsd(value)}
              />
            }
          />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={26}>
            {data.map((d) => (
              <Cell key={d.idx} fill={d.pnl >= 0 ? CHART.pos : CHART.neg} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
