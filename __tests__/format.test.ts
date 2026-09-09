import { describe, expect, it } from "vitest";
import {
  UNAVAILABLE,
  formatDateTimeUtc,
  formatDateUtc,
  formatOptionalNumber,
  formatOptionalPct,
  formatOptionalSignedPct,
  formatOptionalUsd,
  formatPct,
  formatQty,
  formatSignalValue,
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

describe("formatSignalValue", () => {
  it("cuts float noise off a price without rounding it away", () => {
    // Straight from the exporter payload: fourteen significant digits of a
    // moving average that the strategy computed to two.
    expect(formatSignalValue(65669.30417490489)).toBe("65,669.3");
    expect(formatSignalValue(69629.50970788272)).toBe("69,629.51");
  });

  it("keeps precision where the magnitude needs it", () => {
    // A DOGE mark truncated to two places would read as zero.
    expect(formatSignalValue(0.0000834)).toBe("0.000083");
    expect(formatSignalValue(1.2345678)).toBe("1.2346");
  });

  it("leaves whole numbers whole", () => {
    expect(formatSignalValue(1)).toBe("1");
    expect(formatSignalValue(0)).toBe("0");
  });

  it("passes non-numeric signals through untouched", () => {
    expect(formatSignalValue("long")).toBe("long");
    expect(formatSignalValue(true)).toBe("true");
    // NaN/Infinity are not numbers a reader can use; do not dress them up.
    expect(formatSignalValue(Number.NaN)).toBe("NaN");
  });
});

describe("UTC formatters", () => {
  it("renders a research instant in UTC, not the viewer's zone", () => {
    // The frozen dataset boundary. In any zone east of Greenwich the local
    // formatter would print a later clock time under a "UTC" label.
    expect(formatDateTimeUtc("2026-08-19T12:00:00+00:00")).toBe(
      "2026-08-19 12:00"
    );
    expect(formatDateUtc("2026-08-19T12:00:00+00:00")).toBe("2026-08-19");
  });

  it("normalises an offset instant to UTC", () => {
    expect(formatDateTimeUtc("2026-08-19T14:00:00+02:00")).toBe(
      "2026-08-19 12:00"
    );
    // Same instant, a day earlier in UTC.
    expect(formatDateUtc("2026-08-20T01:00:00+02:00")).toBe("2026-08-19");
  });
});
