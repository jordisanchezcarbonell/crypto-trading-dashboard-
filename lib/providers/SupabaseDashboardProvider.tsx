"use client";

import type { ReactNode } from "react";
import { DashboardProvider } from "./DashboardProvider";
import type { RunSnapshot } from "@/lib/domain/schemas";

// STRUCTURE-ONLY — not wired to a real Supabase client yet.
// Wire the client here, fetch the latest snapshot for the given run,
// validate with RunSnapshotSchema, then feed it into DashboardProvider.

export interface SupabaseDashboardProviderProps {
  runId: string;
  initialSnapshot: RunSnapshot;
  children: ReactNode;
}

export function SupabaseDashboardProvider({
  initialSnapshot,
  children,
}: SupabaseDashboardProviderProps) {
  // TODO: subscribe to realtime updates and hydrate state.
  return (
    <DashboardProvider
      value={{ snapshot: initialSnapshot, source: "supabase" }}
    >
      {children}
    </DashboardProvider>
  );
}
