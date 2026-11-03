'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/src/components/prism/motion/CountUp'
import { LegalCite } from './LegalCite'

type Tier = { amount: string; share: string; label: string; findings: readonly string[] }

const EASE = [0.23, 1, 0.32, 1] as const
// One hue (red: penalties), stepped by magnitude. Sequential, never a rainbow.
const OPACITY = [1, 0.62, 0.36]

/**
 * PenaltyScale: the three fine caps as a ledger. Left, what the fine is for and its source;
 * right, the cap in large tabular figures with the share of turnover set smaller and lighter.
 * Under each row a bar draws the cap to scale against the largest (EUR 35 million), so the gap
 * between tiers is seen, not only stated. The amount counts up and the bar draws from the
 * baseline as the row enters; under reduced motion both render at their final values.
 */
export function PenaltyScale({ tiers, orLabel, shareLabel }: { tiers: readonly Tier[]; orLabel: string; shareLabel: string }) {
  const reduce = useReducedMotion()
  const value = (s: string) => parseFloat(s.replace(/[^\d.]/g, ''))
  const max = Math.max(...tiers.map((t) => value(t.amount)))
  return (
    <ol className="border-t border-line">
      {tiers.map((t, i) => (
        <li key={t.amount} className="grid gap-x-10 gap-y-3 border-b border-line py-7 md:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)] md:items-end">
          <div className="min-w-0">
            <div className="text-base leading-7 text-ink">{t.label}</div>
            <LegalCite findings={t.findings} className="mt-1" />
          </div>
          <div className="md:text-right">
            <CountUp value={t.amount} className="tabular block font-display font-semibold tracking-tight text-ink [font-size:clamp(2.25rem,1.6rem+2.4vw,3.5rem)] [line-height:1]" />
            <div className="mt-2 text-sm text-ink-secondary">
              {orLabel} <span className="tabular font-semibold text-brand-red">{t.share}</span> {shareLabel}
            </div>
          </div>
          <div className="h-1.5 md:col-span-2" aria-hidden>
            <motion.div
              className="h-full origin-left bg-brand-red-strong"
              style={{ width: `${(value(t.amount) / max) * 100}%`, opacity: OPACITY[i] ?? 0.3 }}
              initial={{ scaleX: reduce ? 1 : 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 1.1, delay: reduce ? 0 : 0.1 + i * 0.12, ease: EASE }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
