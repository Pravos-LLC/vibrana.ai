'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { PlanPhase, ReportRow } from '@/src/lib/eu-ai-act/report'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'
import { TONE } from '../tone'
import { StatusPill, formatDate } from './status'

const EASE = [0.23, 1, 0.32, 1] as const
const PHASES: PlanPhase[] = ['now', 'foundations', 'next']
// The three phases read as one progression: red (already applies) to amber to EU blue.
const PHASE_ACCENT: Record<PlanPhase, string> = {
  now: 'from-brand-red-strong to-brand-amber',
  foundations: 'from-brand-amber to-brand-cyan-strong',
  next: 'from-brand-cyan-strong to-eu-blue',
}

/**
 * ActionPlan: the open items in the suggested first-90-days order, in three phases. Numbering runs
 * across the phases because it is one sequence. Each item carries its status and the next step.
 */
export function ActionPlan({ plan }: { plan: Record<PlanPhase, ReportRow[]> }) {
  const reduce = useReducedMotion()
  const total = PHASES.reduce((n, p) => n + plan[p].length, 0)
  if (!total) return <div className="rounded-2xl border border-line-subtle bg-surface-base p-6 text-sm leading-6 text-ink-secondary">{R.labels.planEmpty}</div>
  const number = new Map(PHASES.flatMap((p) => plan[p]).map((r, i) => [r.def.id, i + 1]))
  return (
    <ol className="grid gap-4 lg:grid-cols-3">
      {PHASES.map((phase, pi) => (
        <motion.li
          key={phase}
          className="relative flex flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface-base"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : pi * 0.1, ease: EASE }}
        >
          <span aria-hidden className={cn('h-1 w-full bg-linear-to-r', PHASE_ACCENT[phase])} />
          <div className="p-5 md:p-6">
            <div className="font-mono text-xs font-semibold text-ink-tertiary">{R.labels.planPhases[phase].span}</div>
            <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">{R.labels.planPhases[phase].title}</h3>
            {plan[phase].length ? (
              <ol className="mt-5 space-y-5">
                {plan[phase].map((r) => (
                    <li key={r.def.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
                      <span className={cn('flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-semibold ring-1', TONE[r.tone].soft, TONE[r.tone].ring, TONE[r.tone].text)}>{number.get(r.def.id)}</span>
                      <div>
                        <div className="text-sm font-semibold leading-5 text-ink">{r.def.title}</div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusPill status={r.result.status} />
                          {r.result.appliesFrom && !r.result.inForce && <span className="text-xs text-ink-tertiary">{formatDate(r.result.appliesFrom)}</span>}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-ink-secondary">{r.def.action}</div>
                      </div>
                    </li>
                ))}
              </ol>
            ) : (
              <div className="mt-5 text-sm text-ink-tertiary">{R.labels.planPhaseEmpty}</div>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  )
}
