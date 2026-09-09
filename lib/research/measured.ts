import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const instant = z.string().datetime({ offset: true });
const measure = z.number().finite().nullable();
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const metrics = z.object({
  returnPct: measure, cagrPct: measure, maxDrawdownPct: measure, sharpe: measure,
  sortino: measure, calmar: measure, trades: z.number().int().nonnegative(),
  winRatePct: measure, profitFactor: measure, turnover: measure, exposurePct: measure,
  fees: measure, spread: measure, slippage: measure, finalEquity: measure,
});
const assetResult = z.object({
  startAt: instant, endAt: instant, bars: z.number().int().positive(),
  missingBars: z.number().int().nonnegative(), causalityPassed: z.literal(true),
  metrics, curve: z.array(z.tuple([instant, z.number().positive(), z.number().max(0)])).min(2),
});
const strategy = z.object({
  id: z.string(), label: z.string(), description: z.string(),
  parameters: z.record(z.string(), z.union([z.number(), z.string()])),
  source: z.object({
    sourceRepository: z.string().url(), sourceCommit: z.string(), sourcePath: z.string(),
    sourceSha256: digest, license: z.string(), author: z.string(),
    originalTimeframe: z.string(), adaptedTimeframe: z.string(),
    originalPerformanceReproduced: z.literal(false), changes: z.array(z.string()),
  }).nullable(),
  experimentId: z.string(), executionId: z.string(), repeatExecutionId: z.string(),
  resultHash: digest, strategyHash: digest, sourceCommit: z.string().nullable(),
  sourceDirty: z.boolean(), reproducible: z.literal(true), status: z.literal("RESEARCH"),
  assets: z.record(z.string(), assetResult),
});
const bundleSchema = z.object({
  schemaVersion: z.literal(1), generatedAt: instant, segment: z.literal("IN_SAMPLE"),
  protocol: z.object({id: z.string(), hash: digest, timeframe: z.literal("4h"),
    feeRate: z.number(), spreadBps: z.number(), slippageBps: z.number(),
    initialCapital: z.number().positive(), datasetId: z.string(), datasetHash: digest,
    universe: z.array(z.string()).min(1)}),
  gates: z.array(z.object({name: z.string(), passed: z.literal(true)})),
  strategies: z.array(strategy).min(2),
  correlations: z.record(z.string(), z.array(z.array(z.number().min(-1.00000001).max(1.00000001).nullable()))),
  limitations: z.array(z.string()),
});

type Bundle = z.infer<typeof bundleSchema>;
export type MeasuredStrategy = Omit<Bundle["strategies"][number], "assets"> & {result: z.infer<typeof assetResult>};
export type MeasuredComparison = Omit<Bundle, "strategies" | "correlations"> & {
  asset: string; strategies: MeasuredStrategy[]; correlations: (number | null)[][];
};

export function validateComparison(data: MeasuredComparison): MeasuredComparison {
  const first = data.strategies[0].result;
  if (new Set(data.strategies.map(s => s.id)).size !== data.strategies.length) throw new Error("Duplicate strategy");
  for (const s of data.strategies) {
    if (s.result.startAt !== first.startAt || s.result.endAt !== first.endAt || s.result.bars !== first.bars) {
      throw new Error("Incompatible comparison window");
    }
    if (s.result.curve[0][1] !== 100 || s.result.curve[0][0] !== s.result.startAt || s.result.curve.at(-1)?.[0] !== s.result.endAt) {
      throw new Error("Curve window or normalization mismatch");
    }
    if (s.result.curve.some((p, i, points) => i > 0 && Date.parse(p[0]) <= Date.parse(points[i - 1][0]))) {
      throw new Error("Unordered curve timestamps");
    }
  }
  if (data.correlations.length !== data.strategies.length || data.correlations.some(row => row.length !== data.strategies.length)) {
    throw new Error("Correlation dimensions mismatch");
  }
  return data;
}

// Read only on the server. Only one asset's curves cross the RSC boundary.
export function loadMeasuredComparison(asset = "SOL/USDT"): MeasuredComparison {
  const bundle = bundleSchema.parse(JSON.parse(readFileSync(join(process.cwd(), "data/research/measured.json"), "utf8")));
  const selected = bundle.protocol.universe.includes(asset) ? asset : "SOL/USDT";
  return validateComparison({...bundle, asset: selected, correlations: bundle.correlations[selected],
    strategies: bundle.strategies.map(({assets, ...s}) => ({...s, result: assets[selected]}))});
}
