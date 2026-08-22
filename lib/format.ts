import { formatDistanceToNowStrict, format } from "date-fns";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  return (opts?.compact ? usdCompact : usd).format(value);
}

export function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${formatUsd(value)}`;
}

export function formatPct(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPct(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatQty(value: number, digits = 4): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd HH:mm");
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);
  const suffix = target.getTime() > now.getTime() ? "from now" : "ago";
  return `${formatDistanceToNowStrict(target)} ${suffix}`;
}

/**
 * A duration in seconds as a short, human-readable span ("28 min",
 * "2 h 10 min"). Used for the processing cadence, where the direction
 * (due vs overdue) is carried by a label rather than a sign, so this
 * function always renders a magnitude.
 */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds} s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) {
    return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
  }

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days} d` : `${days} d ${restHours} h`;
}

export function pnlToneClass(value: number): string {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted";
}

// -----------------------------------------------------------------------------
// Optional formatters — render `null`/`undefined` as an em dash instead of 0.
//
// Convention across this repo:
//   `null` == "unknown / not enough data"
//   a number == "computed" (0 included, means the answer is truly zero)
//
// The unavailable glyph is Unicode em dash (U+2014). Never coerce to 0.
// -----------------------------------------------------------------------------

export const UNAVAILABLE = "—";

export function formatOptionalUsd(
  value: number | null | undefined,
  opts?: { compact?: boolean }
): string {
  return value == null ? UNAVAILABLE : formatUsd(value, opts);
}

export function formatOptionalPct(
  value: number | null | undefined,
  digits = 2
): string {
  return value == null ? UNAVAILABLE : formatPct(value, digits);
}

export function formatOptionalSignedPct(
  value: number | null | undefined,
  digits = 2
): string {
  return value == null ? UNAVAILABLE : formatSignedPct(value, digits);
}

export function formatOptionalNumber(
  value: number | null | undefined,
  digits = 2
): string {
  return value == null ? UNAVAILABLE : value.toFixed(digits);
}

/** For UI tone helpers: treat null as neutral, not positive or negative. */
export function pnlToneClassOptional(value: number | null | undefined): string {
  if (value == null) return "text-muted";
  return pnlToneClass(value);
}

/** Clock time only — for axes and labels whose date is already established. */
export function formatTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

/**
 * A signal value as a human reads it.
 *
 * Signals arrive straight from the exporter as IEEE doubles, so an EMA lands
 * in the payload as 65669.30417490489. Printing that verbatim spends fourteen
 * characters asserting a precision the strategy never had, and makes a row of
 * chips unscannable. Precision scales with magnitude: a price needs cents, a
 * sub-dollar quantity needs more places to say anything at all.
 *
 * Non-numeric signals ("long", "n/a") pass through untouched.
 */
export function formatSignalValue(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return String(value);

  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
