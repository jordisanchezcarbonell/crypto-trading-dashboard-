import type { HealthSnapshot } from "./schemas";

/**
 * Processing cadence, stated honestly.
 *
 * The one rule this module exists to enforce:
 *
 *     next_processing = last_processing_at + timeframe
 *
 * and NEVER anything else. In particular we do not advance a stale
 * `nextProcessing` by whole timeframes until it lands in the future. That
 * "roll-forward" would always render a comfortable countdown, which is
 * precisely wrong: a `nextProcessing` in the past is the signal that the
 * runner failed to process a bar it should have. Rolling it forward hides
 * the operational failure the dashboard exists to surface.
 *
 * So: 15:32 with next 16:00 -> `due` in 28 min. 16:10 with next STILL 16:00
 * -> `overdue` by 10 min. Not "next 20:00".
 */
export type ProcessingState = "due" | "overdue" | "unknown";

export interface ProcessingStatus {
  state: ProcessingState;
  lastProcessingAt: string | null;
  nextProcessing: string | null;
  /**
   * Seconds until the next run (`due`) or seconds elapsed since it was owed
   * (`overdue`). Always non-negative - the direction lives in `state`.
   * `null` when unknown.
   */
  deltaSeconds: number | null;
  /**
   * `nextProcessing - lastProcessingAt`. Derived, never stored: a
   * `timeframe_seconds` column would be a third source of truth for a value
   * these two already imply, and the first one to drift.
   */
  timeframeSeconds: number | null;
}

function parse(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export function computeProcessingStatus(
  health: Pick<HealthSnapshot, "lastProcessingAt" | "nextProcessing">,
  now: Date = new Date()
): ProcessingStatus {
  const lastMs = parse(health.lastProcessingAt);
  const nextMs = parse(health.nextProcessing);
  const lastProcessingAt =
    lastMs === null ? null : health.lastProcessingAt ?? null;

  // Unknown stays unknown. We refuse to reconstruct a missing
  // `nextProcessing` from `lastProcessingAt` + a guessed timeframe: an
  // invented cadence is exactly the kind of plausible-looking value that
  // masks a runner which never reported one.
  if (nextMs === null) {
    return {
      state: "unknown",
      lastProcessingAt,
      nextProcessing: null,
      deltaSeconds: null,
      timeframeSeconds: null,
    };
  }

  const deltaMs = nextMs - now.getTime();
  return {
    state: deltaMs >= 0 ? "due" : "overdue",
    lastProcessingAt,
    nextProcessing: health.nextProcessing ?? null,
    deltaSeconds: Math.floor(Math.abs(deltaMs) / 1000),
    timeframeSeconds:
      lastMs === null
        ? null
        : Math.max(0, Math.floor((nextMs - lastMs) / 1000)),
  };
}

/**
 * Health tone for the cadence, so an overdue runner is visible without
 * reading the timestamp. Overdue is a warning, not an error: a late bar may
 * still land. It must never render as "ok".
 */
export function processingTone(
  status: ProcessingStatus
): "success" | "warning" | "muted" {
  if (status.state === "overdue") return "warning";
  if (status.state === "due") return "success";
  return "muted";
}
