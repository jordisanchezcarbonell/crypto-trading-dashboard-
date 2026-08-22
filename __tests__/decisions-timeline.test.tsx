import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecisionsTimeline } from "@/components/tables/DecisionsTimeline";
import type { Decision } from "@/lib/domain/schemas";
import { UNAVAILABLE } from "@/lib/format";

// Feature bar at 08:00, knowable only once the 4h bar closed at 12:00.
const baseDecision: Decision = {
  id: "dec-1",
  timestamp: "2026-08-22T08:00:00.000Z",
  signalAvailableAt: "2026-08-22T12:00:00.000Z",
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

  it("dates a decision by when it became knowable, not by its feature bar", () => {
    // The bar is 08:00 but the signal only existed at 12:00. Rendering the
    // bar as the decision time would credit the strategy with 4h of
    // foresight it never had.
    const { container } = render(<DecisionsTimeline decisions={[baseDecision]} />);
    const time = container.querySelector("time");
    expect(time?.getAttribute("dateTime")).toBe("2026-08-22T12:00:00.000Z");
    // The bar stays visible as provenance, but only as a secondary line.
    expect(screen.getByText(/^bar /)).toBeInTheDocument();
  });

  it("orders by availability, so a later bar cannot jump the queue", () => {
    // `early` has the LATER feature bar but became knowable FIRST. Sorting
    // by `timestamp` would put it on top; sorting causally must not.
    const early: Decision = {
      ...baseDecision,
      id: "early",
      timestamp: "2026-08-22T08:00:00.000Z",
      signalAvailableAt: "2026-08-22T12:00:00.000Z",
      symbol: "EARLY-USDT",
    };
    const late: Decision = {
      ...baseDecision,
      id: "late",
      timestamp: "2026-08-22T04:00:00.000Z",
      signalAvailableAt: "2026-08-22T16:00:00.000Z",
      symbol: "LATE-USDT",
    };
    const { container } = render(<DecisionsTimeline decisions={[early, late]} />);
    const symbols = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent?.match(/(EARLY|LATE)-USDT/)?.[0]
    );
    expect(symbols).toEqual(["LATE-USDT", "EARLY-USDT"]);
  });

  it("shows unknown, NOT the feature bar, when availability was never exported", () => {
    const legacy: Decision = { ...baseDecision, signalAvailableAt: null };
    const { container } = render(<DecisionsTimeline decisions={[legacy]} />);
    const time = container.querySelector("time");

    // The headline slot must not carry the bar. Rendering it here is what
    // let a decision that could not be known until 12:00 read as though it
    // had been made at 08:00.
    expect(time?.getAttribute("dateTime")).toBeNull();
    expect(time?.textContent).toBe(UNAVAILABLE);
    expect(time?.textContent).not.toMatch(/ago|in /);

    // The bar survives one line down as provenance, still marked.
    expect(screen.getByText(/availability n\/a/)).toBeInTheDocument();
    expect(screen.getByText(/bar /)).toBeInTheDocument();
    expect(screen.queryByText("(bar)")).toBeNull();
  });

  it("keeps rendering when confidence is a real 0 (edge case)", () => {
    const zeroConfidence: Decision = { ...baseDecision, confidence: 0 };
    render(<DecisionsTimeline decisions={[zeroConfidence]} />);
    // A real zero must render 0%, not em dash.
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
