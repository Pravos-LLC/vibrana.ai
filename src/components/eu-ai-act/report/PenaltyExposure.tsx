'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { capRule, linkedPenalties } from '@/src/lib/eu-ai-act/report'
import { EU_PENALTIES as P, EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'
import { LegalCite } from '../LegalCite'

const EASE = [0.23, 1, 0.32, 1] as const

/**
 * PenaltyExposure: the Act's three fine caps on one red scale (bar length is the cap relative to
 * EUR 35 million), with the caps the answers point at marked; the others recede (bar and amount
 * only, so the label and source keep full contrast). Under each cap, which figure applies for the
 * company's size band (capRule): SMEs get the lower figure for all three (Art. 99(6)); small
 * mid-caps get it for 99(4) and 99(5) but not the prohibited-practice fine (Art. 99(6a)). Beside
 * it, the cited size rule. Every amount comes from EU_PENALTIES, which the evidence test checks
 * against the quoted provisions.
 */
export function PenaltyExposure({ profile }: { profile: EUProfile }) {
  const reduce = useReducedMotion()
  const linked = linkedPenalties(profile)
  const caps = capRule(profile.sizeBand)
  const value = (s: string) => parseFloat(s.replace(/[^\d.]/g, ''))
  const max = Math.max(...P.tiers.map((t) => value(t.amount)))
  const size = profile.sizeBand === 'sme' ? P.size.items[0] : profile.sizeBand === 'smc' ? P.size.items[1] : null

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-line-subtle bg-surface-base p-6 md:p-7">
        <div className="text-sm leading-6 text-ink-secondary">{P.intro}</div>
        <ol className="mt-6 space-y-7">
          {P.tiers.map((t, i) => (
            <li key={t.amount}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={cn('font-display text-3xl font-semibold tracking-tight', linked[i] ? 'text-ink' : 'text-ink-secondary')}>{t.amount}</span>
                <span className="text-sm text-ink-secondary">
                  {P.orLabel} <span className="font-semibold text-brand-red-strong">{t.share}</span> {P.shareLabel}
                </span>
                {linked[i] && <span className="rounded-full bg-brand-red/[0.08] px-2.5 py-0.5 text-xs font-semibold text-brand-red-strong ring-1 ring-brand-red-strong/25">{R.labels.linked}</span>}
              </div>
              <div className="mt-2.5 h-2.5" aria-hidden>
                <motion.div
                  className="h-full origin-left rounded-r-full bg-brand-red-strong"
                  style={{ width: `${(value(t.amount) / max) * 100}%`, opacity: ([1, 0.62, 0.36][i] ?? 0.3) * (linked[i] ? 1 : 0.55) }}
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ duration: 1, delay: reduce ? 0 : 0.1 + i * 0.12, ease: EASE }}
                />
              </div>
              <div className="mt-2 text-sm leading-6 text-ink">{t.label}</div>
              {caps && (
                <div className="mt-1 text-sm font-semibold text-ink">{caps[i] === 'lower' ? R.labels.capLower : R.labels.capHigher}</div>
              )}
              <LegalCite findings={t.findings} className="mt-0.5" />
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col rounded-2xl border border-line-subtle bg-linear-to-br from-brand-red/[0.06] via-surface-base to-eu-ink/[0.05] p-6 md:p-7">
        <div className="text-sm font-semibold text-ink">{R.labels.sizeTitle}</div>
        <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{R.sizeLabels[profile.sizeBand]}</div>
        {size ? (
          <>
            <div className="mt-3 text-sm leading-6 text-ink-secondary">{size.body}</div>
            <LegalCite findings={size.findings} className="mt-3" />
          </>
        ) : (
          <div className="mt-3 text-sm leading-6 text-ink-secondary">{R.labels.sizeCheck}</div>
        )}
        <div className="mt-auto pt-6">
          <div className="border-t border-line-subtle pt-4 text-xs leading-5 text-ink-tertiary">{P.size.note}</div>
        </div>
      </div>
    </div>
  )
}
