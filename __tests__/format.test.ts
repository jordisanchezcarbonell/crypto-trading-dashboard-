import { describe, expect, it } from "vitest";
import {
  UNAVAILABLE,
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatOptionalUsd,
  formatPct,
  formatQty,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  pnlToneClass,
  pnlToneClassOptional,
} from "@/lib/format";

describe("format helpers", () => {
  it("formats USD with 2 decimals", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("formats compact USD", () => {
    expect(formatUsd(12_500, { compact: true })).toBe("$12.5K");
  });

  it("prefixes signed USD with + for positive", () => {
    expect(formatSignedUsd(120.5)).toBe("+$120.50");
    expect(formatSignedUsd(-40.25)).toBe("-$40.25");
    expect(formatSignedUsd(0)).toBe("$0.00");
  });

  it("formats percentages", () => {
    expect(formatPct(3.145)).toBe("3.15%");
    expect(formatSignedPct(3.145)).toBe("+3.15%");
    expect(formatSignedPct(-1)).toBe("-1.00%");
  });

  it("formats quantities compactly", () => {
    expect(formatQty(0.12345)).toBe("0.1235");
    expect(formatQty(1000)).toBe("1,000");
  });

  it("maps PnL to a tone class", () => {
    expect(pnlToneClass(10)).toBe("text-pos");
    expect(pnlToneClass(-1)).toBe("text-neg");
    expect(pnlToneClass(0)).toBe("text-muted");
  });
});

describe("optional formatters — null is unknown, not zero", () => {
  it("distinguishes real 0 from unknown", () => {
    // Real zero → formatted number.
    expect(formatOptionalUsd(0)).toBe("$0.00");
    expect(formatOptionalPct(0)).toBe("0.00%");
    // formatSignedPct's existing convention: no '+' prefix for exact zero.
    expect(formatOptionalSignedPct(0)).toBe("0.00%");
    expect(formatOptionalNumber(0)).toBe("0.00");
    // Unknown → em dash, NEVER 0.
    expect(formatOptionalUsd(null)).toBe(UNAVAILABLE);
    expect(formatOptionalUsd(undefined)).toBe(UNAVAILABLE);
    expect(formatOptionalPct(null)).toBe(UNAVAILABLE);
    expect(formatOptionalSignedPct(null)).toBe(UNAVAILABLE);
    expect(formatOptionalNumber(null)).toBe(UNAVAILABLE);
    // Regression: unknown must not stringify as "0", "$0", "0%", …
    for (const rendering of [
      formatOptionalUsd(null),
      formatOptionalPct(null),
      formatOptionalSignedPct(null),
      formatOptionalNumber(null),
    ]) {
      expect(rendering).not.toMatch(/^[-+]?0/);
    }
  });

  it("keeps sign for negative values (real, not unknown)", () => {
    expect(formatOptionalSignedPct(-4.2)).toBe("-4.20%");
    expect(formatOptionalUsd(-100)).toBe("-$100.00");
  });

  it("treats unknown as neutral tone, not positive-of-zero", () => {
    expect(pnlToneClassOptional(null)).toBe("text-muted");
    expect(pnlToneClassOptional(undefined)).toBe("text-muted");
    expect(pnlToneClassOptional(0)).toBe("text-muted");
    expect(pnlToneClassOptional(1)).toBe("text-pos");
  });
});
