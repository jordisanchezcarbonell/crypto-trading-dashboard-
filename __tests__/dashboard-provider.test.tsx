import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DashboardProvider,
  useDashboard,
} from "@/lib/providers/DashboardProvider";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";

function Probe() {
  const { snapshot, source } = useDashboard();
  return (
    <div>
      <span data-testid="run">{snapshot.runId}</span>
      <span data-testid="source">{source}</span>
    </div>
  );
}

describe("DashboardProvider (client context)", () => {
  it("exposes the snapshot via useDashboard()", () => {
    render(
      <DashboardProvider value={{ snapshot: run3Snapshot, source: "mock" }}>
        <Probe />
      </DashboardProvider>
    );
    expect(screen.getByTestId("run").textContent).toBe("RUN-3-DEMO");
    expect(screen.getByTestId("source").textContent).toBe("mock");
  });

  it("also works when labelled as the supabase source", () => {
    render(
      <DashboardProvider value={{ snapshot: run3Snapshot, source: "supabase" }}>
        <Probe />
      </DashboardProvider>
    );
    expect(screen.getByTestId("source").textContent).toBe("supabase");
  });

  it("throws when used outside a provider", () => {
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow(/useDashboard/);
    console.error = originalError;
  });
});
