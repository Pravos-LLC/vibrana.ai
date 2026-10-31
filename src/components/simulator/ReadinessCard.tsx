'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { readinessBand } from '@/src/lib/simulator/readiness'
import type { SimulatorResult } from '@/src/lib/simulator/types'
import { SIM_READINESS } from '@/src/simulator-content'
import { panel } from './ResultView'

const R = SIM_READINESS.card
const SIZE = 84
const STROKE = 7
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

/** Self-reported baseline: a score ring, what it changes in the model, and a quiet link to the full assessment. */
export function ReadinessCard({ result, assessmentHref, onSetBaseline }: { result: SimulatorResult; assessmentHref: string; onSetBaseline?: () => void }) {
  const reduce = useReducedMotion()
  const rd = result.resolved.readiness
  const score = rd.score
  const t0 = result.resolved.adoptionCurve.t0
  const typical = t0 / rd.t0Multiplier
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString()

  return (
    <div className={`${panel} p-5`}>
      <p className="type-xs font-medium text-ink-tertiary">{R.title}</p>
      {score === null ? (
        <>
          <p className="mt-2 type-sm leading-relaxed text-ink-secondary">{R.neutral}</p>
          {onSetBaseline && (
            <button type="button" onClick={onSetBaseline} className="btn-secondary btn-sm mt-3">
              {R.answer}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative flex-none" style={{ width: SIZE, height: SIZE }}>
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
                <defs>
                  <linearGradient id="sim-readiness-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
                <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-[rgba(120,120,140,0.2)]" />
                <motion.circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="url(#sim-readiness-ring)"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: reduce ? CIRC * (1 - score / 100) : CIRC }}
                  animate={{ strokeDashoffset: CIRC * (1 - score / 100) }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display type-2xl font-semibold tabular-nums text-ink">{score}</span>
            </div>
            <div className="min-w-0">
              <p className="font-display type-lg font-semibold text-ink">{R.bands[readinessBand(score)]}</p>
              <p className="type-xs text-ink-tertiary">
                {score} {R.outOf}
              </p>
            </div>
          </div>
          <p className="mt-3 type-sm leading-relaxed text-ink-secondary">{R.effect(fmt(t0), fmt(typical), fmt(result.resolved.trainingHoursPerPerson))}</p>
        </>
      )}
      <a href={assessmentHref} className="mt-3 inline-flex items-center gap-1 type-xs font-medium text-ink-secondary underline-offset-4 hover:text-ink hover:underline">
        {R.cta}
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </a>
    </div>
  )
}
