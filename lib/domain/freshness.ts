import type { Freshness, FreshnessLevel } from "./schemas";

export const FRESHNESS_THRESHOLDS = {
  freshMaxSeconds: 90,
  delayedMaxSeconds: 180,
} as const;

export function computeFreshness(
  generatedAt: string | null,
  now: Date = new Date()
): Freshness {
  if (!generatedAt) {
    return { level: "no_data", generatedAt: null, ageSeconds: null };
  }
  const generatedMs = Date.parse(generatedAt);
  if (Number.isNaN(generatedMs)) {
    return { level: "no_data", generatedAt: null, ageSeconds: null };
  }
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - generatedMs) / 1000));
  let level: FreshnessLevel;
  if (ageSeconds < FRESHNESS_THRESHOLDS.freshMaxSeconds) {
    level = "fresh";
  } else if (ageSeconds < FRESHNESS_THRESHOLDS.delayedMaxSeconds) {
    level = "delayed";
  } else {
    level = "stale";
  }
  return { level, generatedAt, ageSeconds };
}
