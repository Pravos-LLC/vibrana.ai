'use client'

import React from 'react'
import {
  Headphones,
  Inbox,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Users,
} from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell, ProductAvatar } from '../ProductAppShell'

const NAV = [
  { icon: Inbox, label: 'Inbox', active: true },
  { icon: Headphones, label: 'Calls' },
  { icon: Users, label: 'Team' },
  { icon: MessageSquare, label: 'Knowledge' },
]

const CHANNELS = [
  { icon: MessageSquare, label: 'Chat', count: 8 },
  { icon: Mail, label: 'Email', count: 14 },
  { icon: Phone, label: 'Voice', count: 3, active: true },
]

const QUEUE = [
  {
    channel: 'Voice',
    title: 'Callback · home insurance renewal',
    meta: 'Policy #HK-9921 · 4m wait',
    priority: 'High',
    active: true,
  },
  {
    channel: 'Chat',
    title: 'Windscreen claim · excess question',
    meta: 'Live · Agent: Priya S.',
    priority: null,
  },
  {
    channel: 'Email',
    title: 'Re: cancellation within cooling-off',
    meta: 'Unread · FCA-sensitive',
    priority: 'Review',
  },
]

const KB = [
  { q: 'Renewal grace period · home policy', id: 'KB-441' },
  { q: 'Mid-term adjustment fees', id: 'KB-218' },
  { q: 'Complaints escalation path', id: 'KB-089' },
]

export function InsurtechUnifiedInbox() {
  return (
    <ProductAppShell
      productName="Assist"
      clientBadge="UK insurtech scale-up"
      nav={NAV}
      topRight={
        <div className="flex items-center gap-2">
          <Badge tint="emerald" size="sm">
            1,441 answers
          </Badge>
          <ProductAvatar initials="AM" tint="cyan" size="sm" />
        </div>
      }
    >
      <div className="flex h-full">
        <div className="w-[30%] shrink-0 border-r border-line-subtle">
          <div className="flex border-b border-line-subtle">
            {CHANNELS.map((c) => (
              <span
                key={c.label}
                aria-hidden
                className={`flex flex-1 flex-col items-center gap-0.5 border-b-2 py-2 text-[9px] ${
                  c.active
                    ? 'border-brand-violet text-brand-violet-strong'
                    : 'border-transparent text-ink-tertiary'
                }`}
              >
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
                <span className="font-semibold">{c.count}</span>
              </span>
            ))}
          </div>
          {/* between: (not divide-y) so the selected row keeps its own border colour off the separators. */}
          <ul className="[&>:not([hidden])~:not([hidden])]:border-t [&>:not([hidden])~:not([hidden])]:border-line-subtle">
            {QUEUE.map((item) => (
              <li
                key={item.title}
                className={
                  item.active
                    ? 'border-l-2 border-brand-cyan px-3 py-2'
                    : 'px-3 py-2'
                }
              >
                <div className="flex items-center gap-1.5">
                  {item.channel === 'Voice' && <Phone className="h-3 w-3 text-brand-violet-strong" />}
                  {item.channel === 'Chat' && (
                    <MessageSquare className="h-3 w-3 text-brand-blue-strong" />
                  )}
                  {item.channel === 'Email' && <Mail className="h-3 w-3 text-brand-amber-strong" />}
                  <span className="text-[10px] font-medium text-ink">{item.title}</span>
                </div>
                <p className="mt-0.5 text-[9px] text-ink-tertiary">{item.meta}</p>
                {item.priority ? (
                  <Badge tint={item.priority === 'High' ? 'red' : 'amber'} size="sm" className="mt-1">
                    {item.priority}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2">
            <div>
              <p className="text-[11px] font-semibold text-ink">Voice callback · HK-9921</p>
              <p className="text-[10px] text-ink-tertiary">Recording ready · transcript syncing</p>
            </div>
            <Badge tint="violet" size="sm">
              Live queue
            </Badge>
          </div>

          <div className="flex flex-1">
            <div className="flex flex-1 flex-col border-r border-line-subtle p-3">
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-line-subtle px-2 py-1.5">
                <Search className="h-3 w-3 text-ink-tertiary" />
                <span className="text-[10px] text-ink-tertiary">Ask the knowledge base…</span>
              </div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
                Suggested answers
              </p>
              <ul className="space-y-2">
                {KB.map((row) => (
                  <li
                    key={row.id}
                    className="cursor-default rounded-lg border border-line-subtle bg-white px-2.5 py-2"
                  >
                    <p className="text-[10px] font-medium text-ink">{row.q}</p>
                    <p className="text-[9px] text-brand-cyan-strong">{row.id}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-[42%] shrink-0 p-3">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
                Active voice thread
              </p>
              <div className="rounded-xl border border-line-subtle bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full">
                    <Phone className="h-4 w-4 text-brand-violet-strong" />
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-emerald-strong ring-2 ring-white" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-ink">Marcus T.</p>
                    <p className="text-[9px] text-ink-tertiary">Renewal · 03:42 elapsed</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-ink-secondary">
                  “I was told my premium would stay the same if I renewed before the end of the month,
                  can you confirm what happens if I miss that date?”
                </p>
                <div className="mt-3 rounded-lg border px-2 py-1.5">
                  <p className="text-[9px] font-semibold text-brand-cyan-strong">Suggested reply</p>
                  <p className="mt-0.5 text-[10px] text-ink">
                    14-day grace period applies; premium locked at renewal quote if paid within window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductAppShell>
  )
}
