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

export function pnlToneClass(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-zinc-400";
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
  if (value == null) return "text-zinc-400";
  return pnlToneClass(value);
}
