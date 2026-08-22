-- ============================================================================
-- ONE-OFF CLEANUP: remove the mock rows that were mistakenly seeded under
-- run_id = 'RUN-3'. Going forward, all seed writes use 'RUN-3-DEMO' and the
-- seed script refuses any id that doesn't end in '-DEMO'.
--
-- Read this whole file first. Run each block in the Supabase SQL editor.
-- DO NOT run this against a Supabase that already holds real RUN-3 data
-- from the Hetzner exporter — this file assumes RUN-3 in Supabase is 100%
-- the mock seed you'd like to erase.
-- ============================================================================


-- 1. PREVIEW: what would be deleted? Run this first. Numbers should match
--    the seed script output (1 / 2 / 3 / 91 / 20 / 7 / 1).
select 'runs'                as table, count(*) as rows_matching_RUN_3
    from runs                where id     = 'RUN-3'
union all select 'strategy_snapshots', count(*)
    from strategy_snapshots  where run_id = 'RUN-3'
union all select 'position_snapshots', count(*)
    from position_snapshots  where run_id = 'RUN-3'
union all select 'equity_history',     count(*)
    from equity_history      where run_id = 'RUN-3'
union all select 'trades',             count(*)
    from trades              where run_id = 'RUN-3'
union all select 'decisions',          count(*)
    from decisions           where run_id = 'RUN-3'
union all select 'system_snapshots',   count(*)
    from system_snapshots    where run_id = 'RUN-3';


-- 2. DELETE (transactional; either the whole thing lands or nothing does).
--    Child tables first, parent last — matches the FK graph even though
--    every FK has `on delete cascade`, so this stays safe if you later add
--    a table without cascades.
begin;

delete from system_snapshots    where run_id = 'RUN-3';
delete from decisions           where run_id = 'RUN-3';
delete from trades              where run_id = 'RUN-3';
delete from equity_history      where run_id = 'RUN-3';
delete from position_snapshots  where run_id = 'RUN-3';
delete from strategy_snapshots  where run_id = 'RUN-3';
delete from runs                where id     = 'RUN-3';

-- Sanity check inside the transaction. All zeros ⇒ safe to commit.
select 'runs'                as table, count(*) as remaining
    from runs                where id     = 'RUN-3'
union all select 'strategy_snapshots', count(*)
    from strategy_snapshots  where run_id = 'RUN-3'
union all select 'position_snapshots', count(*)
    from position_snapshots  where run_id = 'RUN-3'
union all select 'equity_history',     count(*)
    from equity_history      where run_id = 'RUN-3'
union all select 'trades',             count(*)
    from trades              where run_id = 'RUN-3'
union all select 'decisions',          count(*)
    from decisions           where run_id = 'RUN-3'
union all select 'system_snapshots',   count(*)
    from system_snapshots    where run_id = 'RUN-3';

-- Only run this line once the counts above are all zero.
commit;
-- If anything looked wrong, run: rollback;


-- 3. RESEED with the safe demo id.
--    From your terminal (NOT in Supabase Studio):
--      npm run supabase:seed
--    It will write everything under 'RUN-3-DEMO' and refuse 'RUN-3'.
