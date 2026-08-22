"use client";

import type { ReactNode } from "react";
import { isIntradaySeries, type TimePoint } from "@/lib/domain/series";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

/**
 * Chart styling shared by every recharts surface. Values mirror the CSS tokens
 * in `app/globals.css` — recharts needs literal colours, not custom properties.
 */
export const CHART = {
  grid: "#1c202a",
  axis: "#7d8698",
  accent: "#22d3ee",
  pos: "#34d399",
  neg: "#fb7185",
  info: "#60a5fa",
} as const;

export const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
  stroke: CHART.axis,
} as const;

export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: "2 6",
  vertical: false,
} as const;

export const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 } as const;

/**
 * Tick and tooltip formatters for a time axis, chosen from the series itself.
 *
 * Every chart here used to hardcode `formatDate(v).slice(5)` — a bare `MM-dd`.
 * That is only readable when the points really are one per day. Five snapshots
 * taken the same afternoon rendered as `08-22, 08-22, 08-22, 08-22`: four
 * ticks that name the same day and distinguish nothing. Ask the data which
 * unit it varies in, then label in that unit.
 */
export function timeAxis(points: TimePoint[]) {
  const intraday = isIntradaySeries(points);

  return {
    /** Axis ticks: short, because they repeat across the width of the chart. */
    tickFormatter: (value: unknown) =>
      intraday ? formatTime(String(value)) : formatDate(String(value)).slice(5),
    /** Tooltip heading: one at a time, so it can afford to be unambiguous. */
    labelFormatter: (value: string | number) =>
      intraday ? formatDateTime(String(value)) : formatDate(String(value)),
  };
}

type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

/**
 * Tooltip that matches the card surfaces instead of recharts' default box.
 * Recharts clones this element with `active` / `payload` / `label`.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  nameFormatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  labelFormatter?: (label: string | number) => ReactNode;
  valueFormatter: (value: number, entry: TooltipEntry) => ReactNode;
  nameFormatter?: (entry: TooltipEntry) => ReactNode;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-lg border border-edge bg-overlay/95 px-3 py-2 shadow-lift backdrop-blur-sm">
      {label !== undefined && (
        <div className="eyebrow mb-1.5">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={`${entry.name}-${i}`} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color ?? CHART.accent }}
            />
            <span className="text-muted">
              {nameFormatter ? nameFormatter(entry) : entry.name}
            </span>
            <span className="num ml-auto font-medium text-ink">
              {valueFormatter(Number(entry.value), entry)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartFrame({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  return (
    <div style={{ width: "100%", height }} className="[&_.recharts-surface]:overflow-visible">
      {children}
    </div>
  );
}
