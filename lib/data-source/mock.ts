import "server-only";

import type {
  ClosedTrade,
  ComparisonSeries,
  Decision,
  EquityPoint,
  Freshness,
  HealthSnapshot,
  PerformanceSummary,
  Position,
  RunSnapshot,
  StrategyStatus,
} from "@/lib/domain/schemas";
import { buildRun3Snapshot } from "@/lib/mock/run3-fixtures";
import type { DashboardProviderContract, RunStatus } from "./types";

/**
 * In-memory data source backed by the RUN-3 fixture.
 * Rebuilds live-ish timestamps on every read so freshness stays realistic.
 */
export class MockDashboardProvider implements DashboardProviderContract {
  readonly source = "mock" as const;

  private snapshot(runId: string): RunSnapshot {
    // Only the demo run is served from the in-memory fixture. Real "RUN-3"
    // data must come from Supabase — the mock will never fake it.
    if (runId !== "RUN-3-DEMO") {
      throw new Error(
        `MockDashboardProvider only serves RUN-3-DEMO, got "${runId}". Point DASHBOARD_DATA_SOURCE at "supabase" for real run data.`
      );
    }
    return buildRun3Snapshot();
  }

  async getRunSnapshot(runId: string): Promise<RunSnapshot> {
    return this.snapshot(runId);
  }

  async getRunStatus(runId: string): Promise<RunStatus> {
    const s = this.snapshot(runId);
    return {
      runId: s.runId,
      mode: s.mode,
      readOnly: s.readOnly,
      startedAt: s.startedAt,
    };
  }

  async getStrategyStatuses(runId: string): Promise<StrategyStatus[]> {
    return this.snapshot(runId).strategies;
  }

  async getPositions(runId: string): Promise<Position[]> {
    return this.snapshot(runId).positions;
  }

  async getTrades(runId: string, limit?: number): Promise<ClosedTrade[]> {
    const trades = this.snapshot(runId).trades;
    return typeof limit === "number" ? trades.slice(0, limit) : trades;
  }

  async getDecisions(runId: string, limit?: number): Promise<Decision[]> {
    const decisions = this.snapshot(runId).decisions;
    return typeof limit === "number" ? decisions.slice(0, limit) : decisions;
  }

  async getEquityHistory(runId: string): Promise<EquityPoint[]> {
    return this.snapshot(runId).equityCurve;
  }

  async getPerformance(runId: string): Promise<PerformanceSummary> {
    return this.snapshot(runId).performance;
  }

  async getSystemSnapshot(runId: string): Promise<HealthSnapshot> {
    return this.snapshot(runId).health;
  }

  async getComparisons(runId: string): Promise<ComparisonSeries[]> {
    return this.snapshot(runId).comparisons;
  }

  async getFreshness(runId: string): Promise<Freshness> {
    return this.snapshot(runId).freshness;
  }
}
