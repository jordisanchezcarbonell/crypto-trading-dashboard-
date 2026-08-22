import { z } from "zod";
import {
  ClosedTradeSchema,
  ComparisonSeriesSchema,
  DecisionSchema,
  EquityPointSchema,
  HealthSnapshotSchema,
  PerformanceSummarySchema,
  PositionSchema,
  StrategyStatusSchema,
  type ClosedTrade,
  type ComparisonSeries,
  type Decision,
  type EquityPoint,
  type HealthSnapshot,
  type PerformanceSummary,
  type Position,
  type StrategyStatus,
} from "@/lib/domain/schemas";

/**
 * Row-level Zod schemas describing exactly what Supabase returns (snake_case,
 * jsonb payloads, nullable-where-relevant). Domain types stay camelCase.
 */
export const RunRowSchema = z.object({
  id: z.string(),
  mode: z.enum(["paper", "live", "read-only"]),
  read_only: z.boolean(),
  started_at: z.string(),
  stopped_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type RunRow = z.infer<typeof RunRowSchema>;

export const StrategySnapshotRowSchema = z.object({
  run_id: z.string(),
  strategy: z.string(),
  ts: z.string(),
  status: z.enum(["ok", "degraded", "down"]),
  open_positions: z.number().int().nonnegative(),
  equity_usd: z.number().nonnegative(),
  // Nullable — see lib/domain/schemas.ts. Cannot compute day PnL without
  // a UTC-midnight baseline bar.
  day_pnl_usd: z.number().nullable(),
  day_pnl_pct: z.number().nullable(),
  last_decision_at: z.string(),
});
export type StrategySnapshotRow = z.infer<typeof StrategySnapshotRowSchema>;

export const PositionSnapshotRowSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  strategy: z.string(),
  asset: z.string(),
  ts: z.string(),
  side: z.enum(["long", "short"]),
  qty: z.number(),
  // See lib/domain/schemas.ts — `null` means unknown, NOT zero.
  entry_price: z.number().nonnegative().nullable(),
  mark_price: z.number().nonnegative().nullable(),
  notional_usd: z.number(),
  unrealized_pnl_usd: z.number(),
  unrealized_pnl_pct: z.number(),
  opened_at: z.string(),
});
export type PositionSnapshotRow = z.infer<typeof PositionSnapshotRowSchema>;

export const TradeRowSchema = z.object({
  source_trade_id: z.string(),
  run_id: z.string(),
  strategy: z.string(),
  asset: z.string(),
  side: z.enum(["long", "short"]),
  qty: z.number(),
  entry_price: z.number().nonnegative(),
  exit_price: z.number().nonnegative(),
  pnl_usd: z.number(),
  pnl_pct: z.number(),
  fees_usd: z.number().nonnegative(),
  opened_at: z.string(),
  closed_at: z.string(),
  reason: z.string(),
});
export type TradeRow = z.infer<typeof TradeRowSchema>;

export const DecisionRowSchema = z.object({
  source_decision_id: z.string(),
  run_id: z.string(),
  strategy: z.string().nullable().optional(),
  // Feature-bar timestamp — which candle produced the features. Never a key
  // (PK is `source_decision_id`; the exporter watermark scans `id`).
  ts: z.string(),
  // Added by migration 002. `.optional()` as well as `.nullable()` so a
  // dashboard deploy that lands before the migration keeps parsing rows.
  signal_available_at: z.string().nullable().optional(),
  asset: z.string(),
  action: z.enum([
    "open_long",
    "open_short",
    "close",
    "hold",
    "scale_in",
    "scale_out",
    "skip",
  ]),
  // Nullable — deterministic strategies have no probabilistic confidence.
  confidence: z.number().min(0).max(1).nullable(),
  rationale: z.string(),
  signals: z.array(
    z.object({
      name: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
    })
  ),
  executed: z.boolean(),
});
export type DecisionRow = z.infer<typeof DecisionRowSchema>;

export const EquityHistoryRowSchema = z.object({
  run_id: z.string(),
  strategy: z.string(),
  ts: z.string(),
  equity_usd: z.number().nonnegative(),
  drawdown_pct: z.number().max(0),
});
export type EquityHistoryRow = z.infer<typeof EquityHistoryRowSchema>;

export const SystemSnapshotRowSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  generated_at: z.string(),
  overall: z.enum(["ok", "degraded", "down"]),
  /** @deprecated migration 002 — see lib/domain/schemas.ts. */
  last_sync: z.string().nullable().optional(),
  last_processing_at: z.string().nullable().optional(),
  // NULL-able since 002: the exporter must be able to say "unknown" rather
  // than substitute `now`, which reads as "due right now".
  next_processing: z.string().nullable().optional(),
  components: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["ok", "degraded", "down"]),
      detail: z.string().nullable().optional(),
      latency_ms: z.number().nonnegative().nullable().optional(),
    })
  ),
  performance: z.unknown().nullable().optional(),
  comparisons: z.unknown().nullable().optional(),
});
export type SystemSnapshotRow = z.infer<typeof SystemSnapshotRowSchema>;

// -----------------------------------------------------------------------------
// Row → domain mappers
// -----------------------------------------------------------------------------

export function mapStrategyStatus(row: StrategySnapshotRow): StrategyStatus {
  return StrategyStatusSchema.parse({
    name: row.strategy,
    status: row.status,
    openPositions: row.open_positions,
    equityUsd: row.equity_usd,
    dayPnlUsd: row.day_pnl_usd,
    dayPnlPct: row.day_pnl_pct,
    lastDecisionAt: row.last_decision_at,
  });
}

export function mapPosition(row: PositionSnapshotRow): Position {
  return PositionSchema.parse({
    id: row.id,
    symbol: row.asset,
    side: row.side,
    qty: row.qty,
    entryPrice: row.entry_price,
    markPrice: row.mark_price,
    notionalUsd: row.notional_usd,
    unrealizedPnlUsd: row.unrealized_pnl_usd,
    unrealizedPnlPct: row.unrealized_pnl_pct,
    openedAt: row.opened_at,
    strategy: row.strategy,
  });
}

export function mapTrade(row: TradeRow): ClosedTrade {
  return ClosedTradeSchema.parse({
    id: row.source_trade_id,
    symbol: row.asset,
    side: row.side,
    qty: row.qty,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    pnlUsd: row.pnl_usd,
    pnlPct: row.pnl_pct,
    feesUsd: row.fees_usd,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    strategy: row.strategy,
    reason: row.reason,
  });
}

export function mapDecision(row: DecisionRow): Decision {
  return DecisionSchema.parse({
    id: row.source_decision_id,
    timestamp: row.ts,
    signalAvailableAt: row.signal_available_at ?? null,
    symbol: row.asset,
    action: row.action,
    confidence: row.confidence,
    rationale: row.rationale,
    signals: row.signals,
    executed: row.executed,
  });
}

export function mapEquityPoint(row: EquityHistoryRow): EquityPoint {
  return EquityPointSchema.parse({
    timestamp: row.ts,
    equityUsd: row.equity_usd,
    drawdownPct: row.drawdown_pct,
  });
}

export function mapHealth(row: SystemSnapshotRow): HealthSnapshot {
  return HealthSnapshotSchema.parse({
    overall: row.overall,
    lastSync: row.last_sync ?? null,
    // Prefer the honestly-named column; fall back to the legacy one, which
    // held exactly this value under a misleading name. No fabrication: if
    // neither is present the answer is `null` == unknown.
    lastProcessingAt: row.last_processing_at ?? row.last_sync ?? null,
    nextProcessing: row.next_processing ?? null,
    components: row.components.map((c) => ({
      name: c.name,
      status: c.status,
      detail: c.detail ?? undefined,
      latencyMs: c.latency_ms ?? undefined,
    })),
  });
}

export function mapPerformance(row: SystemSnapshotRow): PerformanceSummary {
  return PerformanceSummarySchema.parse(row.performance ?? {});
}

export function mapComparisons(row: SystemSnapshotRow): ComparisonSeries[] {
  const raw = row.comparisons;
  if (!Array.isArray(raw)) return [];
  return z.array(ComparisonSeriesSchema).parse(raw);
}
