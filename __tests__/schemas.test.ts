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
});
