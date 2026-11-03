'use client'

import { motion } from 'framer-motion'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { HEADLINE_MONTH, MONTHS } from '@/src/lib/simulator/engine'
import type { SimulatorResult } from '@/src/lib/simulator/types'

const W = 600
const H = 96
const PAD = { top: 8, bottom: 6 }
const x = (t: number) => (t / MONTHS) * W
const y = (share: number) => PAD.top + (1 - share) * (H - PAD.top - PAD.bottom)

/**
 * The roadmap as a strip: the share of people using AI each month of the central scenario,
 * straight from the engine's adoption curve. A dot marks the month half of them get there; the
 * dashed line marks month 12, where the counters are read. Reflows when sector, size or pace change.
 */
export function RoadmapStrip({ result, label, caption, ghost }: { result: SimulatorResult; label: string; caption: string; /** A second run drawn as a dashed line, for comparison. */ ghost?: SimulatorResult }) {
  const reduce = useHydratedReducedMotion()
  const path = (r: SimulatorResult) =>
    r.scenarios.central.months.map((m, i) => `${i === 0 ? 'M' : 'L'}${x(m.month).toFixed(1)},${y(m.adoption).toFixed(1)}`).join(' ')
  const line = path(result)
  const area = `${line} L${W},${H} L0,${H} Z`
  const curve = result.resolved.adoptionCurve
  const half = { t: curve.t0, share: curve.aMax / 2 }
  const transition = reduce ? { duration: 0 } : { duration: 0.38, ease: [0.23, 1, 0.32, 1] as const }

  return (
    <figure className="m-0">
      <figcaption className="label-mono mb-2 text-ink-tertiary">{caption}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-20 w-full overflow-visible text-brand-violet-strong" role="img" aria-label={label}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} stroke="var(--border-subtle)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        {ghost && <path d={path(ghost)} fill="none" stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        <motion.path initial={false} animate={{ d: area }} transition={transition} fill="currentColor" fillOpacity={0.1} />
        <motion.path initial={false} animate={{ d: line }} transition={transition} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <line x1={x(HEADLINE_MONTH)} x2={x(HEADLINE_MONTH)} y1={0} y2={H} stroke="var(--text-tertiary)" strokeWidth={1} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The half-adoption marker sits in HTML so it stays round when the strip stretches. */}
      <div className="relative -mt-20 h-20" aria-hidden>
        <motion.span
          className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-base bg-brand-violet-strong"
          initial={false}
          animate={{ left: `${(half.t / MONTHS) * 100}%`, top: `${(y(half.share) / H) * 100}%` }}
          transition={transition}
        />
      </div>
      <div className="relative mt-1.5 h-4 text-ink-tertiary" aria-hidden>
        {[0, 6, 12, 18, 24].map((t) => (
          <span
            key={t}
            className={`label-mono absolute top-0 tabular ${t === 0 ? '' : t === MONTHS ? '-translate-x-full' : '-translate-x-1/2'} ${t === HEADLINE_MONTH ? 'text-ink' : ''}`}
            style={{ left: `${(t / MONTHS) * 100}%` }}
          >
            {t}
          </span>
        ))}
      </div>
    </figure>
  )
}
