'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/src/components/prism/motion/CountUp'
import { LegalCite } from './LegalCite'

type Tier = { amount: string; share: string; label: string; findings: readonly string[] }

const EASE = [0.23, 1, 0.32, 1] as const
// One hue (red: penalties), stepped by magnitude. Sequential, never a rainbow.
const OPACITY = [1, 0.62, 0.36]

/**
 * PenaltyScale: the three fine caps as one scale. Each bar's length is its cap relative to the
 * largest (EUR 35 million), so the gap between tiers is visible, not just stated. The amount
 * counts up and the bar grows from the baseline when the row enters the viewport; under reduced
 * motion both render at their final values.
 */
export function PenaltyScale({ tiers, orLabel, shareLabel }: { tiers: readonly Tier[]; orLabel: string; shareLabel: string }) {
  const reduce = useReducedMotion()
  const value = (s: string) => parseFloat(s.replace(/[^\d.]/g, ''))
  const max = Math.max(...tiers.map((t) => value(t.amount)))
  return (
    <ol className="space-y-9">
      {tiers.map((t, i) => (
        <li key={t.amount}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <CountUp value={t.amount} className="font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl" />
            <span className="text-base text-ink-secondary">
              {orLabel} <span className="font-semibold text-brand-red-strong">{t.share}</span> {shareLabel}
            </span>
          </div>
          <div className="mt-3 h-2.5" aria-hidden>
            <motion.div
              className="h-full origin-left rounded-full bg-brand-red-strong"
              style={{ width: `${(value(t.amount) / max) * 100}%`, opacity: OPACITY[i] ?? 0.3 }}
              initial={{ scaleX: reduce ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 1.2, delay: 0.1 + i * 0.12, ease: EASE }}
            />
          </div>
          <div className="mt-3 text-base leading-7 text-ink">{t.label}</div>
          <LegalCite findings={t.findings} className="mt-1" />
        </li>
      ))}
    </ol>
  )
}
