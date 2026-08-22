import type {
  ClosedTrade,
  ComparisonSeries,
  Decision,
  EquityPoint,
  HealthSnapshot,
  PerformanceSummary,
  Position,
  RunSnapshot,
  StrategyStatus,
} from "@/lib/domain/schemas";
import { computeFreshness } from "@/lib/domain/freshness";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Deterministic PRNG so fixtures stay stable between runs and tests.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed anchors keep equity curve, trades and decisions reproducible.
// Timestamps that need to feel "live" (last_sync, next_processing) are
// derived from the `now` argument passed into `buildRun3Snapshot`.
const RUN_START_EPOCH = Date.UTC(2026, 4, 24, 8, 0, 0);
const SNAPSHOT_EPOCH = Date.UTC(2026, 7, 22, 12, 30, 0);
const START_CAPITAL = 10_000;
const STRATEGIES = ["EMA-v1", "EMA-v2-risk"] as const;
type StrategyName = (typeof STRATEGIES)[number];

function isoAt(offsetMs: number): string {
  return new Date(SNAPSHOT_EPOCH + offsetMs).toISOString();
}

function buildEquityCurve(): EquityPoint[] {
  const rand = mulberry32(42);
  const days = 90;
  const points: EquityPoint[] = [];
  let equity = START_CAPITAL;
  let peak = equity;
  const dailyDriftMean = 0.0035;
  const dailyDriftStd = 0.018;

  for (let i = 0; i <= days; i += 1) {
    const shock = (rand() - 0.5) * 2 * dailyDriftStd;
    const drift = dailyDriftMean + shock;
    equity = i === 0 ? START_CAPITAL : Math.max(500, equity * (1 + drift));
    peak = Math.max(peak, equity);
    const drawdown = (equity - peak) / peak;
    points.push({
      timestamp: new Date(RUN_START_EPOCH + i * DAY_MS).toISOString(),
      equityUsd: Number(equity.toFixed(2)),
      drawdownPct: Number((drawdown * 100).toFixed(3)),
    });
  }
  return points;
}

function buildClosedTrade(
  symbol: string,
  side: "long" | "short",
  qty: number,
  entry: number,
  exit: number,
  hoursAgo: number,
  strategy: StrategyName,
  reason: string
): ClosedTrade {
  const direction = side === "long" ? 1 : -1;
  const grossPnl = (exit - entry) * qty * direction;
  const notional = entry * qty;
  const fees = Number((notional * 0.0004 * 2).toFixed(2));
  const pnl = Number((grossPnl - fees).toFixed(2));
  const pnlPct = Number((((exit - entry) / entry) * 100 * direction).toFixed(3));
  return {
    id: `trd_${symbol}_${hoursAgo}`,
    symbol,
    side,
    qty,
    entryPrice: entry,
    exitPrice: exit,
    pnlUsd: pnl,
    pnlPct,
    feesUsd: fees,
    openedAt: isoAt(-(hoursAgo + Math.round(3 + qty)) * HOUR_MS),
    closedAt: isoAt(-hoursAgo * HOUR_MS),
    strategy,
    reason,
  };
}

const positions: Position[] = [
  {
    id: "pos_btc_1",
    symbol: "BTC-USDT",
    side: "long",
    qty: 0.084,
    entryPrice: 61_240.12,
    markPrice: 63_105.4,
    notionalUsd: 63_105.4 * 0.084,
    unrealizedPnlUsd: (63_105.4 - 61_240.12) * 0.084,
    unrealizedPnlPct: ((63_105.4 - 61_240.12) / 61_240.12) * 100,
    openedAt: isoAt(-3 * DAY_MS - 4 * HOUR_MS),
    strategy: "EMA-v1",
  },
  {
    id: "pos_eth_1",
    symbol: "ETH-USDT",
    side: "long",
    qty: 1.42,
    entryPrice: 3_205.8,
    markPrice: 3_281.55,
    notionalUsd: 3_281.55 * 1.42,
    unrealizedPnlUsd: (3_281.55 - 3_205.8) * 1.42,
    unrealizedPnlPct: ((3_281.55 - 3_205.8) / 3_205.8) * 100,
    openedAt: isoAt(-1 * DAY_MS - 6 * HOUR_MS),
    strategy: "EMA-v2-risk",
  },
  {
    id: "pos_sol_1",
    symbol: "SOL-USDT",
    side: "short",
    qty: 12.4,
    entryPrice: 148.2,
    markPrice: 152.9,
    notionalUsd: 152.9 * 12.4,
    unrealizedPnlUsd: (148.2 - 152.9) * 12.4,
    unrealizedPnlPct: ((148.2 - 152.9) / 148.2) * 100,
    openedAt: isoAt(-9 * HOUR_MS),
    strategy: "EMA-v2-risk",
  },
];

const trades: ClosedTrade[] = [
  buildClosedTrade("BTC-USDT", "long", 0.06, 58_400, 60_120, 6, "EMA-v1", "target reached"),
  buildClosedTrade("ETH-USDT", "long", 1.1, 3_050, 3_180, 12, "EMA-v1", "signal exit"),
  buildClosedTrade("SOL-USDT", "long", 15, 132.4, 140.1, 18, "EMA-v2-risk", "target reached"),
  buildClosedTrade("BTC-USDT", "short", 0.05, 62_800, 61_940, 24, "EMA-v2-risk", "target reached"),
  buildClosedTrade("ETH-USDT", "long", 1.3, 3_310, 3_215, 30, "EMA-v1", "stop hit"),
  buildClosedTrade("AVAX-USDT", "long", 25, 32.8, 34.6, 36, "EMA-v2-risk", "target reached"),
  buildClosedTrade("BTC-USDT", "long", 0.07, 59_100, 60_450, 44, "EMA-v1", "target reached"),
  buildClosedTrade("ARB-USDT", "long", 900, 0.78, 0.71, 52, "EMA-v1", "stop hit"),
  buildClosedTrade("SOL-USDT", "short", 10, 155.4, 150.9, 60, "EMA-v2-risk", "target reached"),
  buildClosedTrade("BTC-USDT", "long", 0.08, 60_800, 61_950, 68, "EMA-v1", "target reached"),
  buildClosedTrade("ETH-USDT", "short", 1.4, 3_290, 3_360, 76, "EMA-v2-risk", "stop hit"),
  buildClosedTrade("LINK-USDT", "long", 120, 14.2, 15.4, 84, "EMA-v1", "target reached"),
  buildClosedTrade("BTC-USDT", "long", 0.05, 62_100, 63_050, 92, "EMA-v1", "target reached"),
  buildClosedTrade("SOL-USDT", "long", 12, 144.5, 149.2, 100, "EMA-v2-risk", "target reached"),
  buildClosedTrade("ETH-USDT", "long", 1.2, 3_180, 3_120, 108, "EMA-v1", "stop hit"),
  buildClosedTrade("MATIC-USDT", "long", 2200, 0.62, 0.66, 116, "EMA-v2-risk", "target reached"),
  buildClosedTrade("BTC-USDT", "long", 0.06, 60_400, 61_800, 124, "EMA-v1", "target reached"),
  buildClosedTrade("SOL-USDT", "long", 14, 138.2, 145.6, 132, "EMA-v2-risk", "target reached"),
  buildClosedTrade("ETH-USDT", "short", 1.0, 3_320, 3_240, 140, "EMA-v2-risk", "target reached"),
  buildClosedTrade("BTC-USDT", "long", 0.09, 59_800, 58_900, 148, "EMA-v1", "stop hit"),
];

const decisions: Decision[] = [
  {
    id: "dec_001",
    timestamp: isoAt(-25 * 60 * 1000),
    symbol: "BTC-USDT",
    action: "hold",
    confidence: 0.62,
    rationale:
      "Trend still up but RSI(14) approaching 71 on 4h. Waiting for pullback before scaling in.",
    signals: [
      { name: "rsi_4h", value: 68.4 },
      { name: "ema_50_200", value: "bull" },
      { name: "atr_pct", value: 1.42 },
    ],
    executed: true,
  },
  {
    id: "dec_002",
    timestamp: isoAt(-1 * HOUR_MS - 12 * 60 * 1000),
    symbol: "SOL-USDT",
    action: "open_short",
    confidence: 0.71,
    rationale:
      "Breakout above 152 failed to close a candle. Volume divergence and bearish engulfing on 1h. Sizing at 1R.",
    signals: [
      { name: "vol_z", value: -1.8 },
      { name: "pattern", value: "bearish_engulfing" },
      { name: "risk_per_trade_pct", value: 1 },
    ],
    executed: true,
  },
  {
    id: "dec_003",
    timestamp: isoAt(-2 * HOUR_MS - 6 * 60 * 1000),
    symbol: "ETH-USDT",
    action: "scale_in",
    confidence: 0.66,
    rationale:
      "Mean-reversion setup at lower band with declining ATR. Adding 0.3 units to existing long.",
    signals: [
      { name: "bb_pctb", value: 0.08 },
      { name: "atr_delta", value: -0.11 },
    ],
    executed: true,
  },
  {
    id: "dec_004",
    timestamp: isoAt(-5 * HOUR_MS),
    symbol: "ARB-USDT",
    action: "skip",
    confidence: 0.33,
    rationale:
      "Signal conflicts across timeframes. Skipping until 1D closes above 20EMA.",
    signals: [
      { name: "trend_1d", value: "flat" },
      { name: "trend_4h", value: "down" },
    ],
    executed: false,
  },
  {
    id: "dec_005",
    timestamp: isoAt(-9 * HOUR_MS),
    symbol: "BTC-USDT",
    action: "close",
    confidence: 0.78,
    rationale:
      "Profit target hit at 60.4k. Locking in +2.3% and rotating risk to ETH setup.",
    signals: [
      { name: "target_touched", value: true },
      { name: "trailing_stop", value: 60_050 },
    ],
    executed: true,
  },
  {
    id: "dec_006",
    timestamp: isoAt(-14 * HOUR_MS),
    symbol: "LINK-USDT",
    action: "open_long",
    confidence: 0.69,
    rationale: "Range breakout with confirmation. Entering 0.75 units, stop below 13.8.",
    signals: [
      { name: "range_break", value: true },
      { name: "vol_z", value: 1.6 },
    ],
    executed: true,
  },
  {
    id: "dec_007",
    timestamp: isoAt(-22 * HOUR_MS),
    symbol: "MATIC-USDT",
    action: "hold",
    confidence: 0.51,
    rationale: "No edge. Market chop and macro data pending in 2h.",
    signals: [{ name: "macro_event", value: "CPI-2h" }],
    executed: true,
  },
];

const equityCurve = buildEquityCurve();
const currentEquity = equityCurve[equityCurve.length - 1].equityUsd;
const maxDrawdownPct = equityCurve.reduce(
  (min, p) => (p.drawdownPct < min ? p.drawdownPct : min),
  0
);

const performance: PerformanceSummary = (() => {
  const totalReturnPct = ((currentEquity - START_CAPITAL) / START_CAPITAL) * 100;
  const wins = trades.filter((t) => t.pnlUsd > 0);
  const losses = trades.filter((t) => t.pnlUsd <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnlUsd, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlUsd, 0));
  const winRate = (wins.length / trades.length) * 100;
  const avgTradePct =
    trades.reduce((s, t) => s + t.pnlPct, 0) / trades.length;
  const best = trades.reduce((m, t) => (t.pnlPct > m ? t.pnlPct : m), -Infinity);
  const worst = trades.reduce((m, t) => (t.pnlPct < m ? t.pnlPct : m), Infinity);
  const daysActive = (SNAPSHOT_EPOCH - RUN_START_EPOCH) / (365.25 * DAY_MS);
  const cagr =
    (Math.pow(currentEquity / START_CAPITAL, 1 / Math.max(daysActive, 0.01)) -
      1) *
    100;

  return {
    startingCapitalUsd: START_CAPITAL,
    currentEquityUsd: Number(currentEquity.toFixed(2)),
    totalReturnPct: Number(totalReturnPct.toFixed(3)),
    cagrPct: Number(cagr.toFixed(3)),
    sharpe: 1.42,
    sortino: 2.11,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(3)),
    winRatePct: Number(winRate.toFixed(2)),
    profitFactor: Number((grossProfit / Math.max(grossLoss, 0.01)).toFixed(2)),
    avgTradePct: Number(avgTradePct.toFixed(3)),
    totalTrades: trades.length,
    bestTradePct: Number(best.toFixed(3)),
    worstTradePct: Number(worst.toFixed(3)),
  };
})();

const comparisons: ComparisonSeries[] = (() => {
  const rand = mulberry32(7);
  const btcSeries = {
    label: "BTC hold",
    color: "#f59e0b",
    points: [] as { timestamp: string; valueIndexed: number }[],
  };
  const runSeries = {
    label: "RUN-3",
    color: "#22d3ee",
    points: [] as { timestamp: string; valueIndexed: number }[],
  };
  let btc = 100;
  for (let i = 0; i < equityCurve.length; i += 1) {
    btc *= 1 + (rand() - 0.48) * 0.02;
    const point = equityCurve[i];
    runSeries.points.push({
      timestamp: point.timestamp,
      valueIndexed: Number(((point.equityUsd / START_CAPITAL) * 100).toFixed(3)),
    });
    btcSeries.points.push({
      timestamp: point.timestamp,
      valueIndexed: Number(btc.toFixed(3)),
    });
  }
  return [runSeries, btcSeries];
})();

function buildStrategies(): StrategyStatus[] {
  const emaV1 = positions.filter((p) => p.strategy === "EMA-v1");
  const emaV2 = positions.filter((p) => p.strategy === "EMA-v2-risk");
  return [
    {
      name: "EMA-v1",
      status: "ok",
      openPositions: emaV1.length,
      equityUsd: 5_620.42,
      dayPnlUsd: 82.4,
      dayPnlPct: 1.49,
      lastDecisionAt: decisions[0].timestamp,
    },
    {
      name: "EMA-v2-risk",
      status: "ok",
      openPositions: emaV2.length,
      equityUsd: currentEquity - 5_620.42,
      dayPnlUsd: -14.9,
      dayPnlPct: -0.32,
      lastDecisionAt: decisions[1].timestamp,
    },
  ];
}

const strategies = buildStrategies();

export interface BuildRun3Options {
  now?: Date;
  // Fake how long ago the exporter last synced. Defaults to 45s.
  lastSyncOffsetMs?: number;
  nextProcessingOffsetMs?: number;
}

export function buildRun3Snapshot(options: BuildRun3Options = {}): RunSnapshot {
  const now = options.now ?? new Date();
  const lastSyncOffset = options.lastSyncOffsetMs ?? -45 * 1000;
  const nextProcessingOffset =
    options.nextProcessingOffsetMs ?? 4 * 60 * 1000 + 15 * 1000;

  const lastSyncIso = new Date(now.getTime() + lastSyncOffset).toISOString();
  const nextProcessingIso = new Date(
    now.getTime() + nextProcessingOffset
  ).toISOString();

  const health: HealthSnapshot = {
    overall: "ok",
    lastSync: lastSyncIso,
    nextProcessing: nextProcessingIso,
    components: [
      { name: "exchange_ws", status: "ok", detail: "Binance WS connected", latencyMs: 82 },
      { name: "market_data", status: "ok", detail: "1m candles fresh", latencyMs: 120 },
      { name: "signal_engine", status: "ok", detail: "5m cycle", latencyMs: 340 },
      { name: "order_router", status: "ok", detail: "read-only mode: no orders sent", latencyMs: 0 },
      { name: "persistence", status: "ok", detail: "Supabase reachable", latencyMs: 190 },
    ],
  };

  return {
    runId: "RUN-3-DEMO",
    mode: "paper",
    readOnly: true,
    startedAt: new Date(RUN_START_EPOCH).toISOString(),
    health,
    freshness: computeFreshness(lastSyncIso, now),
    strategies,
    positions,
    trades,
    decisions,
    equityCurve,
    performance,
    comparisons,
  };
}

// Stable snapshot for tests: anchored to SNAPSHOT_EPOCH.
export const run3Snapshot: RunSnapshot = buildRun3Snapshot({
  now: new Date(SNAPSHOT_EPOCH),
});

/**
 * IMPORTANT: this fixture — and every row the seed script writes to Supabase —
 * uses the sentinel `RUN-3-DEMO`, never `RUN-3`.
 *
 *   RUN-3-DEMO → synthetic seeded / mock development data
 *   RUN-3      → RESERVED for real observability data pushed by the future
 *                Hetzner exporter. Nothing in this repo may write to it.
 */
export const DEMO_RUN_ID = "RUN-3-DEMO";

export const run3Meta = {
  runId: DEMO_RUN_ID,
  startCapitalUsd: START_CAPITAL,
  strategies: STRATEGIES,
} as const;
