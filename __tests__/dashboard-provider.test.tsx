import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DashboardProvider,
  useDashboard,
} from "@/lib/providers/DashboardProvider";
import { MockDashboardProvider } from "@/lib/providers/MockDashboardProvider";

function Probe() {
  const { snapshot, source } = useDashboard();
  return (
    <div>
      <span data-testid="run">{snapshot.runId}</span>
      <span data-testid="source">{source}</span>
    </div>
  );
}

describe("DashboardProvider", () => {
  it("exposes the RUN-3 snapshot via the mock provider", () => {
    render(
      <MockDashboardProvider>
        <Probe />
      </MockDashboardProvider>
    );
    expect(screen.getByTestId("run").textContent).toBe("RUN-3");
    expect(screen.getByTestId("source").textContent).toBe("mock");
  });

  it("throws when used outside a provider", () => {
    // React logs an error boundary trace; we only care about the throw.
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<Probe />)).toThrow(/useDashboard/);
    console.error = originalError;
  });

  it("exports the raw provider for future data sources", () => {
    expect(typeof DashboardProvider).toBe("function");
  });
});
