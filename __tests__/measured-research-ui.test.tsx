import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it } from "vitest";

it("shows historical evidence and removes unchecked strategies from the comparison", async () => {
  expect(existsSync(resolve("components/research/MeasuredCompare.tsx")), "interactive comparison missing").toBe(true);
  const { MeasuredCompare } = await import("@/components/research/MeasuredCompare");
  const { loadMeasuredComparison } = await import("@/lib/research/measured");
  render(<MeasuredCompare data={loadMeasuredComparison("SOL/USDT")} />);
  expect(screen.getByText("BACKTEST · IN-SAMPLE")).toBeInTheDocument();
  expect(screen.getByRole("table", {name: "Métricas comparativas"})).toHaveTextContent("BbandRsi");
  fireEvent.click(screen.getByRole("checkbox", {name: "BbandRsi · adaptación 4h"}));
  expect(screen.getByRole("table", {name: "Métricas comparativas"})).not.toHaveTextContent("BbandRsi");
  expect(screen.getByText(/No es una cartera agregada/)).toBeInTheDocument();
}, 15000);
