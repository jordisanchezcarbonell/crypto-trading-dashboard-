import Link from "next/link";
import type { ReactNode } from "react";

export default function ResearchLayout({children}: {children: ReactNode}) {
  return <div className="min-h-screen">
    <div className="border-b border-line bg-surface/70"><nav aria-label="Research" className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 lg:px-10">
      <Link href="/research" className="text-sm font-semibold tracking-wide text-accent">TRADING LAB <span className="ml-2 font-normal text-muted">/ RESEARCH</span></Link>
      <div className="flex items-center gap-5"><Link href="/research/compare" className="text-xs text-muted hover:text-ink">Dentro de muestra</Link><Link href="/research/out-of-sample" className="text-xs text-muted hover:text-ink">Fuera de muestra</Link><span className="hidden text-xs text-muted sm:block">Histórico · solo lectura</span><Link href="/" className="text-xs text-muted hover:text-ink">Panel operacional ↗</Link></div>
    </nav></div>
    <main id="main" className="mx-auto max-w-[1440px] px-5 py-6 lg:px-10 lg:py-8">{children}</main>
  </div>;
}
