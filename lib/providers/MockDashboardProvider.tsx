"use client";

import type { ReactNode } from "react";
import { RunSnapshotSchema } from "@/lib/domain/schemas";
import { run3Snapshot } from "@/lib/mock/run3-fixtures";
import { DashboardProvider } from "./DashboardProvider";

const validated = RunSnapshotSchema.parse(run3Snapshot);

export function MockDashboardProvider({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider value={{ snapshot: validated, source: "mock" }}>
      {children}
    </DashboardProvider>
  );
}
