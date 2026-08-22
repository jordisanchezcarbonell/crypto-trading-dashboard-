import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseDashboardProvider } from "@/lib/data-source/supabase";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";

/**
 * We don't touch a real Supabase from tests. Instead we stub `.from()` with a
 * tiny query builder that returns the payload we hand it. Just enough surface
 * to prove the provider assembles rows into the domain snapshot correctly.
 */
type Reply = { data: unknown; error: null };

function makeStubClient(
  routes: Record<string, Reply | (() => Reply)>
): SupabaseClient {
  const builder = (table: string) => {
    const state = { limit: 0 };
    const reply = () => {
      const r = routes[table];
      if (!r) throw new Error(`No stubbed route for table "${table}"`);
      return typeof r === "function" ? r() : r;
    };
    const chain: Record<string, unknown> = {};
    const returnChain = () => chain;
    chain.select = returnChain;
    chain.eq = returnChain;
    chain.order = returnChain;
    chain.limit = (n: number) => {
      state.limit = n;
      return chain;
    };
    chain.single = () => Promise.resolve(reply());
    chain.maybeSingle = () => Promise.resolve(reply());
    chain.then = (
      onFulfilled: (v: Reply) => unknown,
      onRejected?: (err: unknown) => unknown
    ) => Promise.resolve(reply()).then(onFulfilled, onRejected);
    return chain;
  };
  return { from: vi.fn(builder) } as unknown as SupabaseClient;
}

describe("SupabaseDashboardProvider", () => {
  it("assembles a RunSnapshot from stubbed rows", async () => {
    const generatedAt = new Date().toISOString();
    const client = makeStubClient({
      runs: {
        data: {
          id: "RUN-3",
          mode: "paper",
          read_only: true,
          started_at: "2026-05-24T08:00:00.000Z",
        },
        error: null,
      },
      latest_strategy_snapshots: {
        data: [
          {
            run_id: "RUN-3",
            strategy: "EMA-v1",
            ts: generatedAt,
            status: "ok",
            open_positions: 1,
            equity_usd: 5620.42,
            day_pnl_usd: 82.4,
            day_pnl_pct: 1.49,
            last_decision_at: generatedAt,
          },
        ],
        error: null,
      },
      latest_position_snapshots: {
        data: [
          {
            id: "pos_btc_1",
            run_id: "RUN-3",
            strategy: "EMA-v1",
            asset: "BTC-USDT",
            ts: generatedAt,
            side: "long",
            qty: 0.084,
            entry_price: 61240.12,
            mark_price: 63105.4,
            notional_usd: 5300.85,
            unrealized_pnl_usd: 156.68,
            unrealized_pnl_pct: 3.05,
            opened_at: "2026-08-19T04:30:00.000Z",
          },
        ],
        error: null,
      },
      trades: { data: [], error: null },
      decisions: { data: [], error: null },
      equity_history: {
        data: [
          {
            run_id: "RUN-3",
            strategy: "AGGREGATE",
            ts: "2026-08-22T00:00:00.000Z",
            equity_usd: 10345.12,
            drawdown_pct: -1.2,
          },
        ],
        error: null,
      },
      system_snapshots: {
        data: {
          id: "sys_1",
          run_id: "RUN-3",
          generated_at: generatedAt,
          overall: "ok",
          last_sync: generatedAt,
          next_processing: generatedAt,
          components: [],
          performance: run3Snapshot.performance,
          comparisons: run3Snapshot.comparisons,
        },
        error: null,
      },
    });

    const provider = new SupabaseDashboardProvider(client);
    const snapshot = await provider.getRunSnapshot("RUN-3");

    expect(snapshot.runId).toBe("RUN-3");
    expect(snapshot.strategies).toHaveLength(1);
    expect(snapshot.positions[0].symbol).toBe("BTC-USDT");
    expect(snapshot.equityCurve).toHaveLength(1);
    expect(snapshot.freshness.level).toBe("fresh");
  });

  it("returns NO_DATA freshness when no system snapshot exists", async () => {
    const client = makeStubClient({
      system_snapshots: { data: null, error: null },
    });
    const provider = new SupabaseDashboardProvider(client);
    const freshness = await provider.getFreshness("RUN-3");
    expect(freshness.level).toBe("no_data");
    expect(freshness.generatedAt).toBeNull();
  });
});
