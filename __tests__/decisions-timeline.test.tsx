import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecisionsTimeline } from "@/components/tables/DecisionsTimeline";
import type { Decision } from "@/lib/domain/schemas";
import { UNAVAILABLE } from "@/lib/format";

const baseDecision: Decision = {
  id: "dec-1",
  timestamp: "2026-08-22T12:00:00.000Z",
  symbol: "BTC-USDT",
  action: "hold",
  confidence: 0.75,
  rationale: "ema50 > ema200",
  signals: [{ name: "ema50", value: 100 }],
  executed: true,
};

describe("<DecisionsTimeline />", () => {
  it("renders confidence percent when present", () => {
    render(<DecisionsTimeline decisions={[baseDecision]} />);
    expect(screen.getByText(/confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it("renders em-dash for null confidence, NOT 0%", () => {
    const nullConfidence: Decision = { ...baseDecision, confidence: null };
    render(<DecisionsTimeline decisions={[nullConfidence]} />);
    // The label "confidence —" must appear (with em dash).
    expect(screen.getByText(new RegExp(`confidence.*${UNAVAILABLE}`))).toBeInTheDocument();
    // Regression: no 0% rendered for the unknown case.
    expect(screen.queryByText(/^0%$/)).toBeNull();
  });

  it("keeps rendering when confidence is a real 0 (edge case)", () => {
    const zeroConfidence: Decision = { ...baseDecision, confidence: 0 };
    render(<DecisionsTimeline decisions={[zeroConfidence]} />);
    // A real zero must render 0%, not em dash.
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
