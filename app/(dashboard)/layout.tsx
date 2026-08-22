import type { ReactNode } from "react";
import { MockDashboardProvider } from "@/lib/providers/MockDashboardProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <MockDashboardProvider>
      <div className="flex min-h-screen bg-zinc-950">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
        </div>
      </div>
    </MockDashboardProvider>
  );
}
