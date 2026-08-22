import { describe, expect, it } from "vitest";
import {
  PositionSchema,
  RunSnapshotSchema,
  DecisionSchema,
} from "@/lib/domain/schemas";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";

describe("domain schemas", () => {
  it("accepts the RUN-3 mock snapshot", () => {
    const result = RunSnapshotSchema.safeParse(run3Snapshot);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid side", () => {
    const bad = { ...run3Snapshot.positions[0], side: "sideways" };
    const result = PositionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const bad = { ...run3Snapshot.decisions[0], confidence: 1.5 };
    const result = DecisionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("accepts null confidence for deterministic strategies", () => {
    const nullable = { ...run3Snapshot.decisions[0], confidence: null };
    const result = DecisionSchema.safeParse(nullable);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBeNull();
    }
  });

  it("accepts null mark_price / entry_price on positions", () => {
    const nullable = {
      ...run3Snapshot.positions[0],
      entryPrice: null,
      markPrice: null,
    };
    const result = PositionSchema.safeParse(nullable);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.markPrice).toBeNull();
      expect(result.data.entryPrice).toBeNull();
    }
  });

  it("accepts null performance metrics (sharpe/sortino/cagr/…)", () => {
    const perfNullable = {
      ...run3Snapshot,
      performance: {
        ...run3Snapshot.performance,
        cagrPct: null,
        sharpe: null,
        sortino: null,
        profitFactor: null,
        winRatePct: null,
        maxDrawdownPct: null,
        avgTradePct: null,
        bestTradePct: null,
        worstTradePct: null,
        totalReturnPct: null,
        startingCapitalUsd: null,
      },
    };
    const result = RunSnapshotSchema.safeParse(perfNullable);
    expect(result.success).toBe(true);
  });
});
