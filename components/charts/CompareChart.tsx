"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ComparisonSeries } from "@/lib/domain/schemas";
import { formatDate } from "@/lib/format";

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
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
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
            tickFormatter={(v) => `${v}`}
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
            formatter={(value, name) => [
              `${Number(value).toFixed(2)}`,
              name as string,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
          {series.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
