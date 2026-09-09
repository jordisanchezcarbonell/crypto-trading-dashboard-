"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { UNAVAILABLE, formatDateTimeUtc } from "@/lib/format";
import type {
  ResearchDataset,
  ResearchProtocol,
  ResearchStrategyResult,
} from "@/lib/research/schema";
import { StateTag } from "./StateTag";

/**
 * The lab header.
 *
 * It answers, before any number is read: which candidate, in what state, on
 * which dataset, under which protocol, up to which bar. A metric with no
 * experimental conditions attached is not a result, and putting the
 * conditions three panels down would let a reader form a view without them.
 */
export function ResearchHeader({
  strategies,
  selected,
  onSelect,
  protocol,
  dataset,
  lastBar,
}: {
  strategies: ResearchStrategyResult[];
  selected: ResearchStrategyResult;
  onSelect: (id: string) => void;
  protocol: ResearchProtocol | null;
  dataset: ResearchDataset | null;
  lastBar: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="eyebrow">Quant Research Lab</div>
          <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink">
            Research Lab
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            Historical, in-sample experiment results. Nothing on this page is a
            live, paper or forward result.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="muted" className="tracking-wider">
            HISTORICAL
          </Badge>
          <Badge tone="muted" className="tracking-wider">
            RESEARCH
          </Badge>
          <Badge tone="muted" className="tracking-wider">
            READ ONLY
          </Badge>
        </div>
      </div>

      {/* Strategy selector. A row of explicit targets rather than a <select>:
          the set is small, and which candidates exist is itself information. */}
      <div
        role="group"
        aria-label="Strategy"
        className="flex flex-wrap gap-2"
      >
        {strategies.map((strategy) => {
          const active = strategy.id === selected.id;
          return (
            <button
              key={strategy.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(strategy.id)}
              className={clsx(
                "rounded-lg border px-3 py-2 text-left transition-colors duration-150",
                active
                  ? "border-accent/50 bg-raised text-ink"
                  : "border-line bg-surface/60 text-muted hover:border-edge hover:text-ink"
              )}
            >
              <span className="block text-sm font-medium">
                {strategy.label}
              </span>
              <span className="num mt-0.5 block text-[10px] text-faint">
                {strategy.provenance.strategyName} {strategy.provenance.version}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-card border border-line bg-surface/60 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Research state</span>
          {selected.states.map((tag) => (
            <StateTag key={tag.state} state={tag.state} />
          ))}
        </div>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">
          {selected.summary}
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-3 border-t border-line pt-3 sm:grid-cols-2 xl:grid-cols-4">
          <Meta label="Dataset">
            <span className="num text-ink">
              {dataset?.id ?? selected.provenance.datasetId ?? UNAVAILABLE}
            </span>
          </Meta>
          <Meta label="Protocol">
            <span className="num text-ink">
              {protocol?.version ?? selected.provenance.protocol ?? UNAVAILABLE}
            </span>
          </Meta>
          <Meta label="Timeframe / universe">
            <span className="num text-ink">
              {protocol
                ? `${protocol.timeframe} · ${protocol.universe.length} assets`
                : UNAVAILABLE}
            </span>
          </Meta>
          <Meta label="Last historical bar">
            <span className="num text-ink">{formatDateTimeUtc(lastBar)} UTC</span>
          </Meta>
        </dl>
      </div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-0.5 truncate text-xs">{children}</dd>
    </div>
  );
}
