import { z } from "zod";

/**
 * The research contract.
 *
 * This mirrors — deliberately, field by field — the result schema the research
 * platform is being built around in `crypto-trading-lab` (`ResearchExperiment`,
 * `ResearchMetrics`, `ResearchEquityPoint`). The frontend never learns how a
 * strategy works: it reads this contract and nothing else, so a new candidate
 * is a new JSON file, not a new component.
 *
 * Two rules run through every schema here:
 *
 *   1. `null` means "this data layer has no value for it". It NEVER means
 *      zero, and the UI must render it as "Unavailable" / "—". A research
 *      dashboard that quietly shows 0.00 for an unmeasured Sharpe is worse
 *      than one that shows nothing, because it invites a decision on a number
 *      nobody computed.
 *
 *      `null` covers two different situations and cannot tell them apart on
 *      its own: nothing was measured, or something was measured and has not
 *      been exported here. The accompanying `*UnavailableReason` string and
 *      the state tag are what carry that distinction, which is why both are
 *      required rather than decorative.
 *
 *   2. Every number carries its source. `MetricSource` is not decoration:
 *      the metrics currently shown for `ema-v2-risk` come from the phase-1.8
 *      operational report over the 7 scoring assets, NOT from a research
 *      engine run of experiment `exp-f3303d447106dd13`. Anything that hides
 *      that distinction would make the page lie about what it is showing.
 */

/** ISO-8601 instant, offset required — same convention as the RUN-3 schemas. */
export const IsoInstant = z.string().datetime({ offset: true });

/** A number that may not have been measured. Never coerced to 0. */
const Measure = z.number().nullable();

/**
 * The research state vocabulary.
 *
 * Every tag must be defensible from an artefact in the lab repository. A tag
 * is an assertion about a candidate's standing, so `RESULTS_PENDING` exists
 * precisely so we never have to reach for a stronger word than the evidence
 * supports.
 *
 * `RESULTS_PENDING` and `RESULTS_NOT_EXPORTED` are deliberately separate, and
 * the difference is not pedantry. "Nobody has measured this" is a statement
 * about the research; "nobody has exported this" is a statement about the
 * pipeline between the lab and this dashboard. Collapsing them would let an
 * empty panel report a finding that does not exist — a candidate whose
 * baseline, stress and stability runs were done and reviewed would be
 * displayed as if it had never been touched.
 */
export const ResearchStateSchema = z.enum([
  "FROZEN_CANDIDATE",
  "TRUE_OOS_PENDING",
  "KEEP_FOR_RESEARCH",
  "PARAMETER_REGION_STABLE",
  "PARAMETER_SENSITIVE",
  "FRICTION_SENSITIVE",
  "RESULTS_PENDING",
  "RESULTS_NOT_EXPORTED",
  "REJECTED",
]);
export type ResearchState = z.infer<typeof ResearchStateSchema>;

/**
 * A state tag together with what makes it true.
 *
 * The evidence line is required. A status pill with no traceable origin is an
 * opinion rendered as a fact, and this page exists to keep those apart.
 */
export const ResearchStateTagSchema = z.object({
  state: ResearchStateSchema,
  evidence: z.string().min(1),
});
export type ResearchStateTag = z.infer<typeof ResearchStateTagSchema>;

/** Where a block of numbers came from, and how far it can be trusted. */
export const MetricSourceSchema = z.object({
  /** Human label shown under the metric row. */
  label: z.string(),
  /** Repository-relative artefact the numbers were read from. */
  ref: z.string(),
  /** What the numbers cover (universe, weighting, window). */
  scope: z.string(),
  /**
   * Fields NOT published by the source and reconstructed here by arithmetic
   * on published values. Listed by metric key so the UI can mark them.
   */
  derivedFields: z.array(z.string()).default([]),
  /** Free-form caveat rendered verbatim. */
  caveat: z.string().nullable().default(null),
});
export type MetricSource = z.infer<typeof MetricSourceSchema>;

export const ResearchMetricsSchema = z.object({
  totalReturnPct: Measure,
  cagrPct: Measure,
  /** Negative by convention: -23.24 is a 23.24% peak-to-trough loss. */
  maxDrawdownPct: Measure,
  sharpe: Measure,
  sortino: Measure,
  calmar: Measure,
  profitFactor: Measure,
  winRatePct: Measure,
  trades: Measure,
  turnover: Measure,
  exposurePct: Measure,
  feesPaid: Measure,
  slippagePaid: Measure,
  finalEquity: Measure,
  source: MetricSourceSchema,
});
export type ResearchMetrics = z.infer<typeof ResearchMetricsSchema>;

export const ResearchEquityPointSchema = z.object({
  timestamp: IsoInstant,
  equity: z.number(),
  /** Indexed to 100 at the first bar of the research window. */
  normalizedEquity: z.number(),
  drawdownPct: z.number(),
});
export type ResearchEquityPoint = z.infer<typeof ResearchEquityPointSchema>;

/**
 * One temporal block of a robustness split (B1 / B2 / B3).
 *
 * Boundaries are nullable for the same reason the metrics are: a block whose
 * window has not been fixed yet must not be drawn as if it had.
 */
export const TemporalBlockSchema = z.object({
  id: z.string(),
  label: z.string(),
  startAt: IsoInstant.nullable(),
  endAt: IsoInstant.nullable(),
  returnPct: Measure,
  sharpe: Measure,
  maxDrawdownPct: Measure,
});
export type TemporalBlock = z.infer<typeof TemporalBlockSchema>;

/** One point of the execution-cost stress ladder (1.0x / 1.5x / 2.0x). */
export const FrictionScenarioSchema = z.object({
  /** Multiplier applied to fee, spread and slippage together. */
  scale: z.number().positive(),
  label: z.string(),
  returnPct: Measure,
  cagrPct: Measure,
  sharpe: Measure,
  maxDrawdownPct: Measure,
  profitFactor: Measure,
});
export type FrictionScenario = z.infer<typeof FrictionScenarioSchema>;

export const ParameterMetricKeySchema = z.enum([
  "sharpe",
  "cagrPct",
  "profitFactor",
]);
export type ParameterMetricKey = z.infer<typeof ParameterMetricKeySchema>;

export const CostScaleKeySchema = z.enum(["x1", "x2"]);
export type CostScaleKey = z.infer<typeof CostScaleKeySchema>;

/**
 * One cell of the parameter grid.
 *
 * `isBaseline` marks the preregistered configuration — the ONLY cell the UI is
 * allowed to single out. Highlighting the best-scoring cell would turn a
 * stability read into a parameter search, which is exactly the failure mode
 * this panel exists to expose.
 */
export const ParameterCellSchema = z.object({
  rowValue: z.number(),
  colValue: z.number(),
  isBaseline: z.boolean().default(false),
  values: z.record(
    CostScaleKeySchema,
    z.record(ParameterMetricKeySchema, Measure)
  ),
});
export type ParameterCell = z.infer<typeof ParameterCellSchema>;

export const ParameterGridSchema = z.object({
  rowLabel: z.string(),
  colLabel: z.string(),
  rowValues: z.array(z.number()).min(1),
  colValues: z.array(z.number()).min(1),
  cells: z.array(ParameterCellSchema),
  source: MetricSourceSchema,
});
export type ParameterGrid = z.infer<typeof ParameterGridSchema>;

/**
 * Everything needed to reproduce the experiment, exactly as the lab records
 * it. Hashes are strings we transport, never strings we compute: a hash the
 * frontend invents is a reproducibility claim nobody can check.
 */
export const ResearchProvenanceSchema = z.object({
  strategyName: z.string(),
  version: z.string(),
  strategyCodeHash: z.string().nullable(),
  experimentId: z.string().nullable(),
  protocol: z.string().nullable(),
  protocolHash: z.string().nullable(),
  protocolSemanticHash: z.string().nullable(),
  datasetId: z.string().nullable(),
  datasetManifestSha256: z.string().nullable(),
  sourceCommit: z.string().nullable(),
  specPath: z.string().nullable(),
  windowStartPolicy: z.string().nullable(),
  windowStart: IsoInstant.nullable(),
  windowEnd: IsoInstant.nullable(),
  segment: z.string().nullable(),
});
export type ResearchProvenance = z.infer<typeof ResearchProvenanceSchema>;

export const ResearchStrategyResultSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Short human sentence: what the strategy does, in one line. */
  summary: z.string(),
  parameters: z.array(
    z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })
  ),
  states: z.array(ResearchStateTagSchema).min(1),
  metrics: ResearchMetricsSchema.nullable(),
  equity: z.array(ResearchEquityPointSchema).nullable(),
  equityUnavailableReason: z.string().nullable().default(null),
  temporalBlocks: z.array(TemporalBlockSchema).nullable(),
  temporalUnavailableReason: z.string().nullable().default(null),
  frictionScenarios: z.array(FrictionScenarioSchema).nullable(),
  frictionUnavailableReason: z.string().nullable().default(null),
  parameterGrid: ParameterGridSchema.nullable(),
  parameterUnavailableReason: z.string().nullable().default(null),
  provenance: ResearchProvenanceSchema,
});
export type ResearchStrategyResult = z.infer<
  typeof ResearchStrategyResultSchema
>;

/** One pairwise correlation of strategy returns, or the absence of one. */
export const StrategyCorrelationSchema = z.object({
  a: z.string(),
  b: z.string(),
  value: Measure,
});
export type StrategyCorrelation = z.infer<typeof StrategyCorrelationSchema>;

export const ResearchComparisonSchema = z.object({
  strategyIds: z.array(z.string()).min(1),
  correlations: z.array(StrategyCorrelationSchema),
  source: MetricSourceSchema,
});
export type ResearchComparison = z.infer<typeof ResearchComparisonSchema>;

/** Experimental conditions shared by every experiment under one protocol. */
export const ResearchProtocolSchema = z.object({
  id: z.string(),
  version: z.string(),
  sha256: z.string().nullable(),
  timeframe: z.string(),
  periodsPerYear: z.number(),
  universe: z.array(z.string()),
  signalTimestamp: z.string(),
  executionTimestamp: z.string(),
  feeRate: z.number(),
  spreadBps: z.number(),
  slippageBps: z.number(),
  initialCapitalLabel: z.string(),
  windowEnd: IsoInstant,
  lockedAt: IsoInstant,
  referenceId: z.string(),
  sourceCommit: z.string(),
});
export type ResearchProtocol = z.infer<typeof ResearchProtocolSchema>;

export const ResearchDatasetSchema = z.object({
  id: z.string(),
  exchange: z.string(),
  marketType: z.string(),
  timeframe: z.string(),
  manifestSha256: z.string(),
  provenance: z.string(),
  /** The last bar in the frozen dataset — the OOS boundary. */
  lastHistoricalBar: IsoInstant,
  assets: z.array(
    z.object({
      symbol: z.string(),
      rows: z.number().int().positive(),
      firstTimestamp: IsoInstant,
      lastTimestamp: IsoInstant,
    })
  ),
});
export type ResearchDataset = z.infer<typeof ResearchDatasetSchema>;

export const ResearchContextSchema = z.object({
  datasets: z.array(ResearchDatasetSchema).min(1),
  protocols: z.array(ResearchProtocolSchema).min(1),
  /** Where this whole payload was assembled from, and when. */
  compiledFrom: z.array(z.string()).min(1),
});
export type ResearchContext = z.infer<typeof ResearchContextSchema>;

export interface ResearchLab {
  context: ResearchContext;
  strategies: ResearchStrategyResult[];
  comparison: ResearchComparison;
}
