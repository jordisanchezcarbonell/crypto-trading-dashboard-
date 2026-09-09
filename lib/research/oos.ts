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

export type Scope = {
  /** Assets in the protocol universe: 9 hand-picked, or 102 selected by rule. */
  size: number;
  label: string;
  note: string;
  startAt: string;
  endAt: string;
  initialCapital: number;
  strategies: StrategyView[];
};

export type OutOfSampleView = {
  timeframe: string;
  rule: string;
  /** Widest scope first: it is the evidence that governs. */
  scopes: Scope[];
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
 * The stressed reserve, split by universe and never merged.
 *
 * Two scopes exist and they answer different questions. Nine hand-picked assets
 * are what the project measured for most of its life; 102 selected by rule are
 * what it measured last, and that is the evidence that governs -- buy and hold
 * returned a +65.9% median CAGR on the nine and -11.1% on the rest, so the two
 * are not interchangeable and a chart that averaged them would be describing
 * neither.
 *
 * They are returned as separate scopes rather than a filter for the same reason
 * this view fixes a single segment: a control that silently swapped one for the
 * other would answer a different question under the same headline.
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

  const build = (row: (typeof selected)[number]): StrategyView => {
    const aggregate = metrics.get(row.experiment_id);
    const perAsset = byExperiment.get(row.experiment_id) ?? [];
    if (!aggregate) throw new Error(`Sin métricas agregadas para `);
    if (perAsset.length !== row.universe.length) {
      throw new Error(`:  activos para un universo de `);
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
  };

  const sizes = [...new Set(selected.map((row) => row.universe.length))].sort((a, b) => b - a);
  const scopes: Scope[] = sizes.map((size) => {
    const rows = selected.filter((row) => row.universe.length === size);
    const strategies = rows.map(build).sort((a, b) => b.sharpe - a.sharpe);
    const aggregate = metrics.get(rows[0].experiment_id);
    const wide = size > 9;
    return {
      size,
      label: wide ? ` activos por regla` : ` activos elegidos a mano`,
      note: wide
        ? "Universo seleccionado por regla mecánica. Es la evidencia que manda: ninguna de estas estrategias vio estos activos antes."
        : "Universo elegido a mano. Sus retornos absolutos están inflados por esa elección: comprar y mantener rindió aquí un CAGR mediano del +65,9% frente al −11,1% del universo por regla.",
      startAt: rows[0].start_at,
      endAt: rows[0].end_at,
      initialCapital: aggregate ? aggregate.initial_capital : 0,
      strategies,
    };
  });
  if (scopes.length === 0) throw new Error("El contrato no contiene ningún universo");

  return { timeframe: manifest.timeframe, rule: RULE.text, scopes };
}
