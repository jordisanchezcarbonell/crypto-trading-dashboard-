import clsx from 'clsx';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Decision, DecisionAction } from '@/lib/domain/schemas';
import {
  UNAVAILABLE,
  formatDateTime,
  formatPct,
  formatRelative,
} from '@/lib/format';

/**
 * Ordering key — deliberately NOT a displayed value.
 *
 * `d.timestamp` is the FEATURE BAR — the candle the features came from. A
 * decision whose feature bar is 08:00 on a 4h timeframe could not be known
 * until that bar closed at 12:00, so labelling a row with the bar claims
 * the agent saw the future.
 *
 * Sorting is not a claim about when anything happened; it only decides
 * which row sits above which. Availability is the bar plus one whole
 * timeframe (see lib/data-source/supabase.ts), so the two are monotonically
 * related and ordering by the bar yields the identical sequence. That makes
 * the fallback sound HERE, and only here.
 *
 * The rendered time keeps no such fallback — see the `<time>` below. Putting
 * the bar in the headline slot is precisely the substitution that let a late
 * runner read as on time.
 */
function orderKey(d: Decision): string {
  return d.signalAvailableAt ?? d.timestamp;
}

const ACTION_TONE: Record<DecisionAction, BadgeTone> = {
  open_long: 'success',
  scale_in: 'success',
  open_short: 'danger',
  scale_out: 'warning',
  close: 'info',
  hold: 'muted',
  skip: 'muted',
};

const ACTION_LABEL: Record<DecisionAction, string> = {
  open_long: 'OPEN LONG',
  open_short: 'OPEN SHORT',
  scale_in: 'SCALE IN',
  scale_out: 'SCALE OUT',
  close: 'CLOSE',
  hold: 'HOLD',
  skip: 'SKIP',
};

// The rail marker inherits the action colour, so the timeline can be scanned
// vertically without reading a single label.
const MARKER_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-edge',
  info: 'bg-info',
  accent: 'bg-accent',
  warning: 'bg-warn',
  success: 'bg-pos',
  danger: 'bg-neg',
  muted: 'bg-faint',
};

export function DecisionsTimeline({ decisions }: { decisions: Decision[] }) {
  const sorted = [...decisions].sort(
    (a, b) =>
      new Date(orderKey(b)).getTime() - new Date(orderKey(a)).getTime(),
  );

  if (sorted.length === 0) {
    // One empty state for the whole app — see components/ui/EmptyState.
    return (
      <EmptyState
        title='No decisions recorded'
        hint='Each processed bar produces a decision, even a hold.'
      />
    );
  }

  return (
    <ol className='relative space-y-2.5 pl-6'>
      <span
        aria-hidden='true'
        className='absolute bottom-3 left-[7px] top-3 w-px bg-linear-to-b from-line via-line to-transparent'
      />
      {sorted.map((d) => {
        const tone = ACTION_TONE[d.action];
        return (
          <li key={d.id} className='relative'>
            <span
              aria-hidden='true'
              className={clsx(
                'absolute -left-[20.5px] top-[22px] h-2 w-2 rounded-full ring-4 ring-base',
                MARKER_CLASS[tone],
              )}
            />
            <article className='rounded-card border border-line bg-surface/70 p-4 transition-colors duration-150 hover:border-edge hover:bg-raised/50'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge tone={tone} className='tracking-wider'>
                    {ACTION_LABEL[d.action]}
                  </Badge>
                  <span className='text-sm font-semibold tracking-tight text-ink'>
                    {d.symbol}
                  </span>
                  {/* Label and value stay in one element so the rendered
                      text reads as a single "confidence 75%" string. */}
                  <span className='num text-[11px] text-muted'>
                    confidence{' '}
                    {d.confidence == null
                      ? UNAVAILABLE
                      : formatPct(d.confidence * 100, 0)}
                  </span>
                  {!d.executed && (
                    <Badge tone='muted' className='text-[10px] tracking-wider'>
                      NOT EXECUTED
                    </Badge>
                  )}
                </div>
                <div className='flex flex-col items-end text-right'>
                  {/* A `<time>` only where there is a time.
                      With no `datetime` attribute, HTML requires the
                      element's own text to be a valid date string — so an
                      unknown row would emit `<time>—</time>`, telling every
                      parser and screen reader that the em dash IS the
                      timestamp. A plain span renders identical pixels and
                      makes no machine-readable claim at all. */}
                  {d.signalAvailableAt === null ? (
                    <span
                      className='num text-[11px] text-faint'
                      title='The exporter never wrote an availability timestamp for this decision, so when it became knowable is unknown. The feature bar below is provenance, not a decision time.'
                    >
                      {UNAVAILABLE}
                    </span>
                  ) : (
                    <time
                      className='num text-[11px] text-faint'
                      dateTime={d.signalAvailableAt}
                      title={`Signal available at ${formatDateTime(d.signalAvailableAt)}`}
                      suppressHydrationWarning
                    >
                      {formatRelative(d.signalAvailableAt)}
                    </time>
                  )}
                  {/* The feature bar stays visible as provenance — which
                      candle produced the signal is genuinely useful — but it
                      is never the headline time.

                      When availability was never exported the headline IS
                      the bar, and the caveat belongs on this line. Marking
                      it in both places made every row read "(bar) … bar",
                      which says the word twice and explains it once. */}
                  <span
                    className='num text-[10px] text-faint/70'
                    suppressHydrationWarning
                  >
                    bar {formatDateTime(d.timestamp)}
                    {d.signalAvailableAt === null && ' · availability n/a'}
                  </span>
                </div>
              </div>

              <p className='mt-2 text-sm leading-relaxed text-muted'>
                {d.rationale}
              </p>

              {d.signals.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {d.signals.map((s) => (
                    <span
                      key={s.name}
                      className='num inline-flex items-center gap-1.5 rounded-md border border-line bg-base/60 px-2 py-0.5 text-[11px]'
                    >
                      <span className='text-faint'>{s.name}</span>
                      <span className='text-ink'>{String(s.value)}</span>
                    </span>
                  ))}
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
