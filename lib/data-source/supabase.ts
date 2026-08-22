import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
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
import { computeFreshness } from "@/lib/domain/freshness";
import type { DashboardProviderContract, RunStatus } from "./types";
import {
  DecisionRowSchema,
  EquityHistoryRowSchema,
  PositionSnapshotRowSchema,
  RunRowSchema,
  StrategySnapshotRowSchema,
  SystemSnapshotRowSchema,
  TradeRowSchema,
  mapComparisons,
  mapDecision,
  mapEquityPoint,
  mapHealth,
  mapPerformance,
  mapPosition,
  mapStrategyStatus,
  mapTrade,
  type SystemSnapshotRow,
} from "./supabase-mappers";

const DEFAULT_TRADE_LIMIT = 200;
const DEFAULT_DECISION_LIMIT = 200;

/**
 * Reads a RUN snapshot from Supabase.
 *
 * All queries scope by run_id and take the *latest* row per grouping so we
 * do not scan the whole history for a page render. Position/strategy latest
 * snapshots use a `distinct on (...) ... order by ts desc` view (see
 * `supabase/schema.sql`); if that view is missing we fall back to grouping
 * client-side, which is fine for RUN-3-scale volumes.
 */
export class SupabaseDashboardProvider implements DashboardProviderContract {
  readonly source = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  async getRunStatus(runId: string): Promise<RunStatus> {
    const { data, error } = await this.client
      .from("runs")
      .select("id, mode, read_only, started_at")
      .eq("id", runId)
      .single();
    if (error) throw wrap(error, `runs where id=${runId}`);
    const row = RunRowSchema.parse(data);
    return {
      runId: row.id,
      mode: row.mode,
      readOnly: row.read_only,
      startedAt: row.started_at,
    };
  }

  async getStrategyStatuses(runId: string): Promise<StrategyStatus[]> {
    const { data, error } = await this.client
      .from("latest_strategy_snapshots")
      .select("*")
      .eq("run_id", runId);
    if (error) throw wrap(error, "latest_strategy_snapshots");
    return (data ?? [])
      .map((row) => StrategySnapshotRowSchema.parse(row))
      .map(mapStrategyStatus);
  }

  async getPositions(runId: string): Promise<Position[]> {
    const { data, error } = await this.client
      .from("latest_position_snapshots")
      .select("*")
      .eq("run_id", runId);
    if (error) throw wrap(error, "latest_position_snapshots");
    return (data ?? [])
      .map((row) => PositionSnapshotRowSchema.parse(row))
      .map(mapPosition);
  }

  async getTrades(
    runId: string,
    limit: number = DEFAULT_TRADE_LIMIT
  ): Promise<ClosedTrade[]> {
    const { data, error } = await this.client
      .from("trades")
      .select("*")
      .eq("run_id", runId)
      .order("closed_at", { ascending: false })
      .limit(limit);
    if (error) throw wrap(error, "trades");
    return (data ?? []).map((row) => TradeRowSchema.parse(row)).map(mapTrade);
  }

  async getDecisions(
    runId: string,
    limit: number = DEFAULT_DECISION_LIMIT
  ): Promise<Decision[]> {
    const { data, error } = await this.client
      .from("decisions")
      .select("*")
      .eq("run_id", runId)
      .order("ts", { ascending: false })
      .limit(limit);
    if (error) throw wrap(error, "decisions");
    return (data ?? [])
      .map((row) => DecisionRowSchema.parse(row))
      .map(mapDecision);
  }

  async getEquityHistory(runId: string): Promise<EquityPoint[]> {
    const { data, error } = await this.client
      .from("equity_history")
      .select("run_id, strategy, ts, equity_usd, drawdown_pct")
      .eq("run_id", runId)
      .eq("strategy", "AGGREGATE")
      .order("ts", { ascending: true });
    if (error) throw wrap(error, "equity_history");
    return (data ?? [])
      .map((row) => EquityHistoryRowSchema.parse(row))
      .map(mapEquityPoint);
  }

  async getPerformance(runId: string): Promise<PerformanceSummary> {
    const row = await this.latestSystemSnapshot(runId);
    return mapPerformance(row);
  }

  async getSystemSnapshot(runId: string): Promise<HealthSnapshot> {
    const row = await this.latestSystemSnapshot(runId);
    return mapHealth(row);
  }

  async getComparisons(runId: string): Promise<ComparisonSeries[]> {
    const row = await this.latestSystemSnapshot(runId);
    return mapComparisons(row);
  }

  async getFreshness(runId: string): Promise<Freshness> {
    const { data, error } = await this.client
      .from("system_snapshots")
      .select("generated_at")
      .eq("run_id", runId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw wrap(error, "system_snapshots.generated_at");
    return computeFreshness(data?.generated_at ?? null);
  }

  async getRunSnapshot(runId: string): Promise<RunSnapshot> {
    // Parallelise everything the composite view needs.
    const [
      runStatus,
      systemRow,
      strategies,
      positions,
      trades,
      decisions,
      equityCurve,
    ] = await Promise.all([
      this.getRunStatus(runId),
      this.latestSystemSnapshotOrNull(runId),
      this.getStrategyStatuses(runId),
      this.getPositions(runId),
      this.getTrades(runId),
      this.getDecisions(runId),
      this.getEquityHistory(runId),
    ]);

    const health = systemRow
      ? mapHealth(systemRow)
      : emptyHealth();
    const performance = systemRow ? mapPerformance(systemRow) : emptyPerformance();
    const comparisons = systemRow ? mapComparisons(systemRow) : [];
    const freshness = computeFreshness(systemRow?.generated_at ?? null);

    return {
      runId: runStatus.runId,
      mode: runStatus.mode,
      readOnly: runStatus.readOnly,
      startedAt: runStatus.startedAt,
      health,
      freshness,
      strategies,
      positions,
      trades,
      decisions,
      equityCurve,
      performance,
      comparisons,
    };
  }

  private async latestSystemSnapshot(runId: string): Promise<SystemSnapshotRow> {
    const row = await this.latestSystemSnapshotOrNull(runId);
    if (!row) {
      throw new Error(
        `No system_snapshots row for run "${runId}" — has the exporter published anything yet?`
      );
    }
    return row;
  }

  private async latestSystemSnapshotOrNull(
    runId: string
  ): Promise<SystemSnapshotRow | null> {
    const { data, error } = await this.client
      .from("system_snapshots")
      .select("*")
      .eq("run_id", runId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw wrap(error, "system_snapshots");
    if (!data) return null;
    return SystemSnapshotRowSchema.parse(data);
  }
}

function wrap(err: { message?: string; code?: string }, context: string): Error {
  return new Error(
    `Supabase read failed (${context}): ${err.message ?? "unknown error"}${err.code ? ` [${err.code}]` : ""}`
  );
}

function emptyHealth(): HealthSnapshot {
  const iso = new Date(0).toISOString();
  return {
    overall: "down",
    lastSync: iso,
    nextProcessing: iso,
    components: [],
  };
}

function emptyPerformance(): PerformanceSummary {
  // Every derived metric is `null` (== unknown) because we have no
  // system_snapshots row yet. `totalTrades` and `currentEquityUsd` are the
  // only fields whose true baseline value is 0 when there is nothing to
  // report; every other metric would be undefined without a return series
  // or a trade sample, so we refuse to fabricate zeros.
  return {
    startingCapitalUsd: null,
    currentEquityUsd: 0,
    totalReturnPct: null,
    cagrPct: null,
    sharpe: null,
    sortino: null,
    maxDrawdownPct: null,
    winRatePct: null,
    profitFactor: null,
    avgTradePct: null,
    totalTrades: 0,
    bestTradePct: null,
    worstTradePct: null,
  };
}
