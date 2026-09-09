import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

/**
 * Reads the research contract published by `crypto_trading_lab.research.export`.
 *
 * The contract exists because the store is shaped for reproducing an experiment,
 * not for drawing one. What this module adds on top is a single rule: nothing
 * reaches a chart without the label that says what it is. A development result
 * and a reserve result look identical as numbers and mean opposite things, so
 * `segment`, `partitionSide` and `stressed` are required fields, not optional
 * decoration, and the verdict below is derived from them.
 */

const instant = z.string().datetime({ offset: true });
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const measure = z.number().finite().nullable();

const experimentRow = z.object({
  experiment_id: z.string(),
  execution_id: z.string(),
  strategy: z.string(),
  strategy_version: z.string(),
  segment: z.enum(["IN_SAMPLE", "OUT_OF_SAMPLE", "WALK_FORWARD", "FORWARD"]),
  partition_side: z.enum(["development", "reserve"]).nullable(),
  stressed: z.boolean(),
  label: z.string(),
  variants: z.array(z.object({ kind: z.string(), params: z.record(z.string(), z.unknown()) })),
  strategy_code_hash: digest,
  protocol_hash: digest,
  dataset_id: z.string(),
  dataset_manifest_sha256: digest,
  universe: z.array(z.string()).min(1),
  timeframe: z.string(),
  start_at: instant,
  end_at: instant,
  created_at: instant,
  git_commit: z.string().nullable(),
  git_dirty: z.boolean(),
  result_hash: digest,
  evidence_hash: digest,
  tags: z.array(z.string()),
  status: z.string(),
  contract_version: z.literal(1),
});

const metricsRow = z.object({
  experiment_id: z.string(),
  aggregation: z.literal("equal_weight_portfolio"),
  total_return_pct: z.number().finite(),
  cagr_pct: z.number().finite(),
  max_drawdown_pct: z.number().finite(),
  sharpe: z.number().finite(),
  trades: z.number().int().nonnegative(),
  fees_paid: z.number(),
  spread_paid: z.number(),
  slippage_paid: z.number(),
  final_equity: z.number(),
  initial_capital: z.number().positive(),
  assets: z.number().int().positive(),
});

const assetRow = z.object({
  experiment_id: z.string(),
  asset: z.string(),
  total_return_pct: z.number().finite(),
  cagr_pct: z.number().finite(),
  max_drawdown_pct: z.number().finite(),
  sharpe: z.number().finite(),
  trades: z.number().int().nonnegative(),
  turnover: measure,
  exposure_pct: measure,
  start_at: instant,
  end_at: instant,
});

const pointRow = z.object({
  experiment_id: z.string(),
  timestamp: instant,
  normalized_equity: z.number().positive(),
  drawdown_pct: z.number().max(0.0000001),
});

const manifestSchema = z.object({
  contract_version: z.literal(1),
  timeframe: z.string(),
  periods_per_year: z.number().positive(),
  experiments: z.number().int().positive(),
});

export type Verdict = "SURVIVES" | "MARGINAL" | "REJECTED";

/**
 * The rule is stated here and shown in the UI, so a reader can disagree with the
 * verdict rather than having to trust it. It is deliberately about breadth and
 * survival, never about which strategy earned most: a single asset carrying an
 * otherwise flat result is the failure mode this is here to catch.
 */
export const RULE = {
  positiveAssets: 7,
  marginalAssets: 5,
  text: "Sobre la reserva con costes duplicados: SUPERA con retorno neto positivo en 7 o más de los 9 activos; MARGINAL entre 5 y 6; DESCARTADA por debajo de 5.",
} as const;

export type StrategyView = {
  strategy: string;
  label: string;
  experimentId: string;
  resultHash: string;
  startAt: string;
  endAt: string;
  assetsPositive: number;
  assetsTotal: number;
  verdict: Verdict;
  reason: string;
  returnPct: number;
  cagrPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  trades: number;
  curve: { ts: number; equity: number; drawdown: number }[];
};

export type OutOfSampleView = {
  timeframe: string;
  universe: string[];
  cutoff: string;
  startAt: string;
  endAt: string;
  initialCapital: number;
  strategies: StrategyView[];
  rule: string;
};

function read<T>(name: string, schema: z.ZodType<T>): T[] {
  const path = join(process.cwd(), "data/research/export", `${name}.json`);
  return z.array(schema).parse(JSON.parse(readFileSync(path, "utf8")));
}

function verdictFor(positive: number, total: number): { verdict: Verdict; reason: string } {
  if (positive >= RULE.positiveAssets) {
    return { verdict: "SURVIVES", reason: `Retorno neto positivo en ${positive} de ${total} activos.` };
  }
  if (positive >= RULE.marginalAssets) {
    return { verdict: "MARGINAL", reason: `Positiva solo en ${positive} de ${total} activos; no alcanza el umbral de ${RULE.positiveAssets}.` };
  }
  return { verdict: "REJECTED", reason: `Positiva solo en ${positive} de ${total} activos.` };
}

/**
 * The stressed reserve, and nothing else.
 *
 * Selecting one segment rather than offering a toggle is the point: this view
 * answers "what survived the hardest condition", and a toggle that silently
 * swapped in development numbers would answer a different question under the
 * same headline.
 */
export function loadOutOfSample(): OutOfSampleView {
  const manifest = manifestSchema.parse(
    JSON.parse(readFileSync(join(process.cwd(), "data/research/export/manifest.json"), "utf8")),
  );
  const experiments = read("research_experiments", experimentRow);
  const metrics = new Map(read("research_metrics", metricsRow).map((row) => [row.experiment_id, row]));
  const assets = read("research_asset_metrics", assetRow);
  const points = read("research_equity_points", pointRow);

  const selected = experiments.filter(
    (row) => row.segment === "OUT_OF_SAMPLE" && row.partition_side === "reserve" && row.stressed,
  );
  if (selected.length === 0) throw new Error("El contrato no contiene reserva con costes duplicados");

  const byExperiment = new Map<string, typeof assets>();
  for (const row of assets) {
    const list = byExperiment.get(row.experiment_id) ?? [];
    list.push(row);
    byExperiment.set(row.experiment_id, list);
  }
  const curves = new Map<string, typeof points>();
  for (const row of points) {
    const list = curves.get(row.experiment_id) ?? [];
    list.push(row);
    curves.set(row.experiment_id, list);
  }

  const strategies: StrategyView[] = selected.map((row) => {
    const aggregate = metrics.get(row.experiment_id);
    const perAsset = byExperiment.get(row.experiment_id) ?? [];
    if (!aggregate) throw new Error(`Sin métricas agregadas para ${row.experiment_id}`);
    if (perAsset.length !== row.universe.length) {
      throw new Error(`${row.strategy}: ${perAsset.length} activos para un universo de ${row.universe.length}`);
    }
    const positive = perAsset.filter((asset) => asset.total_return_pct > 0).length;
    const { verdict, reason } = verdictFor(positive, perAsset.length);
    return {
      strategy: row.strategy,
      label: row.label,
      experimentId: row.experiment_id,
      resultHash: row.result_hash,
      startAt: row.start_at,
      endAt: row.end_at,
      assetsPositive: positive,
      assetsTotal: perAsset.length,
      verdict,
      reason,
      returnPct: aggregate.total_return_pct,
      cagrPct: aggregate.cagr_pct,
      maxDrawdownPct: aggregate.max_drawdown_pct,
      sharpe: aggregate.sharpe,
      trades: aggregate.trades,
      curve: (curves.get(row.experiment_id) ?? [])
        .map((point) => ({
          ts: Date.parse(point.timestamp),
          equity: point.normalized_equity,
          drawdown: point.drawdown_pct,
        }))
        .sort((a, b) => a.ts - b.ts),
    };
  });

  const ranked = [...strategies].sort((a, b) => b.sharpe - a.sharpe);
  const first = selected[0];
  const aggregate = metrics.get(first.experiment_id);

  return {
    timeframe: manifest.timeframe,
    universe: first.universe,
    cutoff: first.start_at,
    startAt: first.start_at,
    endAt: first.end_at,
    initialCapital: aggregate ? aggregate.initial_capital : 0,
    strategies: ranked,
    rule: RULE.text,
  };
}
