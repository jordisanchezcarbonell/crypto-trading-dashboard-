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
  // Nullable: some data sources cannot always supply a live entry/mark
  // price. `null` means "unknown"; a number is always the real value. The
  // UI must render null as "—" / "N/A", NEVER as 0.
  entryPrice: z.number().nonnegative().nullable(),
  markPrice: z.number().nonnegative().nullable(),
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
  // The FEATURE-BAR timestamp: which candle the features were computed
  // from. This is NOT when the decision became knowable, and it is NOT a
  // key (the id is `source_decision_id`). Keep the name/meaning stable —
  // the exporter's contract fills it from
  // SQLite `decisions.feature_bar_timestamp`.
  timestamp: IsoDateTime,
  // The instant the decision became causally knowable — the bar closed and
  // the signal could be acted on. With 4h bars a decision whose feature bar
  // is 08:00 does not exist until 12:00, so THIS is what a timeline must
  // order and display by. `null` for rows exported before migration 002;
  // renderers fall back to `timestamp` and must say the value is derived.
  signalAvailableAt: IsoDateTime.nullable(),
  symbol: z.string(),
  action: DecisionActionSchema,
  // Nullable: deterministic strategies (EMA-v1, EMA-v2-risk) have no
  // probabilistic confidence. `null` means "not applicable". Renderers
  // must display "—", NOT 0%.
  confidence: z.number().min(0).max(1).nullable(),
  // `rationale` is a human-readable summary. When the source is the
  // exporter, this string is DERIVED from the persisted decision fields
  // (ema50/ema200/target/…), NOT a rationale stored by the strategy and
  // NOT an ML explanation.
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
  // Rules of the road for this object:
  //
  //   `null` == "unknown / not enough data yet"
  //   `0`    == "computed and the answer is genuinely zero"
  //
  // Any field whose value depends on a return series or a trade sample is
  // nullable, because until we have enough bars/trades those metrics are
  // undefined and reporting 0 would be indistinguishable from a real 0
  // result. The UI must render `null` as "—" / "N/A", never as 0.
  startingCapitalUsd: z.number().nonnegative().nullable(),
  currentEquityUsd: z.number().nonnegative(),
  totalReturnPct: z.number().nullable(),
  cagrPct: z.number().nullable(),
  sharpe: z.number().nullable(),
  sortino: z.number().nullable(),
  maxDrawdownPct: z.number().max(0).nullable(),
  winRatePct: z.number().min(0).max(100).nullable(),
  profitFactor: z.number().nonnegative().nullable(),
  avgTradePct: z.number().nullable(),
  totalTrades: z.number().int().nonnegative(),
  bestTradePct: z.number().nullable(),
  worstTradePct: z.number().nullable(),
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
  /**
   * @deprecated since migration 002 — despite the name this never carried
   * the exporter's sync time. It is fed from the lab's `last_processed`,
   * i.e. the last feature bar the runner handled, so with 4h bars it reads
   * "3 hours ago" even when the exporter ran seconds earlier. Use
   * `lastProcessingAt` for that value and `freshness.generatedAt` for real
   * exporter freshness. Kept for one deploy so old rows still parse.
   */
  lastSync: IsoDateTime.nullable(),
  /** Last feature bar the runner actually processed. `null` == unknown. */
  lastProcessingAt: IsoDateTime.nullable(),
  /**
   * `lastProcessingAt + timeframe`, and nothing else. Deliberately NOT
   * rolled forward to the next future slot: a value in the past means the
   * runner missed a bar, and that is precisely what the dashboard exists to
   * surface. `null` == unknown (e.g. the lab reports DIVERGED sleeves) —
   * never a fabricated stand-in such as `now`.
   */
  nextProcessing: IsoDateTime.nullable(),
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

export const StrategyStatusSchema = z.object({
  name: z.string(),
  status: HealthStatusSchema,
  openPositions: z.number().int().nonnegative(),
  equityUsd: z.number().nonnegative(),
  // Nullable: computing today's PnL requires a baseline equity point from
  // the previous UTC midnight. Until the strategy has been alive long
  // enough for that bar to exist, both fields are `null` (unknown).
  dayPnlUsd: z.number().nullable(),
  dayPnlPct: z.number().nullable(),
  lastDecisionAt: IsoDateTime,
});
export type StrategyStatus = z.infer<typeof StrategyStatusSchema>;

export const FreshnessLevelSchema = z.enum([
  "fresh",
  "delayed",
  "stale",
  "no_data",
]);
export type FreshnessLevel = z.infer<typeof FreshnessLevelSchema>;

export const FreshnessSchema = z.object({
  level: FreshnessLevelSchema,
  generatedAt: IsoDateTime.nullable(),
  ageSeconds: z.number().nullable(),
});
export type Freshness = z.infer<typeof FreshnessSchema>;

export const RunSnapshotSchema = z.object({
  runId: z.string(),
  mode: ModeSchema,
  readOnly: z.boolean(),
  startedAt: IsoDateTime,
  health: HealthSnapshotSchema,
  freshness: FreshnessSchema,
  strategies: z.array(StrategyStatusSchema),
  positions: z.array(PositionSchema),
  trades: z.array(ClosedTradeSchema),
  decisions: z.array(DecisionSchema),
  equityCurve: z.array(EquityPointSchema),
  performance: PerformanceSummarySchema,
  comparisons: z.array(ComparisonSeriesSchema),
});
export type RunSnapshot = z.infer<typeof RunSnapshotSchema>;
