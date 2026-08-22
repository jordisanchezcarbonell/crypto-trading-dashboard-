import { describe, expect, it } from "vitest";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";

describe("RUN-3 mock snapshot", () => {
  it("has the expected top-level shape", () => {
    expect(run3Snapshot.runId).toBe("RUN-3");
    expect(run3Snapshot.mode).toBe("paper");
    expect(run3Snapshot.readOnly).toBe(true);
  });

  it("has non-empty positions, trades, decisions", () => {
    expect(run3Snapshot.positions.length).toBeGreaterThan(0);
    expect(run3Snapshot.trades.length).toBeGreaterThan(0);
    expect(run3Snapshot.decisions.length).toBeGreaterThan(0);
  });

  it("has a monotonically-timestamped equity curve", () => {
    const times = run3Snapshot.equityCurve.map((p) =>
      new Date(p.timestamp).getTime()
    );
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
  });

  it("has consistent performance totals", () => {
    const perf = run3Snapshot.performance;
    expect(perf.totalTrades).toBe(run3Snapshot.trades.length);
    expect(perf.currentEquityUsd).toBe(
      run3Snapshot.equityCurve[run3Snapshot.equityCurve.length - 1].equityUsd
    );
  });

  it("has at least one comparison series with matching length", () => {
    expect(run3Snapshot.comparisons.length).toBeGreaterThan(0);
    for (const s of run3Snapshot.comparisons) {
      expect(s.points.length).toBe(run3Snapshot.equityCurve.length);
    }
  });
});
