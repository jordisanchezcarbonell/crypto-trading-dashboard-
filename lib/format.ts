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
