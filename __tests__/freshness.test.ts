import { describe, expect, it } from "vitest";
import { computeFreshness } from "@/lib/domain/freshness";

const NOW = new Date("2026-08-22T12:30:00Z");

describe("computeFreshness", () => {
  it("returns FRESH when < 90 seconds old", () => {
    const gen = new Date(NOW.getTime() - 45_000).toISOString();
    const f = computeFreshness(gen, NOW);
    expect(f.level).toBe("fresh");
    expect(f.ageSeconds).toBe(45);
  });

  it("returns DELAYED between 90s and 3min", () => {
    const gen = new Date(NOW.getTime() - 150_000).toISOString();
    const f = computeFreshness(gen, NOW);
    expect(f.level).toBe("delayed");
    expect(f.ageSeconds).toBe(150);
  });

  it("returns STALE at 3min or older", () => {
    const gen = new Date(NOW.getTime() - 200_000).toISOString();
    expect(computeFreshness(gen, NOW).level).toBe("stale");
  });

  it("uses the boundary at exactly 90s (delayed)", () => {
    const gen = new Date(NOW.getTime() - 90_000).toISOString();
    expect(computeFreshness(gen, NOW).level).toBe("delayed");
  });

  it("uses the boundary at exactly 180s (stale)", () => {
    const gen = new Date(NOW.getTime() - 180_000).toISOString();
    expect(computeFreshness(gen, NOW).level).toBe("stale");
  });

  it("returns NO_DATA when generatedAt is null", () => {
    const f = computeFreshness(null, NOW);
    expect(f.level).toBe("no_data");
    expect(f.generatedAt).toBeNull();
    expect(f.ageSeconds).toBeNull();
  });

  it("returns NO_DATA for an unparseable date", () => {
    const f = computeFreshness("not-a-date", NOW);
    expect(f.level).toBe("no_data");
  });

  it("never returns a negative ageSeconds for future timestamps", () => {
    const gen = new Date(NOW.getTime() + 5_000).toISOString();
    const f = computeFreshness(gen, NOW);
    expect(f.ageSeconds).toBe(0);
    expect(f.level).toBe("fresh");
  });
});
