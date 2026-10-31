'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LegalCite } from './LegalCite'
import { TONE } from './tone'
import { cn } from '@/src/components/prism/utils/cn'
import type { EUMilestone } from '@/src/eu-ai-act-readiness-content'

const DAY = 86_400_000

/** Today, read after mount: the page is prerendered, so a build-time date would go stale. */
export function useToday(): string | null {
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), [])
  return today
}

/**
 * ComplianceTimeline: the Act's application dates on one proportional track (desktop) or a
 * list (mobile). Past dates are solid, the next one is highlighted, later ones are outlined, and
 * a marker shows today. Every milestone carries its citation.
 */
export function ComplianceTimeline({ milestones, todayLabel }: { milestones: readonly EUMilestone[]; todayLabel: string }) {
  const today = useToday()
  const reduce = useReducedMotion()
  const start = Date.parse(milestones[0].date) - 120 * DAY
  const end = Date.parse(milestones[milestones.length - 1].date) + 120 * DAY
  const pos = (iso: string) => ((Date.parse(iso) - start) / (end - start)) * 100
  const next = today ? milestones.find((m) => m.date > today)?.date : undefined
  const state = (m: EUMilestone) => (!today ? 'future' : m.date <= today ? 'past' : m.date === next ? 'next' : 'future')
  const todayPos = today ? Math.min(100, Math.max(0, pos(today))) : null
  const firstYear = new Date(start).getUTCFullYear() + 1
  const years = Array.from({ length: new Date(end).getUTCFullYear() - firstYear + 1 }, (_, i) => firstYear + i)

  return (
    <div>
      {/* Desktop: proportional track */}
      <div className="relative hidden h-20 lg:block" aria-hidden>
        <div className="absolute inset-x-0 top-7 h-px bg-line" />
        {/* The span each tier's duties have applied for: colored from its date to the end. */}
        {years.map((y) => (
          <span key={y} className="absolute top-12 -translate-x-1/2 font-mono text-xs text-ink-tertiary" style={{ left: `${pos(`${y}-01-01`)}%` }}>
            {y}
          </span>
        ))}
        {todayPos !== null && (
          <>
            <motion.div
              className="absolute top-[27px] h-[3px] origin-left rounded-full"
              style={{ left: 0, width: `${todayPos}%`, background: 'linear-gradient(90deg, var(--red-strong), var(--eu-ink))' }}
              initial={{ scaleX: reduce ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}
            />
            <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${todayPos}%` }}>
              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-base">{todayLabel}</span>
              <span className="h-3 w-px bg-ink" />
            </div>
          </>
        )}
        {milestones.map((m, i) => (
          <motion.span
            key={m.date}
            className="absolute top-7 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos(m.date)}%` }}
            initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, delay: reduce ? 0 : 0.2 + i * 0.12, ease: [0.23, 1, 0.32, 1] }}
          >
            {state(m) === 'next' && !reduce && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-40', TONE[m.tone].fill)} />}
            <span
              className={cn(
                'relative block h-3.5 w-3.5 rounded-full border-2',
                state(m) === 'future' ? 'bg-surface-base' : TONE[m.tone].fill,
                state(m) === 'next' && 'ring-4 ring-offset-0',
                state(m) === 'next' && TONE[m.tone].ring,
              )}
              style={{ borderColor: TONE[m.tone].hex }}
            />
          </motion.span>
        ))}
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:mt-6 lg:grid-cols-3">
        {milestones.map((m) => (
          <li key={m.date} className={cn('relative flex flex-col bg-surface-base p-5 pt-6', state(m) === 'next' && TONE[m.tone].soft)}>
            <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', TONE[m.tone].fill, state(m) === 'future' && 'opacity-35')} />
            <div
              className={cn(
                'font-mono text-xs font-semibold uppercase tracking-wider',
                state(m) === 'past' ? 'text-ink-tertiary' : state(m) === 'next' ? TONE[m.tone].text : 'text-ink-secondary',
              )}
            >
              {m.dateLabel}
            </div>
            <h3 className={cn('mt-2 font-display text-lg font-semibold leading-snug', state(m) === 'past' ? 'text-ink-secondary' : 'text-ink')}>{m.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">{m.body}</p>
            <LegalCite findings={m.findings} className="mt-auto pt-3" />
          </li>
        ))}
      </ol>
    </div>
  )
}

/** The hero panel: the next date in the Act and how many days away it is. */
export function NextDatePanel({ milestones, label, daysLabel, footnote, className, compact = false }: { milestones: readonly EUMilestone[]; label: string; daysLabel: string; footnote: string; className?: string; compact?: boolean }) {
  const today = useToday()
  const upcoming = today ? milestones.filter((m) => m.date > today) : milestones.slice(-3)
  const next = upcoming[0]
  const days = today && next ? Math.ceil((Date.parse(next.date) - Date.parse(today)) / DAY) : null
  return (
    <div className={cn('rounded-2xl border border-line-subtle bg-surface-frost p-6 backdrop-blur-md md:p-8', className)}>
      <div className="text-xs font-medium uppercase tracking-wider text-ink-tertiary">{label}</div>
      {next && (
        <>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-6xl font-semibold tabular-nums tracking-tight text-ink md:text-7xl">{days ?? ' '}</span>
            {days !== null && <span className="text-base text-ink-secondary">{daysLabel}</span>}
          </div>
          <div className={cn('mt-2 font-mono text-sm font-semibold uppercase tracking-wider', TONE[next.tone].text)}>{next.dateLabel}</div>
          <div className="mt-1 font-display text-xl font-semibold text-ink">{next.title}</div>
          {!compact && <p className="mt-2 text-sm leading-6 text-ink-secondary">{next.body}</p>}
          <ul className={cn('space-y-2 border-t border-line-subtle pt-5', compact ? 'hidden' : 'mt-6')}>
            {upcoming.slice(1, 3).map((m) => (
              <li key={m.date} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-ink">{m.title}</span>
                <span className="whitespace-nowrap font-mono text-xs text-ink-tertiary">{m.dateLabel}</span>
              </li>
            ))}
          </ul>
          <LegalCite findings={next.findings} className={compact ? 'mt-3' : 'mt-5'} />
        </>
      )}
      <div className="mt-2 text-xs leading-5 text-ink-tertiary">{footnote}</div>
    </div>
  )
}
