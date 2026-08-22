import { formatDuration } from "@/lib/format";

/**
 * What a time series actually spans — and how to say so.
 *
 * The dashboard used to assume one equity point per day: the axis formatted
 * every tick as `MM-dd` and the copy read "N days of equity". Neither is a
 * property of the data. The Supabase replica writes a row per snapshot, so a
 * run that has been observed five times in one afternoon produced an axis
 * labelled `08-22, 08-22, 08-22, 08-22` — four ticks, one legible value —
 * under a heading claiming five days of history.
 *
 * These helpers derive the answer from the timestamps instead of assuming it.
 */

/** Below this span, ticks need a clock; above it, they need a date. */
export const INTRADAY_SPAN_MS = 48 * 60 * 60 * 1000;

export interface TimePoint {
  timestamp: string;
}

/**
 * Wall-clock distance between the first and last point, in milliseconds.
 *
 * Computed from the extremes rather than from `points[0]`/`points.at(-1)` so
 * an unsorted series still reports its true extent. Fewer than two points
 * span nothing.
 */
export function seriesSpanMs(points: TimePoint[]): number {
  if (points.length < 2) return 0;

  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    const t = new Date(p.timestamp).getTime();
    if (!Number.isFinite(t)) continue;
    if (t < min) min = t;
    if (t > max) max = t;
  }

  return Number.isFinite(min) && Number.isFinite(max) ? max - min : 0;
}

/**
 * True when the series is tight enough that a date-only tick would collapse
 * distinct points onto the same label.
 *
 * A single point is intraday by this definition: it has no span to date, so a
 * clock is the more informative of the two labels.
 */
export function isIntradaySeries(points: TimePoint[]): boolean {
  return seriesSpanMs(points) < INTRADAY_SPAN_MS;
}

/**
 * The series, described in the terms it earns: "5 points over 18 h".
 *
 * Count and span, never a cadence. "12 daily points" would be a claim about
 * sampling frequency that the timestamps do not support — twelve points over
 * thirty days are not daily — and it is exactly the claim that made the old
 * copy wrong. Span is observable; cadence is not.
 */
export function describeSeries(points: TimePoint[], noun = "point"): string {
  const plural = points.length === 1 ? noun : `${noun}s`;
  if (points.length === 0) return `No ${noun}s`;

  const span = seriesSpanMs(points);
  if (span === 0) return `${points.length} ${plural}`;

  return `${points.length} ${plural} over ${formatDuration(span / 1000)}`;
}
