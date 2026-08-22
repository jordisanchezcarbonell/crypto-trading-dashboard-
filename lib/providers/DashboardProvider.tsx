"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RunSnapshot } from "@/lib/domain/schemas";

export interface DashboardContextValue {
  snapshot: RunSnapshot;
  source: "mock" | "supabase";
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
