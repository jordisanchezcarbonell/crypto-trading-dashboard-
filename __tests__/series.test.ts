import { describe, expect, it } from "vitest";
import {
  describeSeries,
  isIntradaySeries,
  seriesSpanMs,
} from "@/lib/domain/series";

const at = (iso: string) => ({ timestamp: iso });

describe("seriesSpanMs", () => {
  it("is zero for series too short to span anything", () => {
    expect(seriesSpanMs([])).toBe(0);
    expect(seriesSpanMs([at("2026-08-22T12:00:00.000Z")])).toBe(0);
  });

  it("measures the extremes, not the ends, so unsorted input still works", () => {
    const unsorted = [
      at("2026-08-22T12:00:00.000Z"),
      at("2026-08-22T04:00:00.000Z"),
      at("2026-08-22T08:00:00.000Z"),
    ];
    expect(seriesSpanMs(unsorted)).toBe(8 * 60 * 60 * 1000);
  });
});

describe("isIntradaySeries", () => {
  it("is true for the case that broke the axis: several points, one day", () => {
    // This is RUN-3 as observed: five snapshots inside one afternoon, which
    // a date-only tick collapsed into four ticks reading "08-22".
    const sameDay = [
      at("2026-08-21T22:00:00.000Z"),
      at("2026-08-22T02:00:00.000Z"),
      at("2026-08-22T06:00:00.000Z"),
      at("2026-08-22T10:00:00.000Z"),
      at("2026-08-22T14:00:00.000Z"),
    ];
    expect(isIntradaySeries(sameDay)).toBe(true);
  });

  it("is false once the series spans more than two days", () => {
    const week = [
      at("2026-08-15T00:00:00.000Z"),
      at("2026-08-22T00:00:00.000Z"),
    ];
    expect(isIntradaySeries(week)).toBe(false);
  });
});

describe("describeSeries", () => {
  it("reports count and span, never a cadence", () => {
    const sameDay = [
      at("2026-08-22T00:00:00.000Z"),
      at("2026-08-22T18:00:00.000Z"),
    ];
    // The old copy called these "2 days of equity" purely because the array
    // had two entries.
    expect(describeSeries(sameDay)).toBe("2 points over 18 h");
    expect(describeSeries(sameDay)).not.toMatch(/daily/);
  });

  it("does not claim a cadence for sparse long-range series either", () => {
    const sparse = [
      at("2026-07-23T00:00:00.000Z"),
      at("2026-08-22T00:00:00.000Z"),
    ];
    // Two points thirty days apart are not "2 daily points".
    expect(describeSeries(sparse)).toBe("2 points over 30 d");
  });

  it("handles the degenerate cases without inventing a span", () => {
    expect(describeSeries([])).toBe("No points");
    expect(describeSeries([at("2026-08-22T00:00:00.000Z")])).toBe("1 point");
  });
});
