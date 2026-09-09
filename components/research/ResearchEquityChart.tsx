"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
  timeAxis,
} from "@/components/charts/chart-theme";
import { formatPct } from "@/lib/format";
import type { ResearchEquityPoint } from "@/lib/research/schema";

export type EquityView = "equity" | "drawdown";

/**
 * The research equity surface.
 *
 * Equity is drawn indexed to 100, never in currency: two candidates funded
 * with different capital (10,000 per isolated sleeve vs 90,000 shared) are
 * not comparable in dollars, and a dollar axis would invite exactly that
 * comparison. The 100 reference line is the break-even the eye needs.
 */
export function ResearchEquityChart({
  points,
  view,
  height = 300,
}: {
  points: ResearchEquityPoint[];
  view: EquityView;
  height?: number;
}) {
  const axis = timeAxis(points);

  if (view === "drawdown") {
    const data = points.map((p) => ({ ts: p.timestamp, dd: p.drawdownPct }));
    return (
      <ChartFrame height={height}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={chartMargin}>
            <defs>
              <linearGradient id="researchDdFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.neg} stopOpacity={0} />
                <stop offset="100%" stopColor={CHART.neg} stopOpacity={0.3} />
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
              tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
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
              fill="url(#researchDdFill)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    );
  }

  const data = points.map((p) => ({
    ts: p.timestamp,
    indexed: p.normalizedEquity,
  }));

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="ts"
            tickFormatter={axis.tickFormatter}
            minTickGap={40}
            {...axisProps}
          />
          <YAxis
            tickFormatter={(v) => `${v}`}
            width={56}
            domain={["auto", "auto"]}
            {...axisProps}
          />
          <ReferenceLine
            y={100}
            stroke={CHART.axis}
            strokeOpacity={0.4}
            strokeDasharray="4 4"
          />
          <Tooltip
            cursor={{ stroke: CHART.axis, strokeOpacity: 0.4, strokeWidth: 1 }}
            content={
              <ChartTooltip
                labelFormatter={axis.labelFormatter}
                nameFormatter={() => "Indexed equity"}
                valueFormatter={(value) => value.toFixed(2)}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="indexed"
            stroke={CHART.accent}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
