-- ROLE key, which bypasses RLS by design. That key must NEVER be present in
-- the dashboard's runtime environment (Vercel, local `next dev`, etc.).
-- ---------------------------------------------------------------------------
--
-- Table definitions live in the initial Supabase migration bootstrap (not
-- checked into this repo). Follow-on schema evolutions live under
-- `supabase/migrations/`. Currently applied migrations:
--
--   001_nullable_metrics.sql — decisions.confidence,
--                              position_snapshots.mark_price / entry_price,
--                              strategy_snapshots.day_pnl_usd / day_pnl_pct
--                              become NULL-able so the exporter can emit
--                              "unknown" without fabricating zeros.
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
