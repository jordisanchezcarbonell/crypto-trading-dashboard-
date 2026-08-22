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
import { formatPct } from "@/lib/format";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
  timeAxis,
} from "./chart-theme";

export function DrawdownChart({
  points,
  height = 200,
}: {
  points: EquityPoint[];
  height?: number;
}) {
  const data = points.map((p) => ({ ts: p.timestamp, dd: p.drawdownPct }));
  const axis = timeAxis(points);

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={chartMargin}>
          <defs>
            <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.neg} stopOpacity={0} />
              <stop offset="100%" stopColor={CHART.neg} stopOpacity={0.32} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="ts"
            tickFormatter={axis.tickFormatter}
            minTickGap={40}
            {...axisProps}
          />
          <YAxis
            tickFormatter={(v) => `${(v as number).toFixed(1)}%`}
            width={52}
            {...axisProps}
          />
          <Tooltip
            cursor={{ stroke: CHART.neg, strokeOpacity: 0.35, strokeWidth: 1 }}
            content={
              <ChartTooltip
                labelFormatter={axis.labelFormatter}
                nameFormatter={() => "Drawdown"}
                valueFormatter={(value) => formatPct(value)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="dd"
            stroke={CHART.neg}
            fill="url(#ddFill)"
            strokeWidth={2}
            activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#06070a" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
