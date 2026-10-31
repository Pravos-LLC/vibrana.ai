'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Fingerprint, GraduationCap, Landmark, Users, type LucideIcon } from 'lucide-react'
import type { EUProfile, HighRiskArea } from '@/src/lib/eu-ai-act/engine'
import { tierTone } from '@/src/lib/eu-ai-act/report'
import { EU_RESULTS as R, EU_TIERS } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'
import { TONE } from '../tone'

const EASE = [0.23, 1, 0.32, 1] as const
const AREAS: { area: HighRiskArea; icon: LucideIcon }[] = [
  { area: 'employment', icon: Users },
  { area: 'credit-insurance', icon: Landmark },
  { area: 'education', icon: GraduationCap },
  { area: 'sensitive', icon: Fingerprint },
]

/**
 * ExposureMap: where the answers put the company. Left, the Act's four tiers as a stepped
 * pyramid with the company's own tier lit (and the prohibited band lit too when an answer
 * suggests a banned practice); the others recede. Right, the four Annex III areas the assessment
 * asks about, lit amber where AI is in use, piloted or planned.
 */
export function ExposureMap({ profile }: { profile: EUProfile }) {
  const reduce = useReducedMotion()
  const mine = tierTone(profile.riskTier)
  const tiers = EU_TIERS.tiers
  const n = tiers.length
  const band = (i: number) => {
    const top = 36 - (i / n) * 36
    const bottom = 36 - ((i + 1) / n) * 36
    return `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% calc(100% - 4px), ${bottom}% calc(100% - 4px))`
  }
  const levelOf = (a: HighRiskArea) => profile.highRisk.find((h) => h.area === a)?.level

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-2xl border border-line-subtle bg-surface-base p-6">
        <ol className="space-y-0">
          {tiers.map((t, i) => {
            const on = t.tone === mine || (t.tone === 'prohibited' && profile.prohibitedFlag)
            return (
              <li key={t.tone} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <motion.div
                  className="relative h-14"
                  initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: reduce ? 0 : (n - 1 - i) * 0.1, ease: EASE }}
                >
                  <div className={cn('absolute inset-0', TONE[t.tone].fill, !on && 'opacity-[0.16]')} style={{ clipPath: band(i) }} />
                  {on && (
                    <div
                      className="absolute inset-0 mix-blend-soft-light"
                      style={{ clipPath: band(i), background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0) 75%)' }}
                    />
                  )}
                  <span
                    className={cn('absolute inset-0 flex items-center justify-center pb-1 font-display text-sm font-semibold', !on && 'text-ink-tertiary')}
                    style={on ? { color: t.tone === 'high-risk' ? 'rgba(15,15,17,0.9)' : '#fff' } : undefined}
                  >
                    {t.label}
                  </span>
                </motion.div>
                <span className={cn('w-24 text-xs font-semibold', on ? TONE[t.tone].text : 'invisible')} aria-hidden={!on}>
                  {on && `← ${R.labels.yourTier}`}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="mt-5 border-t border-line-subtle pt-4 text-sm leading-6 text-ink-secondary">
          <span className="font-semibold text-ink">{R.tierLabels[profile.riskTier]}. </span>
          {R.scopeBodies[profile.scope]}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-ink">{R.labels.areasTitle}</div>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {AREAS.map(({ area, icon: Icon }, i) => {
            const level = levelOf(area)
            return (
              <motion.li
                key={area}
                className={cn(
                  'relative flex min-h-36 flex-col overflow-hidden rounded-2xl border p-4 md:p-5',
                  level ? 'border-brand-amber/50 bg-brand-amber/[0.09]' : 'border-line-subtle bg-surface-base',
                )}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.1 + i * 0.07, ease: EASE }}
              >
                {level && <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-amber/30 blur-2xl" />}
                <span
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-xl',
                    level ? 'bg-brand-amber text-[rgba(15,15,17,0.9)] shadow-[0_8px_24px_-8px_rgba(245,158,11,0.8)]' : 'bg-ink/5 text-ink-tertiary',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden strokeWidth={2} />
                </span>
                <span className={cn('relative mt-auto pt-4 font-display text-base font-semibold leading-snug', level ? 'text-ink' : 'text-ink-tertiary')}>{R.areaLabels[area]}</span>
                <span className={cn('relative mt-1 block text-xs font-semibold first-letter:uppercase', level ? 'text-brand-amber-strong' : 'text-ink-tertiary')}>
                  {level ? R.levelLabels[level as keyof typeof R.levelLabels] : R.labels.areaOff}
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
