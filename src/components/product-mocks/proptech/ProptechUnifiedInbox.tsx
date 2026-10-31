'use client'

import React from 'react'
import {
  BookOpen,
  Inbox,
  LineChart,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell, ProductAvatar } from '../ProductAppShell'

const NAV = [
  { icon: Inbox, label: 'Inbox', active: true },
  { icon: BookOpen, label: 'Knowledge' },
  { icon: LineChart, label: 'Insights' },
  { icon: MessageSquare, label: 'Reviews' },
]

const THREADS = [
  {
    name: 'Elena K.',
    subject: 'Viewing · the city flat, Ref #8842',
    preview: 'Can we confirm parking and community fees?',
    lang: 'ES',
    time: '2m',
    active: true,
  },
  {
    name: 'Giulia M.',
    subject: 'Lease renewal · Milan apartment',
    preview: 'What documents do we need for the extension?',
    lang: 'IT',
    time: '14m',
  },
  {
    name: 'Sophie L.',
    subject: 'Deposit return timeline',
    preview: 'Client asking about standard processing window…',
    lang: 'FR',
    time: '38m',
  },
]

const KB_HITS = [
  { title: 'Parking & community fees · residential', score: 98, id: '#KB-142' },
  { title: 'Viewing follow-up template · ES', score: 94, id: '#KB-088' },
  { title: 'Cross-border fee disclosure', score: 91, id: '#KB-201' },
]

export function ProptechUnifiedInbox() {
  return (
    <ProductAppShell
      productName="Client assistant"
      clientBadge="European real-estate firm"
      nav={NAV}
      topRight={
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-line-subtle bg-white px-2 py-1 sm:flex">
            <Search className="h-3 w-3 text-ink-tertiary" />
            <span className="text-[10px] text-ink-tertiary">Search 261 answers…</span>
          </div>
          <ProductAvatar initials="JE" tint="violet" size="sm" />
        </div>
      }
    >
      <div className="flex h-full">
        {/* thread list */}
        <div className="w-[34%] shrink-0 border-r border-line-subtle">
          <div className="flex items-center justify-between border-b border-line-subtle px-3 py-2">
            <span className="text-[11px] font-semibold text-ink">Open conversations</span>
            <Badge tint="violet" size="sm">
              12
            </Badge>
          </div>
          {/* between: (not divide-y) so the selected row keeps its own border colour off the separators. */}
          <ul className="[&>:not([hidden])~:not([hidden])]:border-t [&>:not([hidden])~:not([hidden])]:border-line-subtle">
            {THREADS.map((t) => (
              <li
                key={t.subject}
                className={
                  t.active
                    ? 'border-l-2 border-brand-violet px-3 py-2.5'
                    : 'px-3 py-2.5'
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-medium text-ink">{t.name}</span>
                  <span className="text-[10px] text-ink-tertiary">{t.time}</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] font-medium text-ink-secondary">{t.subject}</p>
                <p className="mt-0.5 truncate text-[10px] text-ink-tertiary">{t.preview}</p>
                <Badge tint="cyan" size="sm" className="mt-1.5">
                  {t.lang}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* conversation + draft */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line-subtle px-4 py-2">
            <p className="text-[11px] font-semibold text-ink">Viewing · the city flat, Ref #8842</p>
            <p className="text-[10px] text-ink-tertiary">PII stripped · Retrieved 3 sources · Draft ready</p>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden p-4">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-line-subtle bg-surface-overlay px-3 py-2">
              <p className="text-[10px] leading-relaxed text-ink-secondary">
                Good morning, could you confirm whether parking is included and what the monthly
                community fees are for the viewing on Thursday?
              </p>
              <p className="mt-1 text-[9px] text-ink-tertiary">Elena K. · incoming · 09:14</p>
            </div>

            <div className="ml-auto max-w-[90%] rounded-xl rounded-tr-sm border px-3 py-2">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-brand-violet-strong" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-violet-strong">
                  AI draft · ES
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-ink">
                Buenos días Elena, parking is included with this unit (space #B12). Community fees
                are €185/month, covering maintenance and concierge.{' '}
                <span className="text-brand-cyan-strong">[KB-142 · KB-088]</span>
              </p>
            </div>
          </div>

          {/* KB panel */}
          <div className="border-t border-line-subtle bg-surface-frost px-4 py-2.5">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Knowledge matches
            </p>
            <div className="flex flex-wrap gap-2">
              {KB_HITS.map((hit) => (
                <div
                  key={hit.id}
                  className="flex items-center gap-2 rounded-lg border border-line-subtle bg-white px-2 py-1"
                >
                  <span className="text-[10px] text-ink-secondary">{hit.title}</span>
                  <Badge tint="emerald" size="sm">
                    {hit.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProductAppShell>
  )
}
