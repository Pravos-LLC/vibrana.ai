'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { LegalCite } from './LegalCite'

type Chart = {
  title: string
  infringement: string
  step: string
  window: string
  restart: string
  cap: string
  now: string
  drafted: string
  findings: readonly string[]
}

const EASE = [0.23, 1, 0.32, 1] as const
const SPAN = 10.6 // the track, in "periods / 2": 5 = one window, 10 = the drafted outer limit
const pct = (t: number) => `${((t / SPAN) * 100).toFixed(3)}%`

/**
 * ClockChart: an illustration of the October 2026 draft, not a timeline of real events. Top: the
 * Act today, one five-year window from the infringement. Bottom: as drafted, two investigative
 * steps each restart the window, and the outer limit (twice the period) caps it. The drafted
 * row is hatched, the way a draft is: it is not law. Bars draw in sequence on scroll.
 */
export function ClockChart({ chart }: { chart: Chart }) {
  const reduce = useReducedMotion()
  const steps = [2.2, 4.6]
  const draftWindows = [
    [0, 2.2],
    [2.2, 4.6],
    [4.6, 9.6],
  ]
  const grow = (delay: number) => ({
    initial: { scaleX: reduce ? 1 : 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.7, delay: reduce ? 0 : delay, ease: EASE },
  })
  const hatch = 'repeating-linear-gradient(135deg, var(--eu-ink) 0 6px, transparent 6px 10px)'

  return (
    <figure className="rounded-2xl border border-line-subtle bg-surface-base p-6 md:p-8">
      <figcaption className="font-display text-lg font-semibold tracking-tight text-ink">{chart.title}</figcaption>
      <div className="relative mt-8 space-y-9">
        <div aria-hidden className="pointer-events-none absolute -top-2 bottom-6 border-l border-dashed border-ink/40" style={{ left: pct(10) }} />
        {/* The Act today */}
        <div>
          <div className="text-sm font-medium text-ink">{chart.now}</div>
          <div aria-hidden className="relative mt-3 h-3">
            <motion.div className="absolute inset-y-0 origin-left rounded-full bg-eu-ink" style={{ left: 0, width: pct(5) }} {...grow(0.1)} />
          </div>
        </div>
        {/* As drafted */}
        <div>
          <div className="text-sm font-medium text-ink">{chart.drafted}</div>
          <div aria-hidden className="relative mt-3 h-3">
            {draftWindows.map(([a, b], i) => (
              <motion.div
                key={a}
                className="absolute inset-y-0 origin-left rounded-full opacity-80"
                style={{ left: pct(a), width: `calc(${pct(b - a)} - 3px)`, backgroundImage: hatch, boxShadow: 'inset 0 0 0 1px var(--eu-ink)' }}
                {...grow(0.5 + i * 0.45)}
              />
            ))}
            {steps.map((s, i) => (
              <motion.span
                key={s}
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-surface-base bg-ink"
                style={{ left: pct(s) }}
                initial={{ opacity: reduce ? 1 : 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: reduce ? 0 : 0.9 + i * 0.45 }}
              />
            ))}
          </div>
        </div>
        {/* shared axis: the infringement, and the outer limit */}
        <div className="relative h-10 text-xs text-ink-tertiary">
          <span className="absolute left-0 top-0">{chart.infringement}</span>
          <span className="absolute top-0 hidden -translate-x-1/2 whitespace-nowrap sm:block" style={{ left: pct(5) }}>
            {chart.window}
          </span>
          <span className="absolute top-0 whitespace-nowrap pr-2 text-right font-medium text-ink" style={{ right: `${(100 - (10 / SPAN) * 100).toFixed(3)}%` }}>
            {chart.cap}
          </span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line-subtle pt-4 text-xs text-ink-secondary">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-ink" />
          {chart.step}: {chart.restart.toLowerCase()}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="h-2.5 w-5 rounded-full opacity-80" style={{ backgroundImage: hatch, boxShadow: 'inset 0 0 0 1px var(--eu-ink)' }} />
          {chart.drafted}
        </span>
      </div>
      <LegalCite findings={chart.findings} className="mt-3" />
    </figure>
  )
}
