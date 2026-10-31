'use client'

import React from 'react'
import { BookOpen, Check, Inbox, LineChart, MessageSquare, Search, ShieldCheck } from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell, ProductAvatar } from '../ProductAppShell'
import { clamp, progress } from '@/src/motion-studio/time'
import {
  MERIDIAN_INBOX_LABELS,
  MERIDIAN_INQUIRIES,
  MERIDIAN_INTAKE_STEPS,
  MERIDIAN_MOCK_CHROME,
  MERIDIAN_OLDER_THREADS,
} from '@/src/meridian-assist-mock-content'

const NAV = [
  { icon: Inbox, label: 'Inbox', active: true },
  { icon: BookOpen, label: 'Knowledge' },
  { icon: LineChart, label: 'Insights' },
  { icon: MessageSquare, label: 'Reviews' },
]

export interface ProptechInquiryArrivalsProps {
  /**
   * State progress, 0..1. Inquiries arrive (0 to ~0.45), personal data is
   * stripped (~0.45 to ~0.8), intake steps tick. 1 = the settled still.
   * Pure function of `t`: the motion studio drives it frame by frame.
   */
  t?: number
}

/** Client assistant: German, French and English inquiries arriving overnight. */
export function ProptechInquiryArrivals({ t = 1 }: ProptechInquiryArrivalsProps) {
  const u = clamp(t)
  return (
    <ProductAppShell
      productName={MERIDIAN_MOCK_CHROME.productName}
      clientBadge={MERIDIAN_MOCK_CHROME.inboxBadge}
      nav={NAV}
      topRight={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-white px-2 py-1">
            <Search className="h-3 w-3 text-ink-tertiary" />
            <span className="text-[10px] text-ink-tertiary">{MERIDIAN_MOCK_CHROME.searchHint}</span>
          </div>
          <ProductAvatar initials={MERIDIAN_MOCK_CHROME.reviewerInitials} tint="cyan" size="sm" />
        </div>
      }
    >
      <div className="flex h-full">
        {/* arrivals */}
        <div className="flex w-[52%] shrink-0 flex-col border-r border-line-subtle" data-focus="inbox-list">
          <div className="flex items-center justify-between border-b border-line-subtle px-3 py-2">
            <span className="text-[11px] font-semibold text-ink">{MERIDIAN_INBOX_LABELS.listTitle}</span>
            <Badge tint="violet" size="sm">
              {Math.round(clamp(u / 0.45) * MERIDIAN_INQUIRIES.length)}
            </Badge>
          </div>
          <ul className="flex-1 overflow-hidden">
            {MERIDIAN_INQUIRIES.map((q, i) => {
              const arrive = progress(u, 0.02 + i * 0.14, 0.18 + i * 0.14)
              const strip = progress(u, 0.48 + i * 0.09, 0.6 + i * 0.09)
              const selected = i === 0
              return (
                <li
                  key={q.id}
                  data-focus={i === 0 ? 'pii' : undefined}
                  className="relative border-b border-line-subtle px-3 py-3"
                  style={{
                    opacity: arrive,
                    transform: `translateY(${(1 - arrive) * -14}px)`,
                    background: selected
                      ? `rgba(124,58,237,${0.05 * strip})`
                      : undefined,
                  }}
                >
                  {selected ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 w-[2px] bg-brand-violet"
                      style={{ opacity: strip }}
                    />
                  ) : null}
                  <div className="flex items-start justify-between gap-2">
                    <div className="relative h-4 min-w-0 flex-1">
                      {/* raw sender, before stripping */}
                      <span
                        className="absolute inset-0 truncate text-[11px] font-medium text-ink"
                        style={{ opacity: 1 - strip }}
                      >
                        {q.sender}
                        <span className="ml-1.5 font-normal text-ink-tertiary">{q.senderEmail}</span>
                      </span>
                      {/* stripped */}
                      <span
                        className="absolute inset-0 flex items-center gap-1"
                        style={{ opacity: strip }}
                      >
                        <RedactChip>{MERIDIAN_INBOX_LABELS.redactedName}</RedactChip>
                        <RedactChip>{MERIDIAN_INBOX_LABELS.redactedEmail}</RedactChip>
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-ink-tertiary">{q.time}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-medium text-ink-secondary">{q.subject}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-ink-tertiary">{q.preview}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge tint="cyan" size="sm">
                      {q.lang}
                    </Badge>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium"
                      style={{
                        opacity: strip,
                        color: 'var(--emerald-strong)',
                        borderColor: 'rgba(74,222,128,0.35)',
                        background: 'rgba(74,222,128,0.10)',
                      }}
                    >
                      <ShieldCheck className="h-2.5 w-2.5" />
                      {MERIDIAN_INBOX_LABELS.strippedBadge}
                    </span>
                  </div>
                </li>
              )
            })}
            {MERIDIAN_OLDER_THREADS.map((o) => (
              <li key={o.subject} className="border-b border-line-subtle px-3 py-2.5 opacity-45">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] text-ink-secondary">{o.subject}</p>
                  <span className="shrink-0 text-[9px] text-ink-tertiary">{o.time}</span>
                </div>
                <Badge tint="neutral" size="sm" className="mt-1">
                  {o.lang}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* intake for the selected inquiry */}
        <div className="flex min-w-0 flex-1 flex-col bg-surface-raised">
          <div className="border-b border-line-subtle px-4 py-2">
            <p className="text-[11px] font-semibold text-ink">{MERIDIAN_INBOX_LABELS.intakeTitle}</p>
            <p className="truncate text-[10px] text-ink-tertiary">{MERIDIAN_INQUIRIES[0]?.subject}</p>
          </div>
          <ol className="flex-1 space-y-2.5 p-4">
            {MERIDIAN_INTAKE_STEPS.map((step, k) => {
              const on = progress(u, 0.42 + k * 0.13, 0.52 + k * 0.13)
              return (
                <li
                  key={step.label}
                  className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5"
                  style={{
                    borderColor: `rgba(124,58,237,${0.08 + 0.2 * on})`,
                    opacity: 0.4 + 0.6 * on,
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: on > 0.5 ? 'var(--gradient-prism)' : 'var(--surface-overlay)',
                      color: on > 0.5 ? '#fff' : 'var(--text-tertiary)',
                    }}
                  >
                    {on > 0.5 ? (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <span className="text-[10px] font-semibold">{k + 1}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink">{step.label}</p>
                    <p className="text-[10px] text-ink-tertiary">{step.value}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </ProductAppShell>
  )
}

function RedactChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-surface-overlay px-1.5 py-px font-mono text-[9px] text-ink-secondary">
      {children}
    </span>
  )
}
