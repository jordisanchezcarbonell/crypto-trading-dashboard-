import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = [
  "DASHBOARD_DATA_SOURCE",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NODE_ENV",
] as const;

type EnvSnapshot = Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

function snapshotEnv(): EnvSnapshot {
  const s: EnvSnapshot = {};
  for (const k of ENV_KEYS) s[k] = process.env[k];
  return s;
}
function restoreEnv(s: EnvSnapshot) {
  for (const k of ENV_KEYS) {
    if (k === "NODE_ENV") {
      setNodeEnv(s[k]);
      continue;
    }
    if (s[k] === undefined) delete process.env[k];
    else process.env[k] = s[k];
  }
}

// process.env.NODE_ENV is typed as readonly by @types/node.
// This helper mutates it through an assertion so tests can flip environments.
function setNodeEnv(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

// Reset module registry between tests so `server-only` re-evaluates and the
// Supabase server client cache does not leak state.
async function importFactory() {
  vi.resetModules();
  return await import("@/lib/data-source/factory");
}

describe("getDashboardProvider", () => {
  let saved: EnvSnapshot;

  beforeEach(() => {
    saved = snapshotEnv();
  });
  afterEach(() => {
    restoreEnv(saved);
  });

  it("returns MockDashboardProvider when DASHBOARD_DATA_SOURCE=mock", async () => {
    process.env.DASHBOARD_DATA_SOURCE = "mock";
    const { getDashboardProvider } = await importFactory();
    const provider = getDashboardProvider();
    expect(provider.source).toBe("mock");
  });

  it("defaults to mock in development when unset", async () => {
    delete process.env.DASHBOARD_DATA_SOURCE;
    setNodeEnv("development");
    const { getDashboardProvider } = await importFactory();
    expect(getDashboardProvider().source).toBe("mock");
  });

  it("REFUSES to silently fall back to mock in production", async () => {
    delete process.env.DASHBOARD_DATA_SOURCE;
    setNodeEnv("production");
    const { getDashboardProvider } = await importFactory();
    expect(() => getDashboardProvider()).toThrow(
      /DASHBOARD_DATA_SOURCE is not set/
    );
  });

  it("throws a clear error when supabase is selected without credentials", async () => {
    process.env.DASHBOARD_DATA_SOURCE = "supabase";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getDashboardProvider } = await importFactory();
    expect(() => getDashboardProvider()).toThrow(
      /Supabase is not configured/
    );
  });

  it("does not accept SUPABASE_SERVICE_ROLE_KEY as a substitute for the anon key", async () => {
    process.env.DASHBOARD_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role";
    const { getDashboardProvider } = await importFactory();
    expect(() => getDashboardProvider()).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/
    );
  });

  it("throws on an unknown DASHBOARD_DATA_SOURCE value", async () => {
    process.env.DASHBOARD_DATA_SOURCE = "kafka";
    const { getDashboardProvider } = await importFactory();
    expect(() => getDashboardProvider()).toThrow(
      /Invalid DASHBOARD_DATA_SOURCE="kafka"/
    );
  });

  it("returns a supabase provider when url + anon key are present", async () => {
    process.env.DASHBOARD_DATA_SOURCE = "supabase";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { getDashboardProvider } = await importFactory();
    const provider = getDashboardProvider();
    expect(provider.source).toBe("supabase");
  });
});
