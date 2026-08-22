import { describe, expect, it } from "vitest";
import {
  DEMO_SUFFIX,
  SeedGuardError,
  assertSeedRunIdAllowed,
} from "@/supabase/seed-guard";

describe("assertSeedRunIdAllowed", () => {
  it("accepts a -DEMO run id", () => {
    expect(() => assertSeedRunIdAllowed("RUN-3-DEMO")).not.toThrow();
    expect(() => assertSeedRunIdAllowed("RUN-42-DEMO")).not.toThrow();
  });

  it("REFUSES to seed real RUN-3", () => {
    expect(() => assertSeedRunIdAllowed("RUN-3")).toThrowError(SeedGuardError);
  });

  it("refuses any run id that doesn't end with -DEMO", () => {
    expect(() => assertSeedRunIdAllowed("RUN-4")).toThrowError(
      new RegExp(`must end with "${DEMO_SUFFIX}"`)
    );
  });

  it("refuses empty / undefined ids", () => {
    expect(() => assertSeedRunIdAllowed(undefined)).toThrow();
    expect(() => assertSeedRunIdAllowed("")).toThrow();
  });
});
