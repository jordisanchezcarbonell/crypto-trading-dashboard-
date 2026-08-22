-- ---------------------------------------------------------------------------
-- 001 · make unavailable observability values NULL-able
--
-- Rationale (see also lib/domain/schemas.ts):
--   NULL == "unknown / not enough data yet"
--   0    == "computed and the real answer is zero"
--
-- Before this migration:
--   * decisions.confidence     was NOT NULL — but EMA-v1 and EMA-v2-risk are
--                              deterministic and cannot report a probability.
--   * position_snapshots.mark_price / entry_price were NOT NULL — but the
--                              SQLite ledger does not carry a live mark and
--                              may briefly lack an entry_price at first fill.
--
-- Performance sub-metrics (sharpe/sortino/cagr/…) live inside the
-- `system_snapshots.performance` JSONB column, which has no per-key NOT NULL
-- constraint. Only the Zod schemas needed relaxing for those. Nothing to
-- ALTER here for performance metrics.
--
-- Idempotency: PostgreSQL raises no error when DROP NOT NULL is issued on a
-- column that is already nullable, so this migration is safe to re-apply.
-- ---------------------------------------------------------------------------

ALTER TABLE decisions
    ALTER COLUMN confidence DROP NOT NULL;

ALTER TABLE position_snapshots
    ALTER COLUMN mark_price  DROP NOT NULL,
    ALTER COLUMN entry_price DROP NOT NULL;

ALTER TABLE strategy_snapshots
    ALTER COLUMN day_pnl_usd DROP NOT NULL,
    ALTER COLUMN day_pnl_pct DROP NOT NULL;

-- Sanity check — every row still parses. `pg_catalog.pg_attribute.attnotnull`
-- must be `false` (i.e. nullable) for the columns we just touched. Uncomment
-- and run interactively if you want to verify:
--
--     SELECT attname, attnotnull
--       FROM pg_attribute
--      WHERE attrelid = 'public.decisions'::regclass
--        AND attname = 'confidence';
--
--     SELECT attname, attnotnull
--       FROM pg_attribute
--      WHERE attrelid = 'public.position_snapshots'::regclass
--        AND attname IN ('mark_price', 'entry_price');
--
--     SELECT attname, attnotnull
--       FROM pg_attribute
--      WHERE attrelid = 'public.strategy_snapshots'::regclass
--        AND attname IN ('day_pnl_usd', 'day_pnl_pct');
