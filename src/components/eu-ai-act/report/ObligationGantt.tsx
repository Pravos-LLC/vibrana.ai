'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReportRow } from '@/src/lib/eu-ai-act/report'
import { STATUS_ORDER } from '@/src/lib/eu-ai-act/report'
import { EU_RESULTS as R, EU_TIERS } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'
import { TONE } from '../tone'
import { STATUS, formatDate } from './status'

const EASE = [0.23, 1, 0.32, 1] as const
const START = Date.parse('2025-01-01T00:00:00Z')
const END = Date.parse('2028-04-01T00:00:00Z')
const YEARS = [2025, 2026, 2027, 2028]
const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(`${iso}T00:00:00Z`) - START) / (END - START)) * 100))
const hatch = (c: string) => `repeating-linear-gradient(135deg, ${c} 0 5px, transparent 5px 9px)`

function Grid({ today }: { today: number }) {
  return (
    <>
      {YEARS.map((y) => (
        <span key={y} aria-hidden className="absolute inset-y-0 w-px bg-line-subtle" style={{ left: `${pos(`${y}-01-01`)}%` }} />
      ))}
      <span aria-hidden className="absolute inset-y-0 z-10 w-[2px] -translate-x-1/2 bg-eu-ink" style={{ left: `${today}%` }} />
    </>
  )
}

/**
 * ObligationGantt: every obligation that applies on one time axis, January 2025 to spring 2028.
 * A bar starts on the date the obligation applies and runs on (the duty does not end); its color
 * is the status from the answers. A thin runway leads from today to a date still ahead. Undated
 * items are hatched from today. A blue line marks today, and the right column
 * counts the days left. The tier square before each title is the tier's color.
 */
export function ObligationGantt({ rows, today: todayIso }: { rows: readonly ReportRow[]; today: string }) {
  const reduce = useReducedMotion()
  const today = pos(todayIso)
  const tones = EU_TIERS.tiers.filter((t) => rows.some((r) => r.tone === t.tone))
  const statuses = STATUS_ORDER.filter((s) => rows.some((r) => r.result.status === s))

  return (
    <figure aria-label={R.labels.timeline}>
      {/* legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-secondary">
        {statuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-2">
            <span aria-hidden className={cn('h-2.5 w-5 rounded-full', STATUS[s].fill)} />
            {R.statusLabels[s]}
          </span>
        ))}
        {rows.some((r) => r.days === null) && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-2.5 w-5 rounded-full ring-1 ring-ink/20" style={{ backgroundImage: hatch('var(--text-tertiary)') }} />
            {R.labels.undated}
          </span>
        )}
        <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
        {tones.map((t) => (
          <span key={t.tone} className="inline-flex items-center gap-2">
            <span aria-hidden className={cn('h-2.5 w-2.5 rounded-[3px]', TONE[t.tone].fill)} />
            {t.label}
          </span>
        ))}
      </div>

      {/* axis */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_7.5rem] md:gap-x-6">
        <div className="hidden md:block" />
        <div className="relative h-12">
          {YEARS.map((y) => (
            <span key={y} className="absolute bottom-1 -translate-x-1/2 font-mono text-[11px] text-ink-tertiary first:translate-x-0" style={{ left: `${pos(`${y}-01-01`)}%` }}>
              {y}
            </span>
          ))}
          <span className="absolute top-0 z-10 -translate-x-1/2 rounded-full bg-eu-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white" style={{ left: `${today}%` }}>
            {R.labels.today}
          </span>
        </div>
        <div className="hidden md:block" />
      </div>

      <ol>
        {rows.map((r, i) => {
          const s = STATUS[r.result.status]
          const start = r.result.appliesFrom ? pos(r.result.appliesFrom) : today
          const ahead = r.days !== null && r.days > 0
          return (
            <li key={r.def.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t border-line-subtle py-3 first:border-t-0 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_7.5rem] md:gap-x-6 md:border-t-0 md:py-0">
              <div className="min-w-0 md:py-2.5">
                <div className="flex items-start gap-2">
                  <span aria-hidden className={cn('mt-[5px] h-2.5 w-2.5 flex-none rounded-[3px]', TONE[r.tone].fill)} />
                  <span className="text-sm font-medium leading-5 text-ink">{r.def.title}</span>
                </div>
                <div className="ml-[18px] mt-0.5 text-xs text-ink-tertiary">{r.result.appliesFrom ? formatDate(r.result.appliesFrom) : R.labels.undated}</div>
              </div>
              <div className="order-last col-span-2 mt-2 md:order-none md:col-span-1 md:mt-0 md:self-stretch">
                <div className="relative h-7 md:h-full md:min-h-14">
                  <Grid today={today} />
                  {ahead && (
                    <span aria-hidden className="absolute top-1/2 h-[2px] -translate-y-1/2 opacity-50" style={{ left: `${today}%`, width: `${start - today}%`, background: s.hex }} />
                  )}
                  <motion.span
                    aria-hidden
                    className="absolute top-1/2 h-3 origin-left -translate-y-1/2 rounded-r-full"
                    style={{
                      left: `${start}%`,
                      right: 0,
                      ...(r.days === null ? { backgroundImage: hatch(s.hex), boxShadow: `inset 0 0 0 1px ${s.hex}` } : { background: s.hex }),
                    }}
                    initial={{ scaleX: reduce ? 1 : 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.8, delay: reduce ? 0 : 0.1 + i * 0.06, ease: EASE }}
                  />
                  {r.days !== null && (
                    <span
                      aria-hidden
                      className="absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-base"
                      style={{ left: `${start}%`, background: s.hex }}
                    />
                  )}
                </div>
              </div>
              <div className="text-right md:py-2.5">
                {ahead ? (
                  <span className="font-display text-base font-semibold tabular-nums text-ink">{R.labels.daysLeft(r.days!)}</span>
                ) : (
                  <span className={cn('text-xs font-semibold', r.days === null ? 'text-ink-tertiary' : 'text-ink-secondary')}>{r.days === null ? R.labels.undated : R.labels.inForceShort}</span>
                )}
                <span className={cn('mt-0.5 flex items-center justify-end gap-1 text-xs font-medium', s.text)}>
                  <s.icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.25} />
                  {R.statusLabels[r.result.status]}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
