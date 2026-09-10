/**
 * The regime study: can the market state be called at the time, or only after?
 *
 * The distinction decides what the surviving strategies *are*. If the regime is
 * only legible in hindsight, trend following here is insurance -- you accept
 * lagging the rises to avoid the falls, which is a decision about temperament.
 * If it can be called at the time, a two-state strategy exists that none of the
 * tested ones is.
 *
 * Numbers come from docs/research_regime_analysis.md, measured over 95 assets
 * and 15,948 usable observations. Formatted here so no view does arithmetic.
 */

export type QuintileRow = {
  label: string;
  /** Share of the universe above its own 180-bar mean, at the decision bar. */
  range: string;
  /** Mean share of assets the strategy held over the following bar, percent. */
  exposure: number;
  /** Mean strategy return over the following bar, bps. */
  ret: number;
  /**
   * Return divided by exposure, bps. The column that carries the finding:
   * breadth predicting *how invested* the strategy will be is mechanical and
   * worth nothing, and this figure is not mechanical.
   */
  perUnit: number;
  /** Median asset return over the following bar, bps. Median, never mean. */
  marketMedian: number;
};

export const QUINTILES: QuintileRow[] = [
  {
    label: "Q1",
    range: "0,00–0,08",
    exposure: 13.6,
    ret: -6.82,
    perUnit: -49.99,
    marketMedian: -7.92,
  },
  {
    label: "Q2",
    range: "0,08–0,20",
    exposure: 23.9,
    ret: -5.14,
    perUnit: -21.51,
    marketMedian: 3.93,
  },
  {
    label: "Q3",
    range: "0,20–0,47",
    exposure: 38.1,
    ret: -5.22,
    perUnit: -13.68,
    marketMedian: 7.14,
  },
  {
    label: "Q4",
    range: "0,47–0,84",
    exposure: 63.7,
    ret: 4.11,
    perUnit: 6.45,
    marketMedian: 18.82,
  },
  {
    label: "Q5",
    range: "0,84–1,00",
    exposure: 80.0,
    ret: 23.35,
    perUnit: 29.19,
    marketMedian: 38.15,
  },
];

export type GateRow = {
  label: string;
  cagr: number;
  drawdown: number;
  sharpe: number;
  /** True for the ungated run every other row is judged against. */
  baseline?: boolean;
};

/**
 * Gated on a causal expanding percentile, with the cost of leaving and
 * returning charged. The gate is applied to the target before costs, never to
 * the returns afterwards -- that would be free, and would flatter the result in
 * proportion to how often the gate fires.
 */
export const GATES: GateRow[] = [
  {
    label: "Sin puerta",
    cagr: 29.3,
    drawdown: -69.5,
    sharpe: 0.775,
    baseline: true,
  },
  { label: "Percentil 20", cagr: 24.5, drawdown: -73.5, sharpe: 0.754 },
  { label: "Percentil 40", cagr: 31.2, drawdown: -64.5, sharpe: 0.916 },
  { label: "Percentil 60", cagr: 22.0, drawdown: -55.6, sharpe: 0.765 },
];

export const BASELINE_SHARPE = 0.775;

export const REGIME_FACTS = {
  assets: 95,
  observations: "15.948",
  lookbackBars: 180,
  source: "docs/research_regime_analysis.md",
  trials: 222,
};

/** The two ways this study nearly went wrong, kept because both nearly worked. */
export const TRAPS = [
  {
    title: "El umbral que miraba al futuro",
    body: "La primera versión calculó los percentiles de amplitud sobre toda la historia. En t nadie sabe dónde pondrá 2026 el percentil 20. Con el percentil recalculado solo con el pasado, el Sharpe baja de 0,944 a 0,916. La fuga valía poco, pero lo que se publica tiene que ser lo que se podía haber operado.",
  },
  {
    title: "La media que decía lo contrario que la mediana",
    body: "La correlación de la amplitud con el retorno medio del mercado es −0,0023, y parecía cerrar el asunto. Ese promedio estaba corrompido por extremos: el quintil más bajista mostraba +83 bps de media por barra. La mediana sube monótonamente de −7,9 a +38,2 bps.",
  },
];
