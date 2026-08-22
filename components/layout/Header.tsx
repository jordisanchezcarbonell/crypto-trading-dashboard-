'use client';

import { useDashboard } from '@/lib/providers/DashboardProvider';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { FreshnessPill } from '@/components/ui/FreshnessPill';
import { formatRelative } from '@/lib/format';

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
        <div className='flex items-center gap-2'>
          <span className='uppercase tracking-wide text-zinc-500'>
            Last sync
          </span>
          <span className='font-medium text-zinc-100' suppressHydrationWarning>
            {formatRelative(health.lastSync)}
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='uppercase tracking-wide text-zinc-500'>
            Next processing
          </span>
          <span className='font-medium text-zinc-100' suppressHydrationWarning>
            {formatRelative(health.nextProcessing)}
          </span>
        </div>
      </div>
    </header>
  );
}
