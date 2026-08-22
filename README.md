# Crypto Trading Dashboard

Read-only observability UI for the trading lab. **Never** issues commands to
the bot; **never** talks to the VPS directly. Displays either local mock data
(`RUN-3-DEMO` fixture) or the Supabase observability replica.

## Two run ids you must not confuse

| Run id       | Meaning                                                                             | Who writes it                                       |
|--------------|-------------------------------------------------------------------------------------|-----------------------------------------------------|
| `RUN-3-DEMO` | Synthetic seeded / mock development data. Safe to overwrite. Always visible in dev. | `npm run supabase:seed` (local, dev-only)           |
| `RUN-3`      | **Real observability data from Hetzner.** Reserved. This repo NEVER writes to it.   | The future Hetzner exporter (not implemented yet)   |

The seed script refuses to touch `RUN-3` (and anything not ending in `-DEMO`).
See `supabase/seed-guard.ts`.

## Architecture

```
Hetzner SQLite            ← SOURCE OF TRUTH (managed by crypto-trading-lab)
      ↓
future read-only exporter ← NOT IMPLEMENTED IN THIS PHASE
      ↓                     writes to Supabase using the SERVICE ROLE key
Supabase                  ← OBSERVABILITY REPLICA
      ↓                     dashboard reads with the ANON key + RLS (SELECT only)
SupabaseDashboardProvider ← lib/data-source/supabase.ts (server-only)
      ↓
Next.js (App Router)      ← this repo, READ-ONLY VIEW
```

- **Hetzner SQLite** = the trading lab's own database. This dashboard never
  reaches into it and never runs SSH against the VPS.
- **Supabase** = a mirror for observability. It contains no control tables
  (`commands`, `orders_to_execute`, `restart_requests`, `bot_actions`, …) and
  never will.
- **Next.js** = strictly read-only. There are no buttons that can affect
  RUN-3 or the bot. The credential used to reach Supabase (`anon`) has no
  INSERT/UPDATE/DELETE grants and is filtered by RLS.
- The **exporter** that will push data from SQLite into Supabase is planned
  for a later phase. In this phase the schema, provider and seed script all
  exist so we can prove the end-to-end path (`Supabase → provider → UI`)
  without touching the VPS.

## Credential model

Two credentials, two audiences:

| Key                                     | Used by                                        | Capabilities |
|-----------------------------------------|-------------------------------------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Dashboard runtime (`lib/supabase/server.ts`)    | `SELECT` only, filtered by RLS. Public-safe. |
| `SUPABASE_SERVICE_ROLE_KEY`             | `npm run supabase:seed` locally, + future Hetzner exporter | Bypasses RLS. Full write. **Never** deploy to Vercel. |

`createServerSupabaseClient()` reads only the anon key. If the service-role
key is accidentally present on the deployment, a warning is logged and it is
still not used.

RLS is enforced in `supabase/schema.sql`: every table `enable row level
security`, only `for select using (true)` policies exist, and INSERT / UPDATE
/ DELETE / TRUNCATE are revoked from `anon` and `authenticated`.

## Requirements

- **Node.js ≥ 20.9** (Next 16 refuses older). Repo pins **22.21.0** via
  `.nvmrc` and `package.json > engines`. If you use nvm: `nvm use`.

## Getting started

```bash
nvm use                 # reads .nvmrc → 22.21.0
npm install
cp .env.example .env.local        # then edit .env.local
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Copy `.env.example` to `.env.local` (git-ignored).

| Variable                          | Required            | Description |
|-----------------------------------|---------------------|-------------|
| `DASHBOARD_DATA_SOURCE`           | production          | `mock` or `supabase`. Refuses to boot in production if unset — no silent fallback. |
| `DASHBOARD_RUN_ID`                | optional            | Which run to display (default `RUN-3-DEMO`). |
| `NEXT_PUBLIC_SUPABASE_URL`        | if source=supabase  | Supabase project URL. Public-safe. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | if source=supabase  | ANON key. Public-safe, strictly read-only under RLS. |
| `SUPABASE_SERVICE_ROLE_KEY`       | seed / exporter only| Service-role key. **Local & Hetzner only. Never on Vercel.** |
| `DASHBOARD_SEED_RUN_ID`           | optional            | Override for the seed target (must end `-DEMO`). |

### Mock mode

```env
DASHBOARD_DATA_SOURCE=mock
DASHBOARD_RUN_ID=RUN-3-DEMO
```

Boots against `lib/mock/run3-fixtures.ts`. Nothing else to configure.

### Supabase mode

```env
DASHBOARD_DATA_SOURCE=supabase
DASHBOARD_RUN_ID=RUN-3-DEMO           # or RUN-3 once the real exporter runs
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase settings>
```

If any required variable is missing, `getDashboardProvider()` throws a
`DashboardConfigurationError` with a clear message.

## Supabase setup (manual, one-off)

Do these once in your Supabase project. Nothing here is automated by this
repo yet.

1. **Create a Supabase project** (free tier is fine).
2. **Apply the schema.** In Supabase Studio → SQL editor, paste the contents
   of [`supabase/schema.sql`](./supabase/schema.sql) and run it. Safe to
   re-run (all `create ... if not exists`; RLS block uses `drop policy if
   exists` first).
3. **Copy your keys.** Settings → API →
   - `NEXT_PUBLIC_SUPABASE_URL` = the project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `anon` key
   - `SUPABASE_SERVICE_ROLE_KEY` = the `service_role` key (dev use only)
4. **Put them into `.env.local`.** Do not commit this file.
5. **Seed demo data** for the first end-to-end test:
   ```bash
   npm run supabase:seed
   ```
   Writes only under `RUN-3-DEMO`. Idempotent — safe to re-run.

Now:

```env
DASHBOARD_DATA_SOURCE=supabase
DASHBOARD_RUN_ID=RUN-3-DEMO
```

and `npm run dev` — the header should show `SUPABASE · FRESH`.

### Cleaning up an earlier mistaken RUN-3 seed

If a previous version of the seed wrote to `run_id = 'RUN-3'`, use the
step-by-step SQL in [`supabase/cleanup-run3-seed.sql`](./supabase/cleanup-run3-seed.sql).
It previews the counts, deletes inside a transaction, sanity-checks, and
tells you to reseed with the safe `-DEMO` id.

## Schema summary

See `supabase/schema.sql` for the source of truth. Tables:

| Table                 | Purpose                                              | Idempotency key |
|-----------------------|------------------------------------------------------|-----------------|
| `runs`                | Experiment metadata (RUN-3, RUN-4, RUN-3-DEMO, …)    | `id` PK |
| `strategy_snapshots`  | Per-strategy status over time                        | `(run_id, strategy, ts)` |
| `position_snapshots`  | Open positions sampled at a point in time            | `(run_id, strategy, asset, ts)` |
| `equity_history`      | Equity + drawdown per run/strategy (`AGGREGATE` = rollup) | `(run_id, strategy, ts)` |
| `trades`              | Closed trades ledger                                 | `source_trade_id` PK |
| `decisions`           | Agent decision log                                   | `source_decision_id` PK |
| `system_snapshots`    | Health + rolled-up performance/comparisons per publish | `(run_id, generated_at)` |

Two `security_invoker` views keep overview/positions queries cheap while
still respecting RLS on the base tables:

- `latest_strategy_snapshots` — one row per (run, strategy) with the newest ts.
- `latest_position_snapshots` — one row per (run, strategy, asset).

## Data freshness

Freshness is derived from `system_snapshots.generated_at`, **not** from when
Next.js ran the query. This means we cannot show "FRESH" if the exporter has
gone silent, even if the page just loaded.

| Age             | Level    |
|-----------------|----------|
| `< 90s`         | FRESH    |
| `90s – 3min`    | DELAYED  |
| `≥ 3min`        | STALE    |
| no rows         | NO DATA  |

Thresholds live in `lib/domain/freshness.ts`.

## Scripts

```bash
npm run dev              # next dev (Turbopack)
npm run build            # next build --webpack (see note below)
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm run test             # vitest run
npm run test:watch       # vitest
npm run supabase:seed    # upsert RUN-3-DEMO into a real Supabase (needs .env.local)
```

> **Note:** `build` uses `--webpack` intentionally. Next 16's Turbopack build
> currently can't resolve Tailwind v4's native `oxide` binary during CSS
> bundling. Dev mode is unaffected.

## Codebase layout

```
app/
  (dashboard)/            ← route group with shared layout (Server Component)
    layout.tsx            ← fetches snapshot via factory, passes down through client Context
    page.tsx              ← /
    positions/page.tsx
    trades/page.tsx
    decisions/page.tsx
    performance/page.tsx
    compare/page.tsx
    system/page.tsx
  layout.tsx              ← root
  globals.css

lib/
  domain/
    schemas.ts            ← Zod schemas & inferred types
    freshness.ts          ← bucketing logic
  mock/
    run3-fixtures.ts      ← deterministic RUN-3-DEMO fixture + buildRun3Snapshot(now?)
  data-source/            ← SERVER-ONLY data layer
    types.ts              ← DashboardProviderContract interface
    mock.ts               ← MockDashboardProvider (fixture-backed)
    supabase.ts           ← SupabaseDashboardProvider (real DB, anon key + RLS)
    supabase-mappers.ts   ← Zod row schemas + row→domain mappers
    factory.ts            ← getDashboardProvider() (chooses source)
  supabase/
    server.ts             ← createServerSupabaseClient() (anon key, server-only)
  providers/
    DashboardProvider.tsx ← client Context that hands the snapshot to components

components/
  layout/                 ← Sidebar, Header, PageHeader
  ui/                     ← Card, Stat, Badge, StatusDot, FreshnessPill, EmptyState
  charts/                 ← EquityCurveChart, DrawdownChart, PnLBarChart, CompareChart
  tables/                 ← DataTable, PositionsTable, TradesTable, DecisionsTimeline

supabase/
  schema.sql              ← observability replica schema + RLS + policies + grants
  seed.ts                 ← upserts RUN-3-DEMO into Supabase (idempotent, guarded)
  seed-guard.ts           ← refuses non-DEMO run ids
  cleanup-run3-seed.sql   ← one-off SQL to delete a mistaken RUN-3 seed

__tests__/                ← Vitest suites
```

## Guarantees

- The React tree never imports Supabase. All DB access happens in
  `lib/data-source/**` and `lib/supabase/**`, both marked with `server-only`.
- The dashboard uses the ANON key. RLS + revoked grants ensure it can only
  `SELECT`. `INSERT`, `UPDATE`, `DELETE`, `UPSERT`, `TRUNCATE` are impossible.
- The seed script refuses to write anywhere but a `-DEMO` run id and is
  hard-coded to reject `RUN-3` (`supabase/seed-guard.ts`).
- The dashboard **cannot** and **must not** send commands to the trading lab.
  There are no such tables in the schema and no such endpoints in the app.
