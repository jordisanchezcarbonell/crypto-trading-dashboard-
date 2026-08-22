/**
 * Guardrails for the seed script.
 *
 * The seed script MUST NOT write to `RUN-3` (or any other real run id). Real
 * observability data is owned by the future Hetzner exporter; if the seed
 * were to touch it we would silently overwrite production rows with mock
 * numbers.
 *
 * Convention enforced here: seed-writable run ids MUST end in `-DEMO`.
 */
export const DEMO_SUFFIX = "-DEMO";
export const RESERVED_RUN_IDS = new Set(["RUN-3"]);

export class SeedGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedGuardError";
  }
}

export function assertSeedRunIdAllowed(runId: string | undefined): asserts runId is string {
  if (!runId) {
    throw new SeedGuardError(
      "DASHBOARD_SEED_RUN_ID (or the default) is empty."
    );
  }
  if (RESERVED_RUN_IDS.has(runId)) {
    throw new SeedGuardError(
      `Refusing to seed run_id="${runId}" — reserved for real observability data from the Hetzner exporter. Use a "-DEMO" id instead.`
    );
  }
  if (!runId.endsWith(DEMO_SUFFIX)) {
    throw new SeedGuardError(
      `Refusing to seed run_id="${runId}" — must end with "${DEMO_SUFFIX}" to prevent overwriting real run data.`
    );
  }
}
