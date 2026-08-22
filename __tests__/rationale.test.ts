import { describe, expect, it } from "vitest";
import { isRedundantRationale } from "@/lib/domain/rationale";
import type { Decision } from "@/lib/domain/schemas";

const signals: Decision["signals"] = [
  { name: "close", value: 76978.83 },
  { name: "target", value: 1 },
  { name: "ema50", value: 69629.50970788272 },
  { name: "ema200", value: 65669.30417490489 },
];

describe("isRedundantRationale", () => {
  it("recognises the exporter's derived dump as already-on-screen", () => {
    // Exactly the string RUN-3 renders on every Overview decision card. Each
    // number below it as a chip, the action above it as a badge.
    const derived =
      "derived: ema50=69629.5097 ema200=65669.3042 | close=76978.8300 | target=long | action=open_long";
    expect(isRedundantRationale(derived, signals)).toBe(true);
  });

  it("keeps a rationale written for a person", () => {
    expect(
      isRedundantRationale("ema50 crossed above ema200 on rising volume", signals)
    ).toBe(false);
  });

  it("keeps a derived dump that mentions a key the chips do not carry", () => {
    // `atr` is not a chip, so the sentence carries something the card does
    // not otherwise show. Silence here would delete information.
    const withUnknownKey =
      "derived: ema50=69629.5097 | atr=1204.5 | action=open_long";
    expect(isRedundantRationale(withUnknownKey, signals)).toBe(false);
  });

  it("keeps a dump with prose wrapped around it", () => {
    const mixed =
      "close=76978.8300 but the trend filter vetoed the entry";
    expect(isRedundantRationale(mixed, signals)).toBe(false);
  });

  it("treats an empty rationale as nothing to render", () => {
    expect(isRedundantRationale("   ", signals)).toBe(true);
  });

  it("does not hide prose merely because it has no key=value pairs", () => {
    expect(isRedundantRationale("Held: no signal.", signals)).toBe(false);
  });
});
