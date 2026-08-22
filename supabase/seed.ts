/**
 * Seed the Supabase observability replica with the RUN-3-DEMO fixture.
 *
 * Usage:
 *   npm run supabase:seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * .env.local (never committed). Never talks to the VPS or the trading lab.
 *
 * The exporter that will eventually push real RUN-3 data into Supabase does
 * NOT exist yet — this script exists so we can prove the full path
 * Supabase → SupabaseDashboardProvider → Next.js end-to-end.
 *
 * IMPORTANT: this script REFUSES to write anywhere but a `-DEMO` run id
 * (see supabase/seed-guard.ts). It must never touch real `RUN-3` rows.
 *
 * Everything upserts, so re-running is idempotent.
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { buildRun3Snapshot } from "../lib/mock/run3-fixtures";
import { assertSeedRunIdAllowed } from "./seed-guard";

loadEnv({ path: ".env.local" });

const RUN_ID = process.env.DASHBOARD_SEED_RUN_ID ?? "RUN-3-DEMO";

try {
  assertSeedRunIdAllowed(RUN_ID);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const snapshotSource = buildRun3Snapshot();
  const snapshot = { ...snapshotSource, runId: RUN_ID };

  console.log(`Seeding ${snapshot.runId} into ${url}`);

  await upsert("runs", "id", [
    {
      id: snapshot.runId,
      mode: snapshot.mode,
      read_only: snapshot.readOnly,
      started_at: snapshot.startedAt,
      stopped_at: null,
      notes: "Seeded from lib/mock/run3-fixtures.ts (RUN-3-DEMO)",
    },
  ]);

  const generatedAt = new Date().toISOString();

  await upsert(
    "strategy_snapshots",
    "run_id,strategy,ts",
    snapshot.strategies.map((s) => ({
      run_id: snapshot.runId,
      strategy: s.name,
      ts: generatedAt,
      status: s.status,
      open_positions: s.openPositions,
      equity_usd: s.equityUsd,
      day_pnl_usd: s.dayPnlUsd,
      day_pnl_pct: s.dayPnlPct,
      last_decision_at: s.lastDecisionAt,
    }))
  );

  await upsert(
    "position_snapshots",
    "run_id,strategy,asset,ts",
    snapshot.positions.map((p) => ({
      id: p.id,
      run_id: snapshot.runId,
      strategy: p.strategy,
      asset: p.symbol,
      ts: generatedAt,
      side: p.side,
      qty: p.qty,
      entry_price: p.entryPrice,
      mark_price: p.markPrice,
      notional_usd: p.notionalUsd,
      unrealized_pnl_usd: p.unrealizedPnlUsd,
      unrealized_pnl_pct: p.unrealizedPnlPct,
      opened_at: p.openedAt,
    }))
  );

  await upsert(
    "trades",
    "source_trade_id",
    snapshot.trades.map((t) => ({
      source_trade_id: t.id,
      run_id: snapshot.runId,
      strategy: t.strategy,
      asset: t.symbol,
      side: t.side,
      qty: t.qty,
      entry_price: t.entryPrice,
      exit_price: t.exitPrice,
      pnl_usd: t.pnlUsd,
      pnl_pct: t.pnlPct,
      fees_usd: t.feesUsd,
      opened_at: t.openedAt,
      closed_at: t.closedAt,
      reason: t.reason,
    }))
  );

  await upsert(
    "decisions",
    "source_decision_id",
    snapshot.decisions.map((d) => ({
      source_decision_id: d.id,
      run_id: snapshot.runId,
      strategy: null,
      // Feature bar, unchanged in meaning by migration 002.
      ts: d.timestamp,
      // When the decision became knowable — what the timeline displays.
      signal_available_at: d.signalAvailableAt,
      asset: d.symbol,
      action: d.action,
      confidence: d.confidence,
      rationale: d.rationale,
      signals: d.signals,
      executed: d.executed,
    }))
  );

  await upsert(
    "equity_history",
    "run_id,strategy,ts",
    snapshot.equityCurve.map((e) => ({
      run_id: snapshot.runId,
      strategy: "AGGREGATE",
      ts: e.timestamp,
      equity_usd: e.equityUsd,
      drawdown_pct: e.drawdownPct,
    }))
  );

  await upsert(
    "system_snapshots",
    "run_id,generated_at",
    [
      {
        run_id: snapshot.runId,
        generated_at: generatedAt,
        overall: snapshot.health.overall,
        // Deprecated by 002; still written for one deploy so a dashboard
        // build older than this migration keeps rendering.
        last_sync: snapshot.health.lastSync,
        last_processing_at: snapshot.health.lastProcessingAt,
        next_processing: snapshot.health.nextProcessing,
        components: snapshot.health.components.map((c) => ({
          name: c.name,
          status: c.status,
          detail: c.detail ?? null,
          latency_ms: c.latencyMs ?? null,
        })),
        performance: snapshot.performance,
        comparisons: snapshot.comparisons,
      },
    ]
  );

  console.log("Seed complete.");
}

async function upsert(
  table: string,
  onConflict: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) {
    console.log(`  ${table}: nothing to upsert`);
    return;
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) {
    console.error(`  ${table}: upsert failed — ${error.message}`);
    process.exit(1);
  }
  console.log(`  ${table}: upserted ${rows.length} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
