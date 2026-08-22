"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComparisonSeries } from "@/lib/domain/schemas";
import { formatDate } from "@/lib/format";
import {
  CHART,
  ChartFrame,
  ChartTooltip,
  axisProps,
  chartMargin,
  gridProps,
} from "./chart-theme";

export function CompareChart({
  series,
  height = 320,
}: {
  series: ComparisonSeries[];
  height?: number;
}) {
  const timestamps = series[0]?.points.map((p) => p.timestamp) ?? [];
  const data = timestamps.map((ts, i) => {
    const row: Record<string, number | string> = { ts };
    for (const s of series) {
      row[s.label] = s.points[i]?.valueIndexed ?? 0;
    }
    return row;
  });

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="ts"
            tickFormatter={(v) => formatDate(v as string).slice(5)}
            minTickGap={40}
            {...axisProps}
          />
          <YAxis
            tickFormatter={(v) => `${v}`}
            width={48}
            domain={["auto", "auto"]}
            {...axisProps}
          />
          {/* Everything is indexed to 100: mark the break-even baseline. */}
          <ReferenceLine y={100} stroke={CHART.axis} strokeOpacity={0.4} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: CHART.axis, strokeOpacity: 0.4, strokeWidth: 1 }}
            content={
              <ChartTooltip
                labelFormatter={(v) => formatDate(String(v))}
                valueFormatter={(value) => value.toFixed(2)}
              />
            }
          />
          <Legend
            iconType="plainline"
            iconSize={14}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => (
              <span className="text-muted">{String(value)}</span>
            )}
          />
          {series.map((s, i) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              // The first series is the run under study; baselines sit behind it.
              strokeWidth={i === 0 ? 2.25 : 1.5}
              strokeOpacity={i === 0 ? 1 : 0.75}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 2, stroke: "#06070a" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
