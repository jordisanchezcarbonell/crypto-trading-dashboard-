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
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
} from "./chart-theme";

export function EquityCurveChart({
  points,
  height = 260,
}: {
  points: EquityPoint[];
  height?: number;
}) {
  const data = points.map((p) => ({ ts: p.timestamp, equity: p.equityUsd }));

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={chartMargin}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => formatDate(v as string).slice(5)}
            minTickGap={40}
            {...axisProps}
          />
          <YAxis
            tickFormatter={(v) => formatUsd(Number(v), { compact: true })}
            width={62}
            domain={["auto", "auto"]}
            {...axisProps}
          />
          <Tooltip
            cursor={{ stroke: CHART.accent, strokeOpacity: 0.35, strokeWidth: 1 }}
            content={
              <ChartTooltip
                labelFormatter={(v) => formatDate(String(v))}
                nameFormatter={() => "Equity"}
                valueFormatter={(value) => formatUsd(value)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={CHART.accent}
            fill="url(#equityFill)"
            strokeWidth={2}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#06070a" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
