import { z } from "zod";

export const ModeSchema = z.enum(["paper", "live", "read-only"]);
export type Mode = z.infer<typeof ModeSchema>;

export const SideSchema = z.enum(["long", "short"]);
export type Side = z.infer<typeof SideSchema>;

export const HealthStatusSchema = z.enum(["ok", "degraded", "down"]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const IsoDateTime = z.string().datetime({ offset: true });

export const PositionSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: SideSchema,
  qty: z.number(),
  entryPrice: z.number().nonnegative(),
  markPrice: z.number().nonnegative(),
  notionalUsd: z.number(),
  unrealizedPnlUsd: z.number(),
  unrealizedPnlPct: z.number(),
  openedAt: IsoDateTime,
  strategy: z.string(),
});
export type Position = z.infer<typeof PositionSchema>;

export const ClosedTradeSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  side: SideSchema,
  qty: z.number(),
  entryPrice: z.number().nonnegative(),
  exitPrice: z.number().nonnegative(),
  pnlUsd: z.number(),
  pnlPct: z.number(),
  feesUsd: z.number().nonnegative(),
  openedAt: IsoDateTime,
  closedAt: IsoDateTime,
  strategy: z.string(),
  reason: z.string(),
});
export type ClosedTrade = z.infer<typeof ClosedTradeSchema>;

export const DecisionActionSchema = z.enum([
  "open_long",
  "open_short",
  "close",
  "hold",
  "scale_in",
  "scale_out",
  "skip",
]);
export type DecisionAction = z.infer<typeof DecisionActionSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  timestamp: IsoDateTime,
  symbol: z.string(),
  action: DecisionActionSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  signals: z.array(
    z.object({
      name: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
    })
  ),
  executed: z.boolean(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const EquityPointSchema = z.object({
  timestamp: IsoDateTime,
  equityUsd: z.number().nonnegative(),
  drawdownPct: z.number().max(0),
});
export type EquityPoint = z.infer<typeof EquityPointSchema>;

export const PerformanceSummarySchema = z.object({
  startingCapitalUsd: z.number().nonnegative(),
  currentEquityUsd: z.number().nonnegative(),
  totalReturnPct: z.number(),
  cagrPct: z.number(),
  sharpe: z.number(),
  sortino: z.number(),
  maxDrawdownPct: z.number().max(0),
  winRatePct: z.number().min(0).max(100),
  profitFactor: z.number().nonnegative(),
  avgTradePct: z.number(),
  totalTrades: z.number().int().nonnegative(),
  bestTradePct: z.number(),
  worstTradePct: z.number(),
});
export type PerformanceSummary = z.infer<typeof PerformanceSummarySchema>;

export const HealthComponentSchema = z.object({
  name: z.string(),
  status: HealthStatusSchema,
  detail: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
});
export type HealthComponent = z.infer<typeof HealthComponentSchema>;

export const HealthSnapshotSchema = z.object({
  overall: HealthStatusSchema,
  lastSync: IsoDateTime,
  nextProcessing: IsoDateTime,
  components: z.array(HealthComponentSchema),
});
export type HealthSnapshot = z.infer<typeof HealthSnapshotSchema>;

export const ComparisonSeriesSchema = z.object({
  label: z.string(),
  color: z.string(),
  points: z.array(
    z.object({
      timestamp: IsoDateTime,
      valueIndexed: z.number(),
    })
  ),
});
export type ComparisonSeries = z.infer<typeof ComparisonSeriesSchema>;

export const RunSnapshotSchema = z.object({
  runId: z.string(),
  mode: ModeSchema,
  readOnly: z.boolean(),
  startedAt: IsoDateTime,
  health: HealthSnapshotSchema,
  positions: z.array(PositionSchema),
  trades: z.array(ClosedTradeSchema),
  decisions: z.array(DecisionSchema),
  equityCurve: z.array(EquityPointSchema),
  performance: PerformanceSummarySchema,
  comparisons: z.array(ComparisonSeriesSchema),
});
export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;
