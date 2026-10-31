'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'

const EASE = [0.23, 1, 0.32, 1] as const
const C = 160
const MAX = 112

type Section = EUProfile['sectionScores'][number]

const levelOf = (s: number) => (s >= 75 ? 'advanced' : s >= 45 ? 'developing' : 'early')

/**
 * SectionRadar: the five control-area scores on one radar (EU blue, one series), with rings at
 * 25/50/75/100, and the same scores as a labeled list beside it so no value depends on reading the
 * shape. A section with no scored answers plots at zero and reads "-" in the list. The polygon
 * grows out from the center on view.
 */
export function SectionRadar({ sections }: { sections: readonly Section[] }) {
  const reduce = useReducedMotion()
  const n = sections.length
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [C + (v / 100) * MAX * Math.cos(a), C + (v / 100) * MAX * Math.sin(a)] as const
  }
  const ring = (v: number) => sections.map((_, i) => pt(i, v).join(',')).join(' ')
  const shape = sections.map((s, i) => pt(i, s.score ?? 0).join(',')).join(' ')

  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className="mx-auto block w-full max-w-[380px] overflow-visible" aria-hidden>
        {[25, 50, 75, 100].map((v) => (
          <polygon key={v} points={ring(v)} fill={v === 100 ? 'var(--eu-ink)' : 'none'} fillOpacity={0.03} stroke="var(--border-default)" strokeWidth={1} />
        ))}
        {sections.map((_, i) => {
          const [x, y] = pt(i, 100)
          return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
        })}
        <motion.g
          style={{ transformOrigin: `${C}px ${C}px` }}
          initial={{ scale: reduce ? 1 : 0.2, opacity: reduce ? 1 : 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <polygon points={shape} fill="var(--eu-ink)" fillOpacity={0.14} stroke="var(--eu-ink)" strokeWidth={2} strokeLinejoin="round" />
          {sections.map((s, i) => {
            const [x, y] = pt(i, s.score ?? 0)
            return <circle key={s.key} cx={x} cy={y} r={5} fill="var(--eu-ink)" stroke="var(--surface-base)" strokeWidth={2} />
          })}
        </motion.g>
        {sections.map((s, i) => {
          const [x, y] = pt(i, 100)
          const dx = x - C
          const anchor = Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end'
          const [lx, ly] = pt(i, 122)
          return (
            <text key={s.key} x={lx} y={ly + (y < C - 10 ? -4 : y > C + 10 ? 12 : 4)} textAnchor={anchor} className="fill-[color:var(--text-secondary)] text-[11px] font-medium">
              {s.title}
            </text>
          )
        })}
      </svg>
      <ol className="space-y-5">
        {sections.map((s, i) => (
          <li key={s.key}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm font-medium text-ink">{s.title}</span>
              <span className="font-display text-xl font-semibold tabular-nums text-ink">
                {s.score ?? '-'}
                {s.score !== null && <span className="ml-1.5 font-sans text-xs font-medium text-ink-tertiary">{R.readinessLabels[levelOf(s.score)]}</span>}
              </span>
            </div>
            <div className="mt-2 h-1.5" aria-hidden>
              <motion.div
                className="h-full origin-left rounded-full bg-eu-ink"
                style={{ width: `${s.score ?? 0}%`, opacity: 0.35 + ((s.score ?? 0) / 100) * 0.65 }}
                initial={{ scaleX: reduce ? 1 : 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.8, delay: reduce ? 0 : i * 0.08, ease: EASE }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
