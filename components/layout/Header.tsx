'use client';

import type { ReactNode } from 'react';
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
    <header className='sticky top-0 z-30 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-base/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='num rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold leading-5 tracking-wide text-accent'>
          {runId}
        </span>
        <Badge tone={MODE_TONE[mode]} className='tracking-wider'>
          {MODE_LABEL[mode]}
        </Badge>
        {readOnly && (
          <Badge tone='muted' className='tracking-wider'>
            <svg
              viewBox='0 0 24 24'
              className='h-3 w-3'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              aria-hidden='true'
            >
              <rect x='4' y='10' width='16' height='10' rx='2' />
              <path d='M8 10V7a4 4 0 0 1 8 0v3' />
            </svg>
            READ ONLY
          </Badge>
        )}
        <FreshnessPill freshness={freshness} />
        <Badge tone='muted' className='tracking-wider'>
          {source === 'supabase' ? 'SUPABASE' : 'MOCK'}
        </Badge>
      </div>

      <dl className='flex flex-wrap items-center gap-x-5 gap-y-2 text-xs'>
        <Meta label='Health'>
          <StatusDot status={health.overall} />
          <span className='font-medium capitalize text-ink'>
            {health.overall}
          </span>
        </Meta>
        <Divider />
        <Meta label='Last sync'>
          <span className='num text-ink' suppressHydrationWarning>
            {formatRelative(health.lastSync)}
          </span>
        </Meta>
        <Divider />
        <Meta label='Next run'>
          <span className='num text-ink' suppressHydrationWarning>
            {formatRelative(health.nextProcessing)}
          </span>
        </Meta>
      </dl>
    </header>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='flex items-center gap-2'>
      <dt className='eyebrow'>{label}</dt>
      <dd className='flex items-center gap-1.5'>{children}</dd>
    </div>
  );
}

function Divider() {
  return (
    <span aria-hidden='true' className='hidden h-3.5 w-px bg-line sm:block' />
  );
}
