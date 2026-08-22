'use client';

import { useDashboard } from '@/lib/providers/DashboardProvider';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { FreshnessPill } from '@/components/ui/FreshnessPill';
import { UNAVAILABLE, formatDuration, formatRelative } from '@/lib/format';
import { computeProcessingStatus } from '@/lib/domain/processing';

const MODE_TONE = {
  paper: 'warning',
  live: 'danger',
  'read-only': 'muted',
} as const;

const MODE_LABEL = {
  paper: 'PAPER TRADING',
  live: 'LIVE',
  'read-only': 'READ ONLY',
} as const;

export function Header() {
  const { snapshot, source } = useDashboard();
  const { runId, mode, readOnly, health, freshness } = snapshot;
  // Deliberately not memoised: whether the runner is overdue depends on
  // wall-clock time, not on the snapshot, so a memo keyed on the snapshot
  // would keep showing a stale countdown after the deadline passed.
  const processing = computeProcessingStatus(health);

  return (
    <header className='flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/70 px-8 py-4 backdrop-blur'>
      <div className='flex flex-wrap items-center gap-3'>
        <Badge tone='info' className='text-sm'>
          <span className='font-semibold tracking-wide'>{runId}</span>
        </Badge>
        <Badge tone={MODE_TONE[mode]} className='tracking-wide'>
          {MODE_LABEL[mode]}
        </Badge>
        {readOnly && (
          <Badge tone='muted' className='tracking-wide'>
            READ ONLY
          </Badge>
        )}
        <FreshnessPill freshness={freshness} />
        <Badge tone='muted' className='tracking-wide'>
          {source === 'supabase' ? 'SUPABASE' : 'MOCK'}
        </Badge>
      </div>

      <div className='flex flex-wrap items-center gap-6 text-xs text-zinc-400'>
        <div className='flex items-center gap-2'>
          <StatusDot status={health.overall} />
          <span className='uppercase tracking-wide text-zinc-500'>Health</span>
          <span className='font-medium text-zinc-100'>{health.overall}</span>
        </div>
        {/* This slot used to render `health.lastSync`, which is the last
            feature BAR the runner processed, not an exporter sync. On a 4h
            timeframe it reads "3 hours ago" even when the replica was
            written seconds ago. The FreshnessPill above already answers the
            freshness question from `generated_at`, so this now shows the
            runner cadence, which is what it was really reporting. */}
        <div className='flex items-center gap-2'>
          <span className='uppercase tracking-wide text-zinc-500'>
            Last processing
          </span>
          <span className='font-medium text-zinc-100' suppressHydrationWarning>
            {processing.lastProcessingAt === null
              ? UNAVAILABLE
              : formatRelative(processing.lastProcessingAt)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='uppercase tracking-wide text-zinc-500'>
            Next processing
          </span>
          <NextProcessingValue
            state={processing.state}
            deltaSeconds={processing.deltaSeconds}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * The cadence value, which must never flatter a late runner.
 *
 * An overdue deadline is rendered as overdue. We do not advance it by whole
 * timeframes until it lands in the future: a deadline in the past is the
 * evidence that a bar went unprocessed, and rolling it forward would turn a
 * missed execution into a healthy-looking countdown.
 */
function NextProcessingValue({
  state,
  deltaSeconds,
}: {
  state: 'due' | 'overdue' | 'unknown';
  deltaSeconds: number | null;
}) {
  if (state === 'unknown' || deltaSeconds === null) {
    return <span className='font-medium text-zinc-400'>{UNAVAILABLE}</span>;
  }

  if (state === 'overdue') {
    return (
      <Badge tone='warning' className='text-[10px] tracking-wide'>
        {formatDuration(deltaSeconds)} OVERDUE
      </Badge>
    );
  }

  return (
    <span className='font-medium text-zinc-100' suppressHydrationWarning>
      in {formatDuration(deltaSeconds)}
    </span>
  );
}
