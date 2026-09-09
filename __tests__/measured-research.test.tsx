import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

describe("measured research comparison", () => {
  it("exports real comparable results and rejects a mismatched window", async () => {
    expect(existsSync(resolve("lib/research/measured.ts")), "measured comparison loader missing").toBe(true);
    const { loadMeasuredComparison, validateComparison } = await import("@/lib/research/measured");
    const data = loadMeasuredComparison("SOL/USDT");
    expect(data.strategies.map(s => s.id)).toEqual(expect.arrayContaining([
      "ema-v1", "ema-v2-risk", "public-average-4h-v1", "public-bband-rsi-4h-v1",
    ]));
    for (const strategy of data.strategies) {
      expect(strategy.result.curve.length).toBeGreaterThan(100);
      expect(strategy.result.curve[0][1]).toBe(100);
      expect(strategy.result.causalityPassed).toBe(true);
      expect(strategy.reproducible).toBe(true);
      expect(strategy.resultHash).toMatch(/^[a-f0-9]{64}$/);
    }
    const bad = structuredClone(data);
    bad.strategies[1].result.startAt = "2024-01-01T00:00:00Z";
    expect(() => validateComparison(bad)).toThrow(/window/);
    expect(data.correlations[0][0]).toBeCloseTo(1);
    expect(data.strategies.find(s => s.id === "public-bband-rsi-4h-v1")?.source?.originalTimeframe).toBe("1h");
  });
});
