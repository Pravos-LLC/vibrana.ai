'use client'

import React from 'react'
import { BookOpen, Check, Inbox, LineChart, MessageSquare, ShieldCheck, Sparkles, UserCheck } from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell, ProductAvatar } from '../ProductAppShell'
import { clamp, progress } from '@/src/motion-studio/time'
import {
  MERIDIAN_INCOMING_STRIPPED,
  MERIDIAN_MOCK_CHROME,
  MERIDIAN_REPLY_DRAFT,
  MERIDIAN_REPLY_GLOSS,
  MERIDIAN_REPLY_LABELS,
  MERIDIAN_REPLY_SOURCES,
} from '@/src/meridian-assist-mock-content'

const NAV = [
  { icon: Inbox, label: 'Inbox', active: true },
  { icon: BookOpen, label: 'Knowledge' },
  { icon: LineChart, label: 'Insights' },
  { icon: MessageSquare, label: 'Reviews' },
]

/** Total characters in the draft; a citation chip counts as one character. */
const DRAFT_LENGTH = MERIDIAN_REPLY_DRAFT.reduce(
  (n, seg) => n + ('text' in seg ? seg.text.length : 1),
  0,
)

export interface ProptechCitedReplyProps {
  /**
   * State progress, 0..1: stripped email and sources settle, the German reply
   * types out with citations, the review step approves it. 1 = the settled still.
   */
  t?: number
}

/** Client assistant: a cited reply drafting in German, with the review step. */
export function ProptechCitedReply({ t = 1 }: ProptechCitedReplyProps) {
  const u = clamp(t)
  const typedF = progress(u, 0.2, 0.7, (x) => x) * DRAFT_LENGTH
  const typed = Math.round(typedF)
  const typing = typed > 0 && typed < DRAFT_LENGTH
  const gloss = progress(u, 0.7, 0.8)
  const confidence = progress(u, 0.6, 0.66)
  const waiting = progress(u, 0.62, 0.7)
  const press = progress(u, 0.84, 0.88)
  const approved = progress(u, 0.88, 0.95)

  let remaining = typed
  let pos = 0
  const draft = MERIDIAN_REPLY_DRAFT.map((seg, i) => {
    const at = pos
    pos += 'text' in seg ? seg.text.length : 1
    if (remaining <= 0) return null
    if ('text' in seg) {
      const shown = seg.text.slice(0, remaining)
      remaining -= seg.text.length
      return <span key={i}>{shown}</span>
    }
    remaining -= 1
    // the citation pops in as the typing reaches it
    const pop = Math.min(1, Math.max(0, (typedF - at) / 6))
    return <CiteChip key={i} n={seg.cite} pop={pop} />
  })

  return (
    <ProductAppShell
      productName={MERIDIAN_MOCK_CHROME.productName}
      clientBadge={MERIDIAN_MOCK_CHROME.replyBadge}
      nav={NAV}
      topRight={<ProductAvatar initials={MERIDIAN_MOCK_CHROME.reviewerInitials} tint="cyan" size="sm" />}
    >
      <div className="flex h-full">
        {/* left: what the assistant actually sees, and what it found */}
        <div className="flex w-[42%] shrink-0 flex-col border-r border-line-subtle bg-surface-raised">
          <div className="border-b border-line-subtle px-3 py-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-brand-emerald-strong" />
              <span className="text-[11px] font-semibold text-ink">{MERIDIAN_REPLY_LABELS.incomingTitle}</span>
            </div>
            <p className="mt-0.5 text-[9px] text-ink-tertiary">{MERIDIAN_REPLY_LABELS.incomingMeta}</p>
          </div>
          <div className="p-3" data-focus="incoming">
            <p className="rounded-xl rounded-tl-sm border border-line-subtle bg-white px-3 py-2.5 text-[10px] leading-relaxed text-ink-secondary">
              {MERIDIAN_INCOMING_STRIPPED.map((seg, i) =>
                'text' in seg ? (
                  <span key={i}>{seg.text}</span>
                ) : (
                  <span
                    key={i}
                    className="mx-px rounded border border-line bg-surface-overlay px-1 font-mono text-[9px] text-ink-secondary"
                  >
                    {seg.redacted}
                  </span>
                ),
              )}
            </p>
          </div>
          <div className="px-3" data-focus="sources">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
                {MERIDIAN_REPLY_LABELS.sourcesTitle}
              </span>
              <span className="text-[9px] text-ink-tertiary">{MERIDIAN_REPLY_LABELS.sourcesMeta}</span>
            </div>
            <ul className="space-y-1.5">
              {MERIDIAN_REPLY_SOURCES.map((s, i) => {
                const on = progress(u, 0.08 + i * 0.07, 0.2 + i * 0.07)
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 rounded-lg border border-line-subtle bg-white px-2 py-1.5"
                    style={{ opacity: on, transform: `translateY(${(1 - on) * 8}px)` }}
                  >
                    <CiteChip n={s.n} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-ink">{s.title}</p>
                      <p className="font-mono text-[9px] text-ink-tertiary">{s.id}</p>
                    </div>
                    <Badge tint="emerald" size="sm">
                      {s.match}%
                    </Badge>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* right: the draft and the review step */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2" data-focus="draft-header">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-brand-violet-strong" />
              <span className="text-[11px] font-semibold text-ink">{MERIDIAN_REPLY_LABELS.draftTitle}</span>
            </div>
            <div className="relative h-5 w-[120px]">
              <span
                className="absolute inset-0 flex items-center justify-end text-[10px] text-ink-tertiary"
                style={{ opacity: typing ? 1 : 0 }}
              >
                {MERIDIAN_REPLY_LABELS.drafting}
              </span>
              <span
                className="absolute inset-0 flex items-center justify-end gap-1.5"
                style={{ opacity: confidence, transform: `translateY(${(1 - confidence) * 4}px)` }}
              >
                <span className="text-[10px] text-ink-tertiary">{MERIDIAN_REPLY_LABELS.confidence}</span>
                <Badge tint="emerald" size="sm">
                  {MERIDIAN_REPLY_LABELS.confidenceValue}
                </Badge>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4" data-focus="draft">
            <div className="rounded-xl rounded-tr-sm border border-[rgba(124,58,237,0.22)] bg-white px-3.5 py-3">
              <p className="min-h-[88px] text-[11px] leading-relaxed text-ink">
                {draft}
                {typing ? (
                  <span
                    aria-hidden
                    className="ml-px inline-block h-[11px] w-[1.5px] translate-y-[2px] bg-brand-violet"
                  />
                ) : null}
              </p>
            </div>
            <div className="mt-3 px-1" style={{ opacity: gloss }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
                {MERIDIAN_REPLY_LABELS.glossTitle}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-tertiary">{MERIDIAN_REPLY_GLOSS}</p>
            </div>
          </div>

          {/* review step */}
          <div
            data-focus="review"
            className="flex items-center gap-3 border-t px-4 py-3"
            style={{
              borderColor: `rgba(124,58,237,${0.08 + 0.18 * waiting})`,
              background: `rgba(124,58,237,${0.035 * waiting})`,
            }}
          >
            <UserCheck className="h-4 w-4 shrink-0 text-brand-violet-strong" style={{ opacity: 0.4 + 0.6 * waiting }} />
            <div className="min-w-0 flex-1" style={{ opacity: 0.4 + 0.6 * waiting }}>
              <p className="text-[11px] font-semibold text-ink">{MERIDIAN_REPLY_LABELS.reviewTitle}</p>
              <p className="truncate text-[10px] text-ink-tertiary">{MERIDIAN_REPLY_LABELS.reviewReason}</p>
            </div>
            <div className="relative h-7 w-[150px] shrink-0">
              <span
                className="absolute inset-0 flex items-center justify-center rounded-lg text-[10px] font-medium text-white"
                style={{
                  background: 'var(--gradient-prism)',
                  opacity: (1 - approved) * (0.35 + 0.65 * waiting),
                  transform: `scale(${1 - 0.05 * Math.sin(Math.PI * press)})`,
                }}
              >
                {MERIDIAN_REPLY_LABELS.approveCta}
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg border text-[10px] font-medium"
                style={{
                  opacity: approved,
                  color: 'var(--emerald-strong)',
                  borderColor: 'rgba(74,222,128,0.4)',
                  background: 'rgba(74,222,128,0.10)',
                }}
              >
                <Check className="h-3 w-3" strokeWidth={2.5} />
                {MERIDIAN_REPLY_LABELS.approved}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProductAppShell>
  )
}

function CiteChip({ n, pop = 1 }: { n: number; pop?: number }) {
  // overshoot then settle: 0.4 -> 1.25 -> 1
  const scale = pop >= 1 ? 1 : pop < 0.6 ? 0.4 + (1.25 - 0.4) * (pop / 0.6) : 1.25 - 0.25 * ((pop - 0.6) / 0.4)
  return (
    <span
      className="mx-0.5 inline-flex h-[14px] min-w-[14px] items-center justify-center rounded px-1 align-[1px] font-mono text-[8.5px] font-semibold"
      style={{
        color: 'var(--cyan-strong)',
        background: 'rgba(45,212,191,0.14)',
        border: '1px solid rgba(45,212,191,0.35)',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        boxShadow: pop < 1 ? `0 0 ${8 * (1 - pop)}px rgba(45,212,191,${0.6 * (1 - pop)})` : undefined,
      }}
    >
      {n}
    </span>
  )
}
