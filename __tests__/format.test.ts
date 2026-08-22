import { describe, expect, it } from "vitest";
import {
  formatPct,
  formatQty,
  formatSignedPct,
  formatSignedUsd,
  formatUsd,
  pnlToneClass,
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
    expect(pnlToneClass(10)).toContain("emerald");
    expect(pnlToneClass(-1)).toContain("rose");
    expect(pnlToneClass(0)).toContain("zinc");
  });
});
