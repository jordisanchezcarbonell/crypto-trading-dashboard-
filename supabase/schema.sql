-- ============================================================================
-- Crypto Trading Dashboard — Supabase schema (OBSERVABILITY REPLICA)
--
-- Source of truth: Hetzner SQLite (trading lab). This database is a
-- read-only mirror populated by a future exporter. No control commands live
-- here — no `commands`, `orders`, `restart_requests` tables ever.
--
-- All timestamps are `timestamptz` and MUST be stored in UTC.
-- Every ingest table has an idempotent unique key so the exporter can
-- re-publish the same window without creating duplicates.
--
-- Apply with: `psql "$DATABASE_URL" -f supabase/schema.sql`
--        or:  Supabase Studio → SQL editor → paste and run.
-- Safe to re-run: everything uses `create ... if not exists` or replaces.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- runs — one row per experiment (RUN-3, RUN-4, ...).
-- ---------------------------------------------------------------------------
create table if not exists runs (
    id          text primary key,
    mode        text not null check (mode in ('paper', 'live', 'read-only')),
    read_only   boolean not null default true,
    started_at  timestamptz not null,
    stopped_at  timestamptz,
    notes       text
);

-- ---------------------------------------------------------------------------
-- strategy_snapshots — status per strategy over time (EMA-v1, EMA-v2-risk, …).
-- Unique on (run_id, strategy, ts) so the exporter can upsert on the same
-- window and never duplicate rows.
-- ---------------------------------------------------------------------------
create table if not exists strategy_snapshots (
    run_id            text not null references runs(id) on delete cascade,
    strategy          text not null,
    ts                timestamptz not null,
    status            text not null check (status in ('ok','degraded','down')),
    open_positions    integer not null check (open_positions >= 0),
    equity_usd        numeric not null check (equity_usd >= 0),
    day_pnl_usd       numeric not null,
    day_pnl_pct       numeric not null,
    last_decision_at  timestamptz not null,
    constraint strategy_snapshots_pk primary key (run_id, strategy, ts)
);
create index if not exists strategy_snapshots_run_ts_idx
    on strategy_snapshots (run_id, ts desc);

-- ---------------------------------------------------------------------------
-- position_snapshots — one open position sampled at a point in time.
-- Unique on (run_id, strategy, asset, ts).
-- ---------------------------------------------------------------------------
create table if not exists position_snapshots (
    id                    text not null,
    run_id                text not null references runs(id) on delete cascade,
    strategy              text not null,
    asset                 text not null,
    ts                    timestamptz not null,
    side                  text not null check (side in ('long','short')),
    qty                   numeric not null,
    entry_price           numeric not null check (entry_price >= 0),
    mark_price            numeric not null check (mark_price >= 0),
    notional_usd          numeric not null,
    unrealized_pnl_usd    numeric not null,
    unrealized_pnl_pct    numeric not null,
    opened_at             timestamptz not null,
    constraint position_snapshots_pk primary key (run_id, strategy, asset, ts)
);
create index if not exists position_snapshots_run_ts_idx
    on position_snapshots (run_id, ts desc);
create index if not exists position_snapshots_asset_idx
    on position_snapshots (asset);

-- ---------------------------------------------------------------------------
-- equity_history — daily (or per-tick) equity + drawdown for a run/strategy.
-- Use strategy = 'AGGREGATE' for the run-level rollup.
-- ---------------------------------------------------------------------------
create table if not exists equity_history (
    run_id        text not null references runs(id) on delete cascade,
    strategy      text not null,
    ts            timestamptz not null,
    equity_usd    numeric not null check (equity_usd >= 0),
    drawdown_pct  numeric not null check (drawdown_pct <= 0),
    constraint equity_history_pk primary key (run_id, strategy, ts)
);
create index if not exists equity_history_run_strategy_ts_idx
    on equity_history (run_id, strategy, ts desc);

-- ---------------------------------------------------------------------------
-- trades — closed trades ledger.
-- Primary key is `source_trade_id` (stable id emitted by the trading lab), so
-- the exporter can safely upsert repeated windows without duplicates.
-- ---------------------------------------------------------------------------
create table if not exists trades (
    source_trade_id  text primary key,
    run_id           text not null references runs(id) on delete cascade,
    strategy         text not null,
    asset            text not null,
    side             text not null check (side in ('long','short')),
    qty              numeric not null,
    entry_price      numeric not null check (entry_price >= 0),
    exit_price       numeric not null check (exit_price >= 0),
    pnl_usd          numeric not null,
    pnl_pct          numeric not null,
    fees_usd         numeric not null check (fees_usd >= 0),
    opened_at        timestamptz not null,
    closed_at        timestamptz not null,
    reason           text not null
);
create index if not exists trades_run_closed_idx
    on trades (run_id, closed_at desc);
create index if not exists trades_run_strategy_idx
    on trades (run_id, strategy);
create index if not exists trades_run_asset_idx
    on trades (run_id, asset);

-- ---------------------------------------------------------------------------
-- decisions — agent decision log (executed or not).
-- Primary key is `source_decision_id` for the same idempotency reason.
-- ---------------------------------------------------------------------------
create table if not exists decisions (
    source_decision_id  text primary key,
    run_id              text not null references runs(id) on delete cascade,
    strategy            text,
    ts                  timestamptz not null,
    asset               text not null,
    action              text not null check (
        action in ('open_long','open_short','close','hold','scale_in','scale_out','skip')
    ),
    confidence          numeric not null check (confidence between 0 and 1),
    rationale           text not null,
    signals             jsonb not null default '[]'::jsonb,
    executed            boolean not null default false
);
create index if not exists decisions_run_ts_idx
    on decisions (run_id, ts desc);
create index if not exists decisions_run_asset_idx
    on decisions (run_id, asset);

-- ---------------------------------------------------------------------------
-- system_snapshots — health + rolled-up performance/comparisons per publish.
-- `generated_at` is the exporter clock; the dashboard uses it to compute
-- freshness (< 90s FRESH, < 3min DELAYED, ≥ 3min STALE, missing = NO_DATA).
-- Unique on (run_id, generated_at).
-- ---------------------------------------------------------------------------
create table if not exists system_snapshots (
    id                text primary key default uuid_generate_v4()::text,
    run_id            text not null references runs(id) on delete cascade,
    generated_at      timestamptz not null,
    overall           text not null check (overall in ('ok','degraded','down')),
    last_sync         timestamptz not null,
    next_processing   timestamptz not null,
    components        jsonb not null default '[]'::jsonb,
    performance       jsonb,
    comparisons       jsonb,
    constraint system_snapshots_unique unique (run_id, generated_at)
);
create index if not exists system_snapshots_run_generated_idx
    on system_snapshots (run_id, generated_at desc);

-- ---------------------------------------------------------------------------
-- Convenience views: "latest per group" so overview/positions pages don't
-- scan the whole snapshot history to render.
--
-- `security_invoker = true` (Postgres 15+) makes the view run with the
-- caller's role, so RLS on the underlying tables still applies when the
-- dashboard queries the view through the anon key.
-- ---------------------------------------------------------------------------
create or replace view latest_strategy_snapshots
with (security_invoker = true) as
select distinct on (run_id, strategy) *
from strategy_snapshots
order by run_id, strategy, ts desc;

create or replace view latest_position_snapshots
with (security_invoker = true) as
select distinct on (run_id, strategy, asset) *
from position_snapshots
order by run_id, strategy, asset, ts desc;

-- ---------------------------------------------------------------------------
-- Row Level Security — READ-ONLY dashboard model.
--
-- The dashboard connects with the Supabase ANON key. Every table below:
--   1. enables RLS,
--   2. exposes a single `for select using (true)` policy so anon can read,
--   3. has INSERT/UPDATE/DELETE/TRUNCATE privileges revoked from anon so a
--      bug or a hijacked key cannot mutate data.
--
-- The seed script and the future Hetzner exporter connect with the SERVICE
-- ROLE key, which bypasses RLS by design. That key must NEVER be present in
-- the dashboard's runtime environment (Vercel, local `next dev`, etc.).
-- ---------------------------------------------------------------------------

alter table runs                enable row level security;
alter table strategy_snapshots  enable row level security;
alter table position_snapshots  enable row level security;
alter table equity_history      enable row level security;
alter table trades              enable row level security;
alter table decisions           enable row level security;
alter table system_snapshots    enable row level security;

drop policy if exists "dashboard read runs"                on runs;
drop policy if exists "dashboard read strategy_snapshots"  on strategy_snapshots;
drop policy if exists "dashboard read position_snapshots"  on position_snapshots;
drop policy if exists "dashboard read equity_history"      on equity_history;
drop policy if exists "dashboard read trades"              on trades;
drop policy if exists "dashboard read decisions"           on decisions;
drop policy if exists "dashboard read system_snapshots"    on system_snapshots;

create policy "dashboard read runs"
    on runs for select to anon, authenticated using (true);
create policy "dashboard read strategy_snapshots"
    on strategy_snapshots for select to anon, authenticated using (true);
create policy "dashboard read position_snapshots"
    on position_snapshots for select to anon, authenticated using (true);
create policy "dashboard read equity_history"
    on equity_history for select to anon, authenticated using (true);
create policy "dashboard read trades"
    on trades for select to anon, authenticated using (true);
create policy "dashboard read decisions"
    on decisions for select to anon, authenticated using (true);
create policy "dashboard read system_snapshots"
    on system_snapshots for select to anon, authenticated using (true);

-- Belt-and-braces GRANTs: RLS filters rows, GRANTs decide which verbs are
-- possible at all. Take away every write verb from the read-only roles.
grant usage on schema public to anon, authenticated;
grant select on
    runs, strategy_snapshots, position_snapshots, equity_history,
    trades, decisions, system_snapshots,
    latest_strategy_snapshots, latest_position_snapshots
    to anon, authenticated;
revoke insert, update, delete, truncate on
    runs, strategy_snapshots, position_snapshots, equity_history,
    trades, decisions, system_snapshots
    from anon, authenticated;

-- Future tables in `public` should also default to read-only for anon.
alter default privileges in schema public
    grant select on tables to anon, authenticated;

-- ---------------------------------------------------------------------------
-- IMPORTANT: never introduce tables like `commands`, `orders_to_execute`,
-- `restart_requests`, `bot_actions`. Supabase is a read-only observability
-- replica; the trading lab must not accept control from it.
-- ---------------------------------------------------------------------------
