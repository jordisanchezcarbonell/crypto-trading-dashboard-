import "server-only";

import { MockDashboardProvider } from "./mock";
import { SupabaseDashboardProvider } from "./supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DashboardConfigurationError,
  type DashboardProviderContract,
} from "./types";

/**
 * Default run displayed by the dashboard when `DASHBOARD_RUN_ID` is unset.
 *
 * We default to the demo id so a fresh clone with mock data never mislabels
 * itself as real RUN-3. Point at real "RUN-3" only when the Hetzner exporter
 * is actually publishing to Supabase.
 */
export const DEFAULT_RUN_ID = "RUN-3-DEMO";

/**
 * Selects the dashboard data source based on `DASHBOARD_DATA_SOURCE`.
 *
 * Rules:
 *   - `mock` (or missing in development): return `MockDashboardProvider`.
 *   - `supabase`: return `SupabaseDashboardProvider` — throw loudly if any
 *     Supabase env var is missing. NEVER silently fall back to mock, because
 *     a stale RUN-3 fixture would look identical to real data in the UI.
 *
 * Callable safely from Server Components, Route Handlers, and scripts.
 */
export function getDashboardProvider(): DashboardProviderContract {
  const raw = process.env.DASHBOARD_DATA_SOURCE;
  const source = normaliseSource(raw);

  switch (source) {
    case "mock":
      return new MockDashboardProvider();

    case "supabase": {
      // createServerSupabaseClient throws a DashboardConfigurationError with a
      // clear message if url/key are missing — we let that propagate so it
      // shows up in server logs and the error boundary, not as a silent mock.
      const client = createServerSupabaseClient();
      return new SupabaseDashboardProvider(client);
    }

    default: {
      // Exhaustive check for future maintainers.
      const _exhaustive: never = source;
      throw new DashboardConfigurationError(
        `Unknown DASHBOARD_DATA_SOURCE=${_exhaustive}. Expected "mock" or "supabase".`
      );
    }
  }
}

function normaliseSource(raw: string | undefined): "mock" | "supabase" {
  if (raw === undefined || raw === "") {
    if (process.env.NODE_ENV === "production") {
      throw new DashboardConfigurationError(
        "DASHBOARD_DATA_SOURCE is not set. Set it explicitly to `mock` or `supabase` in production so we never accidentally serve the fixture as real data."
      );
    }
    return "mock";
  }
  if (raw === "mock" || raw === "supabase") return raw;
  throw new DashboardConfigurationError(
    `Invalid DASHBOARD_DATA_SOURCE="${raw}". Expected "mock" or "supabase".`
  );
}
