import { describe, expect, it } from "vitest";
import {
  computeProcessingStatus,
  processingTone,
} from "@/lib/domain/processing";

/**
 * RUN-3 runs on 4h bars. The worked example these tests pin down:
 *
 *   last_processing_at = 12:00
 *   timeframe          = 4h
 *   next_processing    = 16:00
 *
 * At 15:32 that is "due in 28 min". At 16:10, with the runner having
 * published nothing new, it must read "10 min overdue" — NOT "next 20:00".
 */
const LAST = "2026-08-22T12:00:00.000Z";
const NEXT = "2026-08-22T16:00:00.000Z";

const health = { lastProcessingAt: LAST, nextProcessing: NEXT };

describe("computeProcessingStatus", () => {
  it("counts down to the deadline while it is still ahead", () => {
    const at1532 = new Date("2026-08-22T15:32:00.000Z");
    const status = computeProcessingStatus(health, at1532);
    expect(status.state).toBe("due");
    expect(status.deltaSeconds).toBe(28 * 60);
  });

  it("reports overdue once the deadline passes, and NEVER rolls forward", () => {
    const at1610 = new Date("2026-08-22T16:10:00.000Z");
    const status = computeProcessingStatus(health, at1610);

    expect(status.state).toBe("overdue");
    expect(status.deltaSeconds).toBe(10 * 60);

    // The heart of it: the deadline stays where it is. Advancing it by whole
    // timeframes to 20:00 would render a healthy-looking countdown and hide
    // the fact that the runner missed the 16:00 bar.
    expect(status.nextProcessing).toBe(NEXT);
    expect(status.nextProcessing).not.toBe("2026-08-22T20:00:00.000Z");
  });

  it("stays overdue no matter how many timeframes elapse", () => {
    // Three whole bars late. A roll-forward implementation would have
    // silently re-armed the countdown three times by now.
    const twoDaysLate = new Date("2026-08-24T04:00:00.000Z");
    const status = computeProcessingStatus(health, twoDaysLate);
    expect(status.state).toBe("overdue");
    expect(status.nextProcessing).toBe(NEXT);
    expect(status.deltaSeconds).toBe(36 * 60 * 60);
  });

  it("treats the exact deadline as due, not overdue", () => {
    const status = computeProcessingStatus(health, new Date(NEXT));
    expect(status.state).toBe("due");
    expect(status.deltaSeconds).toBe(0);
  });

  it("derives the timeframe instead of storing it", () => {
    const status = computeProcessingStatus(health, new Date(NEXT));
    expect(status.timeframeSeconds).toBe(4 * 60 * 60);
  });

  it("says unknown rather than inventing a deadline", () => {
    // The exporter could not determine a next bar (e.g. sleeves DIVERGED).
    // We must not reconstruct one from lastProcessingAt + a guessed
    // timeframe: a plausible countdown would mask the divergence.
    const status = computeProcessingStatus(
      { lastProcessingAt: LAST, nextProcessing: null },
      new Date("2026-08-22T16:10:00.000Z")
    );
    expect(status.state).toBe("unknown");
    expect(status.nextProcessing).toBeNull();
    expect(status.deltaSeconds).toBeNull();
    expect(status.timeframeSeconds).toBeNull();
    // The half we do know is still reported.
    expect(status.lastProcessingAt).toBe(LAST);
  });

  it("survives a missing lastProcessingAt without guessing a timeframe", () => {
    const status = computeProcessingStatus(
      { lastProcessingAt: null, nextProcessing: NEXT },
      new Date("2026-08-22T15:32:00.000Z")
    );
    expect(status.state).toBe("due");
    expect(status.timeframeSeconds).toBeNull();
  });

  it("treats unparseable timestamps as unknown, not as epoch 0", () => {
    const status = computeProcessingStatus(
      { lastProcessingAt: "not-a-date", nextProcessing: "not-a-date" },
      new Date(NEXT)
    );
    expect(status.state).toBe("unknown");
    expect(status.lastProcessingAt).toBeNull();
  });
});

describe("processingTone", () => {
  it("never renders an overdue runner as ok", () => {
    const overdue = computeProcessingStatus(
      health,
      new Date("2026-08-22T16:10:00.000Z")
    );
    expect(processingTone(overdue)).toBe("warning");
  });

  it("is muted when the cadence is unknown", () => {
    const unknown = computeProcessingStatus(
      { lastProcessingAt: null, nextProcessing: null },
      new Date(NEXT)
    );
    expect(processingTone(unknown)).toBe("muted");
  });
});
