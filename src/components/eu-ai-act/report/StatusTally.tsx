'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ObligationStatus } from '@/src/lib/eu-ai-act/engine'
import { STATUS_ORDER } from '@/src/lib/eu-ai-act/report'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { STATUS } from './status'

const EASE = [0.23, 1, 0.32, 1] as const

/**
 * StatusTally: every obligation that applies, as one stacked bar split by status (2px surface
 * gaps between segments), with a count-and-label legend under it. Segments grow in sequence.
 */
export function StatusTally({ tally }: { tally: Record<ObligationStatus, number> }) {
  const reduce = useReducedMotion()
  const total = STATUS_ORDER.reduce((n, s) => n + tally[s], 0)
  const present = STATUS_ORDER.filter((s) => tally[s] > 0)
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2 className="font-display text-lg! font-semibold tracking-tight text-ink">{R.labels.tally}</h2>
        <span className="text-sm text-ink-secondary">{R.labels.tallyCount(total)}</span>
      </div>
      <div className="mt-6 flex h-5 gap-[2px]" aria-hidden>
        {present.map((s, i) => (
          <motion.div
            key={s}
            className={`h-full origin-left first:rounded-l-full last:rounded-r-full ${STATUS[s].fill}`}
            style={{ flexGrow: tally[s], flexBasis: 0 }}
            initial={{ scaleX: reduce ? 1 : 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.4 + i * 0.15, ease: EASE }}
          />
        ))}
      </div>
      <ul className="mt-auto grid grid-cols-2 gap-x-6 gap-y-4 pt-6 sm:grid-cols-4">
        {STATUS_ORDER.map((s) => {
          const Icon = STATUS[s].icon
          return (
            <li key={s} className={tally[s] ? '' : 'opacity-45'}>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-5 w-5 ${STATUS[s].text}`} aria-hidden strokeWidth={2.25} />
                <span className="font-display text-4xl font-semibold leading-none tabular-nums text-ink">{tally[s]}</span>
              </div>
              <div className="mt-1.5 text-sm text-ink-secondary">{R.statusLabels[s]}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
