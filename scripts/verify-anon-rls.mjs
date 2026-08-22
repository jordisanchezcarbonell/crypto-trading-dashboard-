/**
 * Verify the Supabase observability replica from the perspective of the
 * dashboard's public credential (NEXT_PUBLIC_SUPABASE_ANON_KEY).
 *
 * ANON must be able to:
 *   - SELECT RUN-3-DEMO seed rows (dashboard read path works).
 *
 * ANON must NOT be able to:
 *   - INSERT / UPDATE / DELETE anything.
 *
 * If any of those invariants is broken, this script exits non-zero.
 *
 * ---------------------------------------------------------------------------
 * Credential isolation — read this before changing anything:
 *
 *   1. The script REFUSES to run if the calling shell already exports
 *      SUPABASE_SERVICE_ROLE_KEY. This blocks an accidental "just run with
 *      the powerful key" invocation.
 *
 *   2. The script reads a DEDICATED file, `.env.anon.local`, that MUST
 *      contain EXACTLY two variables:
 *          NEXT_PUBLIC_SUPABASE_URL
 *          NEXT_PUBLIC_SUPABASE_ANON_KEY
 *      Anything else — including SUPABASE_SERVICE_ROLE_KEY — causes an
 *      immediate refusal. This prevents a service-role that happens to
 *      live in `.env.local` from ever entering this script's memory.
 *
 *   3. `.env.local` is NEVER read here. Do not "helpfully" fall back to it.
 *
 *   4. `createClient()` receives exclusively (url, anonKey).
 *
 *   5. Neither the URL nor the anon key nor the service-role key are ever
 *      printed by this script.
 * ---------------------------------------------------------------------------
 *
 * Usage (from the dashboard repo root):
 *   npm run verify:anon-rls
 *
 * Exit code:
 *   0  — every check passed.
 *   1  — configuration/credential problem (nothing was attempted).
 *   2  — a check failed (RLS regression or unexpected error).
 */

import { readFileSync } from "node:fs";
import { parse as parseEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const ANON_ENV_FILE = ".env.anon.local";
const ALLOWED_KEYS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]);

// -- 1. Reject an inherited service-role key from the shell ---------------
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    `REFUSING TO RUN: SUPABASE_SERVICE_ROLE_KEY is set in the inherited shell. ` +
      `This script must verify ANON-only behaviour. Unset the variable in your ` +
      `shell (e.g. \`unset SUPABASE_SERVICE_ROLE_KEY\`) and retry.`
  );
  process.exit(1);
}

// -- 2. Read ONLY the isolated env file; do not touch process.env ---------
let envFile;
try {
  envFile = parseEnv(readFileSync(ANON_ENV_FILE, "utf8"));
} catch (err) {
  console.error(
    `Cannot read ${ANON_ENV_FILE}: ${err.message}\n` +
      `Copy .env.anon.example to ${ANON_ENV_FILE} and fill in the two allowed keys.`
  );
  process.exit(1);
}

// -- 3. Refuse if the file carries any variable we did not allow ---------
const disallowed = Object.keys(envFile).filter((k) => !ALLOWED_KEYS.has(k));
if (disallowed.length > 0) {
  console.error(
    `REFUSING TO RUN: ${ANON_ENV_FILE} contains disallowed variable(s): ` +
      `${disallowed.join(", ")}. Only NEXT_PUBLIC_SUPABASE_URL and ` +
      `NEXT_PUBLIC_SUPABASE_ANON_KEY are permitted in this file. ` +
      `Move any other credential (especially SUPABASE_SERVICE_ROLE_KEY) elsewhere.`
  );
  process.exit(1);
}

const url = envFile.NEXT_PUBLIC_SUPABASE_URL;
const anon = envFile.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error(
    `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in ${ANON_ENV_FILE}`
  );
  process.exit(1);
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// -- helpers --------------------------------------------------------------
const failures = [];
function record(label, ok, detail) {
  console.log(`${ok ? "[OK]  " : "[FAIL]"} ${label}${detail ? " — " + detail : ""}`);
  if (!ok) failures.push(label);
}

/** Only auth/RLS-style errors count as "correctly denied". */
function isDenied(error) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const msg = String(error.message ?? "").toLowerCase();
  return (
    code === "42501" || // insufficient_privilege
    code === "PGRST301" || // PostgREST RLS denial
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("violates row-level")
  );
}

// -- (1) SELECT proves ANON can read the seed ----------------------------
{
  const { data, error, count } = await supabase
    .from("strategy_snapshots")
    .select("run_id", { count: "exact", head: true })
    .eq("run_id", "RUN-3-DEMO");
  const observed = count ?? (data?.length ?? null);
  record(
    "SELECT strategy_snapshots WHERE run_id='RUN-3-DEMO'",
    !error && observed === 2,
    error ? `error=${error.code}` : `count=${observed} (expected 2)`
  );
}

// -- (2) Grab a REAL decision id + rationale we'll try to mutate ---------
let probeId = null;
let probeRationaleBefore = null;
{
  const { data, error } = await supabase
    .from("decisions")
    .select("source_decision_id, rationale")
    .eq("run_id", "RUN-3-DEMO")
    .order("source_decision_id", { ascending: true })
    .limit(1);
  const row = Array.isArray(data) ? data[0] : null;
  probeId = row?.source_decision_id ?? null;
  probeRationaleBefore = row?.rationale ?? null;
  record(
    "SELECT one existing decision for RUN-3-DEMO",
    !error && probeId != null && probeRationaleBefore != null,
    error ? `error=${error.code}` : "probe row acquired"
  );
}

// -- (3) Pre-probe count -------------------------------------------------
let decisionsCountBefore = null;
{
  const { count, error } = await supabase
    .from("decisions")
    .select("run_id", { count: "exact", head: true })
    .eq("run_id", "RUN-3-DEMO");
  decisionsCountBefore = count ?? null;
  record(
    "SELECT count decisions RUN-3-DEMO (pre-probes)",
    !error && decisionsCountBefore === 7,
    error ? `error=${error.code}` : `count=${decisionsCountBefore} (expected 7)`
  );
}

if (probeId == null) {
  console.error("\nCannot proceed: probe row unavailable.");
  process.exit(2);
}

// -- (4) INSERT probe ----------------------------------------------------
{
  const { error } = await supabase.from("decisions").insert({
    source_decision_id: "anon-probe-insert",
    run_id: "RUN-3-DEMO",
    ts: new Date().toISOString(),
    asset: "BTC-USDT",
    action: "hold",
    confidence: null,
    rationale: "probe",
    signals: [],
    executed: false,
  });
  record(
    "INSERT into decisions (anon)",
    isDenied(error),
    error
      ? `denied (code=${error.code ?? "?"})`
      : "UNEXPECTED SUCCESS — no error returned"
  );
}

// -- (5) UPDATE probe against the REAL probe row -------------------------
{
  const { error } = await supabase
    .from("decisions")
    .update({ rationale: "TAMPERED_BY_ANON_PROBE" })
    .eq("source_decision_id", probeId);
  record(
    `UPDATE decisions WHERE source_decision_id='${probeId}' (anon)`,
    isDenied(error),
    error
      ? `denied (code=${error.code ?? "?"})`
      : "UNEXPECTED SUCCESS — no error returned"
  );
}

// -- (6) DELETE probe against the REAL probe row -------------------------
{
  const { error } = await supabase
    .from("decisions")
    .delete()
    .eq("source_decision_id", probeId);
  record(
    `DELETE decisions WHERE source_decision_id='${probeId}' (anon)`,
    isDenied(error),
    error
      ? `denied (code=${error.code ?? "?"})`
      : "UNEXPECTED SUCCESS — no error returned"
  );
}

// -- (7) Post-probe count is still 7 ------------------------------------
{
  const { count, error } = await supabase
    .from("decisions")
    .select("run_id", { count: "exact", head: true })
    .eq("run_id", "RUN-3-DEMO");
  record(
    "SELECT count decisions RUN-3-DEMO (post-probes)",
    !error && count === 7,
    error
      ? `error=${error.code}`
      : `count=${count} (expected 7, before=${decisionsCountBefore})`
  );
}

// -- (8) Probe row rationale byte-identical to pre-probe value ----------
{
  const { data, error } = await supabase
    .from("decisions")
    .select("rationale")
    .eq("source_decision_id", probeId)
    .limit(1);
  const rationaleAfter = Array.isArray(data) ? data[0]?.rationale ?? null : null;
  record(
    `probe row rationale unchanged (source_decision_id='${probeId}')`,
    !error && rationaleAfter === probeRationaleBefore,
    error
      ? `error=${error.code}`
      : rationaleAfter === probeRationaleBefore
        ? "unchanged"
        : "MUTATED — before/after mismatch"
  );
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed — do NOT proceed.`);
  process.exit(2);
}
console.log("\nAll ANON-side checks passed.");
