import { describe, expect, it } from "vitest";
import {
  DecisionRowSchema,
  EquityHistoryRowSchema,
  PositionSnapshotRowSchema,
  StrategySnapshotRowSchema,
  SystemSnapshotRowSchema,
  TradeRowSchema,
  mapDecision,
  mapEquityPoint,
  mapHealth,
  mapPerformance,
  mapPosition,
  mapStrategyStatus,
  mapTrade,
} from "@/lib/data-source/supabase-mappers";

describe("Supabase row → domain mappers", () => {
  it("maps a strategy snapshot row", () => {
    const row = StrategySnapshotRowSchema.parse({
      run_id: "RUN-3",
      strategy: "EMA-v1",
      ts: "2026-08-22T12:30:00.000Z",
      status: "ok",
      open_positions: 2,
      equity_usd: 5620.42,
      day_pnl_usd: 82.4,
      day_pnl_pct: 1.49,
      last_decision_at: "2026-08-22T12:29:00.000Z",
    });
    const out = mapStrategyStatus(row);
    expect(out).toEqual({
      name: "EMA-v1",
      status: "ok",
      openPositions: 2,
      equityUsd: 5620.42,
      dayPnlUsd: 82.4,
      dayPnlPct: 1.49,
      lastDecisionAt: "2026-08-22T12:29:00.000Z",
    });
  });

  it("maps a position snapshot row (asset → symbol)", () => {
    const row = PositionSnapshotRowSchema.parse({
      id: "pos_btc_1",
      run_id: "RUN-3",
      strategy: "EMA-v1",
      asset: "BTC-USDT",
      ts: "2026-08-22T12:30:00.000Z",
      side: "long",
      qty: 0.084,
      entry_price: 61240.12,
      mark_price: 63105.4,
      notional_usd: 5300.85,
      unrealized_pnl_usd: 156.68,
      unrealized_pnl_pct: 3.05,
      opened_at: "2026-08-19T04:30:00.000Z",
    });
    const out = mapPosition(row);
    expect(out.symbol).toBe("BTC-USDT");
    expect(out.entryPrice).toBe(61240.12);
    expect(out.strategy).toBe("EMA-v1");
  });

  it("maps a trade row (source_trade_id → id)", () => {
    const row = TradeRowSchema.parse({
      source_trade_id: "trd_BTC-USDT_6",
      run_id: "RUN-3",
      strategy: "EMA-v1",
      asset: "BTC-USDT",
      side: "long",
      qty: 0.06,
      entry_price: 58400,
      exit_price: 60120,
      pnl_usd: 100.4,
      pnl_pct: 2.9,
      fees_usd: 2.8,
      opened_at: "2026-08-22T06:00:00.000Z",
      closed_at: "2026-08-22T06:30:00.000Z",
      reason: "target reached",
    });
    const out = mapTrade(row);
    expect(out.id).toBe("trd_BTC-USDT_6");
    expect(out.symbol).toBe("BTC-USDT");
  });

  it("maps a decision row (source_decision_id → id, ts → timestamp)", () => {
    const row = DecisionRowSchema.parse({
      source_decision_id: "dec_001",
      run_id: "RUN-3",
      strategy: "EMA-v1",
      ts: "2026-08-22T12:05:00.000Z",
      asset: "BTC-USDT",
      action: "hold",
      confidence: 0.62,
      rationale: "Waiting for pullback.",
      signals: [{ name: "rsi_4h", value: 68.4 }],
      executed: true,
    });
    const out = mapDecision(row);
    expect(out.id).toBe("dec_001");
    expect(out.timestamp).toBe("2026-08-22T12:05:00.000Z");
    expect(out.symbol).toBe("BTC-USDT");
  });

  it("accepts a decision row without a strategy (nullable)", () => {
    expect(() =>
      DecisionRowSchema.parse({
        source_decision_id: "dec_002",
        run_id: "RUN-3",
        strategy: null,
        ts: "2026-08-22T12:05:00.000Z",
        asset: "SOL-USDT",
        action: "skip",
        confidence: 0.33,
        rationale: "No edge.",
        signals: [],
        executed: false,
      })
    ).not.toThrow();
  });

  it("maps an equity history row", () => {
    const row = EquityHistoryRowSchema.parse({
      run_id: "RUN-3",
      strategy: "AGGREGATE",
      ts: "2026-08-22T00:00:00.000Z",
      equity_usd: 10345.12,
      drawdown_pct: -1.2,
    });
    const out = mapEquityPoint(row);
    expect(out).toEqual({
      timestamp: "2026-08-22T00:00:00.000Z",
      equityUsd: 10345.12,
      drawdownPct: -1.2,
    });
  });

  it("maps a system snapshot row into health / performance / rejects wrong shape", () => {
    const row = SystemSnapshotRowSchema.parse({
      id: "abc",
      run_id: "RUN-3",
      generated_at: "2026-08-22T12:30:00.000Z",
      overall: "ok",
      last_sync: "2026-08-22T12:29:15.000Z",
      next_processing: "2026-08-22T12:34:15.000Z",
      components: [
        {
          name: "exchange_ws",
          status: "ok",
          detail: "Binance WS connected",
          latency_ms: 82,
        },
      ],
      performance: {
        startingCapitalUsd: 10000,
        currentEquityUsd: 10345.12,
        totalReturnPct: 3.45,
        cagrPct: 15.1,
        sharpe: 1.42,
        sortino: 2.11,
        maxDrawdownPct: -5.4,
        winRatePct: 60,
        profitFactor: 1.8,
        avgTradePct: 1.1,
        totalTrades: 20,
        bestTradePct: 8.4,
        worstTradePct: -3.2,
      },
      comparisons: null,
    });
    const health = mapHealth(row);
    expect(health.overall).toBe("ok");
    expect(health.components[0]).toMatchObject({
      name: "exchange_ws",
      latencyMs: 82,
      detail: "Binance WS connected",
    });
    const perf = mapPerformance(row);
    expect(perf.currentEquityUsd).toBe(10345.12);
  });

  it("handles null-ish component metadata", () => {
    const row = SystemSnapshotRowSchema.parse({
      id: "abc",
      run_id: "RUN-3",
      generated_at: "2026-08-22T12:30:00.000Z",
      overall: "ok",
      last_sync: "2026-08-22T12:29:15.000Z",
      next_processing: "2026-08-22T12:34:15.000Z",
      components: [
        { name: "order_router", status: "ok", detail: null, latency_ms: null },
      ],
      performance: {
        startingCapitalUsd: 0,
        currentEquityUsd: 0,
        totalReturnPct: 0,
        cagrPct: 0,
        sharpe: 0,
        sortino: 0,
        maxDrawdownPct: 0,
        winRatePct: 0,
        profitFactor: 0,
        avgTradePct: 0,
        totalTrades: 0,
        bestTradePct: 0,
        worstTradePct: 0,
      },
      comparisons: [],
    });
    const health = mapHealth(row);
    expect(health.components[0].latencyMs).toBeUndefined();
    expect(health.components[0].detail).toBeUndefined();
  });
});
