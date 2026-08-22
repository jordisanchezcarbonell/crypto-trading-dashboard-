-- ---------------------------------------------------------------------------
-- 002 · make the observability timestamps causally honest
--
-- Two independent defects, one root cause: the replica conflated "when the
-- feature bar is stamped" with "when the fact became knowable", and had no
-- way to say "I don't know" — so it filled the gap with `now()`.
--
-- -------------------------------------------------------------------------
-- (a) decisions.signal_available_at
-- -------------------------------------------------------------------------
-- `decisions.ts` is, and REMAINS, the feature-bar timestamp: the exporter
-- fills it from SQLite's `decisions.feature_bar_timestamp` (see the lab's
-- exporter/mapper.py::_map_decision). Its semantics are NOT changed here —
-- `ts` means the same thing before and after this migration. Note that `ts`
-- is deliberately NOT part of any key: the primary key is
-- `source_decision_id` alone, the exporter's stable id is
-- `{run_id}:{strategy}:decision:{sqlite_id}`, and the incremental watermark
-- scans `decisions.id`. Nothing identifies a decision by its timestamp, so
-- this column is purely additive and cannot disturb upserts or dedup.
--
-- What was wrong is that the dashboard timeline ordered and rendered
-- decisions by `ts`, which reads to a human as "when the agent decided".
-- With 4h bars a decision stamped 08:00 could not be known until the bar
-- closed at 12:00. Showing 08:00 claims foresight the strategy never had.
--
-- `signal_available_at` is the instant the decision became causally
-- knowable. It is already persisted in the lab's SQLite ledger
-- (`decisions.signal_available_at TEXT NOT NULL`) and already read by the
-- exporter — it was simply dropped on the floor by the mapper. No change to
-- SQLite or to V1/V2 strategy code is required to populate it.
--
-- NULL-able on purpose: rows exported before this migration have no value
-- and we refuse to back-fill a guess. The UI falls back to `ts` and says so.
--
-- -------------------------------------------------------------------------
-- (b) system_snapshots.last_processing_at + honest next_processing
-- -------------------------------------------------------------------------
-- `last_sync` was never the exporter's sync time: the exporter fills it from
-- `StrategyDashboard.last_processed`, i.e. the last feature bar the runner
-- processed. The dashboard rendered it as "Last sync", so with 4h bars the
-- header read "3 hours ago" even when the exporter had run seconds earlier.
-- True exporter freshness is, and always was, `generated_at`.
--
-- So `last_sync` is renamed in meaning, not recomputed: the value moves to
-- the honestly-named `last_processing_at`, and `last_sync` becomes legacy —
-- still written for one deploy so old dashboard builds keep working, then
-- droppable.
--
-- NEXT PROCESSING is deliberately NOT rolled forward:
--
--     next_processing = last_processing_at + timeframe
--
-- and nothing else. If that instant is already in the past, the dashboard
-- must render it as overdue, because a next_processing in the past is
-- exactly the signal that the runner missed a bar. Advancing it by whole
-- timeframes until it lands in the future would turn a missed execution
-- into a normal-looking countdown — the dashboard would hide the very
-- failure it exists to surface.
--
-- No `timeframe_seconds` column is added. It is not needed:
--   * "is it overdue?" is `now() > next_processing` — timeframe irrelevant;
--   * the timeframe itself, if ever displayed, is exactly
--     `next_processing - last_processing_at`.
-- Adding it would be a third source of truth for a value already implied by
-- the other two, and the first thing to drift out of sync.
--
-- -------------------------------------------------------------------------
-- (c) the DROP NOT NULLs are what make (b) possible
-- -------------------------------------------------------------------------
-- The exporter derives these from per-sleeve state and cannot always agree:
-- when BTC and ETH sleeves sit on different bars the lab reports "DIVERGED",
-- and the exporter had no way to express that against NOT NULL columns — so
-- it substituted `generated_at` (= now), which renders as "processing due
-- right now" and silently masks the divergence.
--
-- Same rule as 001: NULL == "unknown", never a fabricated stand-in.
--
-- Idempotency: ADD COLUMN IF NOT EXISTS and DROP NOT NULL on an already
-- nullable column are both no-ops, so this migration is safe to re-apply.
-- ---------------------------------------------------------------------------

ALTER TABLE decisions
    ADD COLUMN IF NOT EXISTS signal_available_at timestamptz;

COMMENT ON COLUMN decisions.ts IS
    'Feature-bar timestamp (SQLite decisions.feature_bar_timestamp). Identifies '
    'the candle the features were computed from. NOT when the decision became '
    'knowable — use signal_available_at for that. Not part of any key.';

COMMENT ON COLUMN decisions.signal_available_at IS
    'Instant the decision became causally knowable (SQLite '
    'decisions.signal_available_at). This is what a decision timeline must '
    'order and display by. NULL for rows exported before migration 002.';

ALTER TABLE system_snapshots
    ADD COLUMN IF NOT EXISTS last_processing_at timestamptz;

ALTER TABLE system_snapshots
    ALTER COLUMN next_processing DROP NOT NULL,
    ALTER COLUMN last_sync       DROP NOT NULL;

COMMENT ON COLUMN system_snapshots.last_processing_at IS
    'Last feature bar the runner actually processed. NULL when the exporter '
    'cannot determine a single value (e.g. sleeves DIVERGED) — never a guess.';

COMMENT ON COLUMN system_snapshots.next_processing IS
    'last_processing_at + timeframe. NEVER rolled forward past now(): a value '
    'in the past means the runner is overdue and the dashboard must show it '
    'as such. NULL when unknown.';

COMMENT ON COLUMN system_snapshots.last_sync IS
    'DEPRECATED (migration 002) — despite the name this never held the '
    'exporter sync time; it held the last processed bar, now carried by '
    'last_processing_at. Exporter freshness is generated_at. Kept NULL-able '
    'for one deploy so older dashboard builds keep parsing; drop afterwards.';

-- Verify interactively if you want:
--
--     SELECT attname, attnotnull
--       FROM pg_attribute
--      WHERE attrelid = 'public.system_snapshots'::regclass
--        AND attname IN ('last_sync', 'next_processing', 'last_processing_at');
