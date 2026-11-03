import { AlertTriangle, CheckCircle2, Shield, ShieldCheck, Sparkles, UserCheck } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import {
  MERIDIAN_INCOMING_STRIPPED,
  MERIDIAN_REPLY_DRAFT,
  MERIDIAN_REPLY_GLOSS,
  MERIDIAN_REPLY_LABELS,
  MERIDIAN_REPLY_SOURCES,
} from '@/src/meridian-assist-mock-content'

/**
 * The two shipped products, redrawn for this page at reading size (plan B3). The old page put
 * both 960x600 case-study mocks in the same laptop frame at about 0.4 scale: same chrome, same
 * density, 4px type. Here each product has its own frame language and accent (set by
 * DistinctProductFrame), its own density, and a layout that reflows instead of scaling:
 *
 * - Insurtech call reviews: an operator console. Dense, violet, a live transcript beside the
 *   real-time scores and the script checklist.
 * - Real-estate knowledge assistant: a reading pane. Airy, teal, one cited reply in German with
 *   its sources and the review step.
 *
 * Under 640px each shows a purpose-made crop (the scores and nudge; the reply and its review
 * step) instead of a desktop canvas scaled to an unreadable size. Interface content mirrors the
 * published case-study mocks (InsurtechLiveCallQa, ProptechCitedReply); it is illustrative.
 */

// Mirrors src/components/product-mocks/insurtech/InsurtechLiveCallQa.tsx.
const CALL = { title: 'Call #LC-88421 · Marcus T.', meta: 'Home renewal · transcribing live', rec: 'REC' }
const TRANSCRIPT = [
  { speaker: 'Agent', text: 'Good afternoon, thanks for calling, Marcus speaking. How can I help?' },
  { speaker: 'Customer', text: 'Hi, I need to understand if my renewal price is guaranteed until month-end.' },
  { speaker: 'Agent', text: 'Let me check your policy. You have a 14-day grace period on the quoted renewal rate.' },
  { speaker: 'Customer', text: 'And if I pay on the 31st, is that still within the window?' },
]
const SCORES = [
  { label: 'Call quality', value: 82, tone: 'text-[var(--lk-violet-text)]' },
  { label: 'Compliance', value: 74, tone: 'text-brand-amber-strong' },
  { label: 'TCF alignment', value: 88, tone: 'text-brand-emerald-strong' },
]
const SCRIPT = [
  { step: 'Verify identity', done: true },
  { step: 'Confirm renewal terms', done: true, active: true },
  { step: 'Disclose cooling-off rights', done: false },
  { step: 'Offer complaints path', done: false },
]
const TAGS = ['Identity verified', 'Fair value mention', 'Complaints path', 'GDPR basis']
const NUDGE = { lead: 'Compliance nudge:', body: 'Cooling-off rights not yet disclosed, required before payment discussion closes.' }
const LABELS = { scoring: 'Real-time scoring', script: 'Call script guidance', fca: 'FCA & data protection', outOf: '/ 100' }

const mini = 'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary'

export function InsurtechCallQaScreen() {
  return (
    <div className="grid text-ink sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Transcript: desktop and tablet only. */}
      <div className="hidden flex-col border-r border-line-subtle sm:flex">
        <div className="flex items-center justify-between gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{CALL.title}</div>
            <div className="text-[12px] text-ink-tertiary">{CALL.meta}</div>
          </div>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600 dark:text-red-400">● {CALL.rec}</span>
        </div>
        <div className="flex-1 space-y-2 p-4">
          {TRANSCRIPT.map((line, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[90%] rounded-lg border px-3 py-2',
                line.speaker === 'Agent' ? 'ml-auto border-[color:var(--pf-ring)] bg-[color:var(--pf-tint)]' : 'border-line-subtle',
              )}
            >
              <div className={mini}>{line.speaker}</div>
              <div className="mt-0.5 text-[12.5px] leading-snug">{line.text}</div>
            </div>
          ))}
        </div>
        <Nudge />
      </div>

      {/* Scores and the script: every width. On a phone this column is the whole screen. */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 border-b border-line-subtle px-4 py-3">
          <Sparkles aria-hidden className="h-4 w-4 text-[var(--lk-violet-text)]" />
          <span className="text-[13px] font-semibold">{LABELS.scoring}</span>
          <span className="ml-auto truncate text-[11px] text-ink-tertiary sm:hidden">{CALL.title}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          {SCORES.map((s) => (
            <div key={s.label} className="rounded-lg border border-line-subtle bg-surface-raised px-2 py-2.5 text-center">
              <div className="text-[10.5px] leading-tight text-ink-tertiary">{s.label}</div>
              <div className={cn('tabular mt-1 font-display text-[26px] font-semibold leading-none', s.tone)}>{s.value}</div>
              <div className="mt-0.5 text-[10.5px] text-ink-tertiary">{LABELS.outOf}</div>
            </div>
          ))}
        </div>
        <div className="px-4">
          <div className={cn(mini, 'mb-2')}>{LABELS.script}</div>
          <ul className="space-y-1.5">
            {SCRIPT.map((s) => (
              <li
                key={s.step}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px]',
                  s.active ? 'border-[color:var(--pf-ring)] font-medium' : 'border-line-subtle text-ink-secondary',
                )}
              >
                {s.done ? (
                  <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-brand-emerald-strong" />
                ) : (
                  <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border border-line-strong" />
                )}
                {s.step}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 hidden border-t border-line-subtle px-4 py-3 sm:block">
          <div className={cn(mini, 'mb-2 flex items-center gap-1.5')}>
            <Shield aria-hidden className="h-3.5 w-3.5" />
            {LABELS.fca}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((t, i) => (
              <span
                key={t}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium',
                  i < 2 ? 'bg-brand-emerald-strong/12 text-brand-emerald-strong' : 'bg-surface-overlay text-ink-secondary',
                )}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 sm:hidden">
          <Nudge />
        </div>
      </div>
    </div>
  )
}

function Nudge() {
  return (
    <div className="flex items-start gap-2 border-t border-line-subtle bg-amber-50 px-4 py-2.5 dark:bg-amber-500/10">
      <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber-strong" />
      <div className="text-[12px] leading-snug text-ink-secondary">
        <span className="font-semibold text-brand-amber-strong">{NUDGE.lead}</span> {NUDGE.body}
      </div>
    </div>
  )
}

function Cite({ n }: { n: number }) {
  return (
    <span className="mx-0.5 inline-grid h-[18px] min-w-[18px] place-items-center rounded-[5px] bg-[color:var(--pf-tint)] px-1 align-[2px] text-[11px] font-semibold text-[var(--lk-teal-text)]">
      {n}
    </span>
  )
}

export function RealEstateAnswerScreen() {
  return (
    <div className="grid text-ink sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
      {/* What the assistant sees, and what it found: desktop and tablet only. */}
      <div className="hidden border-r border-line-subtle bg-surface-raised sm:block">
        <div className="px-5 pt-5">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-secondary">
            <ShieldCheck aria-hidden className="h-4 w-4 text-[var(--lk-teal-text)]" />
            {MERIDIAN_REPLY_LABELS.incomingTitle}
          </div>
          <div className="mt-3 text-[13.5px] leading-relaxed text-ink-secondary">
            {MERIDIAN_INCOMING_STRIPPED.map((seg, i) =>
              'text' in seg ? (
                <span key={i}>{seg.text}</span>
              ) : (
                <span key={i} className="rounded bg-surface-overlay px-1 font-label text-[11.5px] text-ink-tertiary">
                  {seg.redacted}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="mt-5 border-t border-line-subtle px-5 py-4">
          <div className="text-[12px] font-semibold text-ink-secondary">{MERIDIAN_REPLY_LABELS.sourcesTitle}</div>
          <ul className="mt-2.5 space-y-2">
            {MERIDIAN_REPLY_SOURCES.map((s) => (
              <li key={s.id} className="flex items-start gap-2.5 rounded-lg border border-line-subtle bg-surface-base px-3 py-2">
                <Cite n={s.n} />
                <span className="text-[13px] leading-snug">
                  {s.title}
                  <span className="ml-1.5 font-label text-[11px] text-ink-tertiary">{s.id}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The cited reply and the review step: every width. */}
      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="text-[12px] font-semibold text-[var(--lk-teal-text)]">{MERIDIAN_REPLY_LABELS.draftTitle}</div>
        <div className="mt-3 text-[15.5px] leading-[1.6]">
          {MERIDIAN_REPLY_DRAFT.map((seg, i) => ('text' in seg ? <span key={i}>{seg.text}</span> : <Cite key={i} n={seg.cite} />))}
        </div>
        <div className="mt-4 border-l-2 border-[color:var(--pf-ring)] pl-3">
          <div className="text-[11.5px] font-semibold text-ink-tertiary">{MERIDIAN_REPLY_LABELS.glossTitle}</div>
          <div className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{MERIDIAN_REPLY_GLOSS}</div>
        </div>
        <div className="mt-5 rounded-xl border border-line bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <UserCheck aria-hidden className="h-4 w-4 text-[var(--lk-teal-text)]" />
            {MERIDIAN_REPLY_LABELS.reviewTitle}
          </div>
          <div className="mt-1 text-[13px] leading-snug text-ink-secondary">{MERIDIAN_REPLY_LABELS.reviewReason}</div>
          <div className="mt-3">
            <span className="inline-flex rounded-lg bg-[#0f766e] px-3.5 py-2 text-[13px] font-semibold text-white">{MERIDIAN_REPLY_LABELS.approveCta}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
