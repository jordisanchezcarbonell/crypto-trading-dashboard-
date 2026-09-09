import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { UNAVAILABLE, formatDateTimeUtc } from "@/lib/format";
import type {
  ResearchDataset,
  ResearchProtocol,
  ResearchProvenance,
} from "@/lib/research/schema";

/**
 * Experiment provenance.
 *
 * Collapsed by default because it is reference material, and complete when
 * opened because reproducibility is all-or-nothing: a run you can only
 * partially reconstruct is not reproducible.
 *
 * Hashes are transported, never computed here. A field with no value in the
 * lab renders `Unavailable` — a plausible-looking placeholder hash would be
 * the single most dangerous string this dashboard could print.
 */
function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  const missing = value === null || value.length === 0;
  return (
    <div className="flex flex-col gap-0.5 border-t border-line/60 py-2 first:border-t-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="eyebrow sm:w-56 sm:shrink-0">{label}</dt>
      <dd
        className={`min-w-0 break-all text-xs ${
          missing ? "text-faint" : mono ? "num text-ink" : "text-ink"
        }`}
      >
        {missing ? UNAVAILABLE : value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow mb-1 text-muted">{title}</h4>
      <dl>{children}</dl>
    </div>
  );
}

export function ProvenancePanel({
  provenance,
  protocol,
  dataset,
}: {
  provenance: ResearchProvenance;
  protocol: ResearchProtocol | null;
  dataset: ResearchDataset | null;
}) {
  return (
    <Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-ink">
              Experiment Provenance
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Identity, hashes and window. Missing values are shown as
              Unavailable, never as a placeholder.
            </p>
          </div>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>

        <div className="grid gap-5 border-t border-line px-5 py-4 lg:grid-cols-2">
          <Section title="Strategy">
            <Field label="Strategy name" value={provenance.strategyName} />
            <Field label="Version" value={provenance.version} />
            <Field
              label="strategy_code_hash"
              value={provenance.strategyCodeHash}
              mono
            />
            <Field label="experiment_id" value={provenance.experimentId} mono />
            <Field label="Segment" value={provenance.segment} />
            <Field label="Spec path" value={provenance.specPath} mono />
          </Section>

          <Section title="Protocol">
            <Field label="Protocol" value={provenance.protocol} />
            <Field label="protocol_hash" value={provenance.protocolHash} mono />
            <Field
              label="protocol_semantic_hash"
              value={provenance.protocolSemanticHash}
              mono
            />
            <Field
              label="Execution"
              value={
                protocol
                  ? `${protocol.signalTimestamp} → ${protocol.executionTimestamp}`
                  : null
              }
            />
            <Field
              label="Frictions"
              value={
                protocol
                  ? `fee ${protocol.feeRate}, spread ${protocol.spreadBps} bps, slippage ${protocol.slippageBps} bps`
                  : null
              }
            />
            <Field
              label="Initial capital"
              value={protocol?.initialCapitalLabel ?? null}
            />
          </Section>

          <Section title="Dataset">
            <Field label="dataset_id" value={provenance.datasetId} mono />
            <Field
              label="dataset_manifest_sha256"
              value={provenance.datasetManifestSha256}
              mono
            />
            <Field
              label="Dataset provenance"
              value={dataset?.provenance ?? null}
            />
            <Field
              label="Assets"
              value={
                dataset ? `${dataset.assets.length} symbols, ${dataset.timeframe}` : null
              }
            />
          </Section>

          <Section title="Window & source">
            <Field
              label="Window start policy"
              value={provenance.windowStartPolicy}
            />
            <Field
              label="Window start"
              value={
                provenance.windowStart === null
                  ? null
                  : `${formatDateTimeUtc(provenance.windowStart)} UTC`
              }
              mono
            />
            <Field
              label="Window end"
              value={
                provenance.windowEnd === null
                  ? null
                  : `${formatDateTimeUtc(provenance.windowEnd)} UTC`
              }
              mono
            />
            <Field
              label="Source commit"
              value={provenance.sourceCommit}
              mono
            />
            <Field
              label="Operational reference"
              value={protocol?.referenceId ?? null}
            />
          </Section>
        </div>
      </details>
    </Card>
  );
}
