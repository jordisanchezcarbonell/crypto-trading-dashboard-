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

export type DashboardSourceName = "mock" | "supabase";

/**
 * Read-only, server-side interface every dashboard data source must implement.
 *
 * These methods are the ONLY way the UI reaches the data layer. React
 * components never talk to Supabase directly — they consume the `RunSnapshot`
 * assembled by `getRunSnapshot()` via a Client Context Provider.
 */
export interface DashboardProviderContract {
  readonly source: DashboardSourceName;

  getRunStatus(runId: string): Promise<RunStatus>;
  getStrategyStatuses(runId: string): Promise<StrategyStatus[]>;
  getPositions(runId: string): Promise<Position[]>;
  getTrades(runId: string, limit?: number): Promise<ClosedTrade[]>;
  getDecisions(runId: string, limit?: number): Promise<Decision[]>;
  getEquityHistory(runId: string): Promise<EquityPoint[]>;
  getPerformance(runId: string): Promise<PerformanceSummary>;
  getSystemSnapshot(runId: string): Promise<HealthSnapshot>;
  getComparisons(runId: string): Promise<ComparisonSeries[]>;
  getFreshness(runId: string): Promise<Freshness>;

  /** Composite: everything a page needs in one round-trip. */
  getRunSnapshot(runId: string): Promise<RunSnapshot>;
}

export interface RunStatus {
  runId: string;
  mode: "paper" | "live" | "read-only";
  readOnly: boolean;
  startedAt: string;
}

export class DashboardConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardConfigurationError";
  }
}
