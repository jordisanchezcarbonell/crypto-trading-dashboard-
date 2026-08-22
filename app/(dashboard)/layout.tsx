import type { ReactNode } from "react";
import {
  DEFAULT_RUN_ID,
  getDashboardProvider,
} from "@/lib/data-source/factory";
import { DashboardProvider } from "@/lib/providers/DashboardProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import { SHELL_WIDTH } from "@/components/layout/shell";

const RUN_ID = process.env.DASHBOARD_RUN_ID ?? DEFAULT_RUN_ID;

// The layout renders on every navigation; disable static caching so we always
// hit the current data source (mock or Supabase) with the latest snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const provider = getDashboardProvider();
  const snapshot = await provider.getRunSnapshot(RUN_ID);

  return (
    <DashboardProvider value={{ snapshot, source: provider.source }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <MobileNav />
          <main
            id="main"
            className={`${SHELL_WIDTH} flex-1 overflow-x-hidden py-6 lg:py-8`}
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
