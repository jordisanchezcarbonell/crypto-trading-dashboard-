import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DashboardConfigurationError } from "@/lib/data-source/types";

let cached: SupabaseClient | null = null;

/**
 * Build (or reuse) the Supabase client the dashboard uses to READ the
 * observability replica.
 *
 * Uses the ANON key on purpose:
 *   - Every table has RLS enabled and only exposes `SELECT` policies
 *     (see supabase/schema.sql). The dashboard therefore CANNOT insert,
 *     update, delete or upsert — even if a bug tried to.
 *   - The service-role key must NEVER reach this codepath. It is only used
 *     by the local seed script and (in the future) the Hetzner exporter.
 *
 * Still marked `server-only` for defence in depth: even though the anon key
 * is safe to ship to browsers, we never need it there and keeping it
 * server-side avoids leaking the query surface into the client bundle.
 */
export function createServerSupabaseClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new DashboardConfigurationError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or run in mock mode (DASHBOARD_DATA_SOURCE=mock). Do NOT use SUPABASE_SERVICE_ROLE_KEY here — that key is reserved for the seed script and the future exporter."
    );
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Loud warning, not a throw: some hosts may inject it for other tools.
    // We just want to be sure the dashboard never picks it up.
    console.warn(
      "[dashboard] SUPABASE_SERVICE_ROLE_KEY is present in the environment. The dashboard is not using it — reads go through the anon key + RLS. Make sure this key is NOT set on the deployment target."
    );
  }

  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
    global: {
      headers: { "x-dashboard-role": "observability-read-only" },
    },
  });
  return cached;
}
