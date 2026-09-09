import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Two producers currently feed the research section: `scripts/research_export.py`
 * writes `measured.json`, and the research repository's own exporter writes
 * `data/research/export/`. They read the same store and should therefore agree
 * exactly on every number they both carry.
 *
 * They are not consolidated because neither is a superset -- the measured bundle
 * carries per-asset curves and correlations the contract does not, and the
 * contract carries segments and stress the bundle cannot express. Two shapes for
 * two questions is a defensible state; two shapes that quietly disagree is not.
 *
 * This test is the cheap half of that trade. It does not stop the duplication,
 * it stops the duplication from drifting silently.
 */

type Metrics = { returnPct: number | null; maxDrawdownPct: number | null; sharpe: number | null; trades: number };
type Bundle = { strategies: { id: string; assets: Record<string, { metrics: Metrics }> }[] };
type Experiment = { experiment_id: string; strategy: string; partition_side: string | null; stressed: boolean };
type AssetRow = {
  experiment_id: string; asset: string;
  total_return_pct: number; max_drawdown_pct: number; sharpe: number; trades: number;
};

const load = <T>(path: string): T => JSON.parse(readFileSync(resolve(path), "utf8")) as T;

describe("the two research data paths", () => {
  const bundle = load<Bundle>("data/research/measured.json");
  const experiments = load<Experiment[]>("data/research/export/research_experiments.json");
  const assets = load<AssetRow[]>("data/research/export/research_asset_metrics.json");

  // The contract's full-history in-sample runs are the ones the bundle describes.
  const inSample = new Map(
    experiments.filter((e) => e.partition_side === null && !e.stressed).map((e) => [e.strategy, e.experiment_id]),
  );
  const byExperiment = new Map<string, Map<string, AssetRow>>();
  for (const row of assets) {
    const existing = byExperiment.get(row.experiment_id) ?? new Map();
    existing.set(row.asset, row);
    byExperiment.set(row.experiment_id, existing);
  }

  it("covers every strategy the bundle publishes", () => {
    for (const strategy of bundle.strategies) {
      expect(inSample.has(strategy.id), `${strategy.id} missing from the contract`).toBe(true);
    }
    expect(bundle.strategies.length).toBeGreaterThanOrEqual(6);
  });

  it("agrees exactly on every metric both paths carry", () => {
    let compared = 0;
    for (const strategy of bundle.strategies) {
      const rows = byExperiment.get(inSample.get(strategy.id)!)!;
      for (const [asset, result] of Object.entries(strategy.assets)) {
        const row = rows.get(asset);
        if (!row) continue;
        const where = `${strategy.id} ${asset}`;
        // Exact, not approximate: both sides read the same certified store, so a
        // difference of any size means one of them changed how it computes.
        expect(result.metrics.returnPct, `${where} return`).toBe(row.total_return_pct);
        expect(result.metrics.maxDrawdownPct, `${where} drawdown`).toBe(row.max_drawdown_pct);
        expect(result.metrics.sharpe, `${where} sharpe`).toBe(row.sharpe);
        expect(result.metrics.trades, `${where} trades`).toBe(row.trades);
        compared += 1;
      }
    }
    // Guards against the comparison silently becoming vacuous.
    expect(compared).toBeGreaterThanOrEqual(54);
  });
});
