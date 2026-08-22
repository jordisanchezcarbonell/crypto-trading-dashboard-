-- Crypto Trading Dashboard — Supabase schema (structure only, not yet applied).
-- Mirrors the Zod domain in `lib/domain/schemas.ts`.

create extension if not exists "uuid-ossp";

-- Runs: one row per experiment / deployment (RUN-3, RUN-4, ...).
create table if not exists runs (
    id            text primary key,                    -- e.g. "RUN-3"
    mode          text not null check (mode in ('paper', 'live', 'read-only')),
    read_only     boolean not null default true,
    started_at    timestamptz not null,
    stopped_at    timestamptz,
    notes         text
);

-- Open positions snapshot per run.
create table if not exists positions (
    id                    text primary key,
    run_id                text not null references runs(id) on delete cascade,
    symbol                text not null,
    side                  text not null check (side in ('long', 'short')),
    qty                   numeric not null,
    entry_price           numeric not null check (entry_price >= 0),
    mark_price            numeric not null check (mark_price >= 0),
    notional_usd          numeric not null,
    unrealized_pnl_usd    numeric not null,
    unrealized_pnl_pct    numeric not null,
    opened_at             timestamptz not null,
    strategy              text not null,
    updated_at            timestamptz not null default now()
);
create index if not exists positions_run_idx on positions (run_id);

-- Closed trades ledger.
create table if not exists closed_trades (
    id            text primary key,
    run_id        text not null references runs(id) on delete cascade,
    symbol        text not null,
    side          text not null check (side in ('long', 'short')),
    qty           numeric not null,
    entry_price   numeric not null check (entry_price >= 0),
    exit_price    numeric not null check (exit_price >= 0),
    pnl_usd       numeric not null,
    pnl_pct       numeric not null,
    fees_usd      numeric not null check (fees_usd >= 0),
    opened_at     timestamptz not null,
    closed_at     timestamptz not null,
    strategy      text not null,
    reason        text not null
);
create index if not exists closed_trades_run_idx on closed_trades (run_id, closed_at desc);

-- Agent decisions (executed or not).
create table if not exists decisions (
    id            text primary key,
    run_id        text not null references runs(id) on delete cascade,
    ts            timestamptz not null,
    symbol        text not null,
    action        text not null check (action in ('open_long','open_short','close','hold','scale_in','scale_out','skip')),
    confidence    numeric not null check (confidence between 0 and 1),
    rationale     text not null,
    signals       jsonb not null default '[]'::jsonb,
    executed      boolean not null default false
);
create index if not exists decisions_run_ts_idx on decisions (run_id, ts desc);

-- Time series of equity + rolling drawdown.
create table if not exists equity_points (
    run_id         text not null references runs(id) on delete cascade,
    ts             timestamptz not null,
    equity_usd     numeric not null check (equity_usd >= 0),
    drawdown_pct   numeric not null check (drawdown_pct <= 0),
    primary key (run_id, ts)
);

-- Rolling health snapshots.
create table if not exists health_snapshots (
    id                text primary key default uuid_generate_v4(),
    run_id            text not null references runs(id) on delete cascade,
    overall           text not null check (overall in ('ok','degraded','down')),
    last_sync         timestamptz not null,
    next_processing   timestamptz not null,
    components        jsonb not null default '[]'::jsonb,
    recorded_at       timestamptz not null default now()
);
create index if not exists health_run_recorded_idx on health_snapshots (run_id, recorded_at desc);

-- Row Level Security placeholder: enable on all tables and grant read-only
-- to the `anon` role via policy so the dashboard can use anon keys safely.
-- (Left commented until we decide auth model.)
--
-- alter table runs enable row level security;
-- create policy "read runs" on runs for select using (true);
-- ... etc.
