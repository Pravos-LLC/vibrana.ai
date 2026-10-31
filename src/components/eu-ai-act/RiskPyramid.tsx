'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { LegalCite } from './LegalCite'
import { TONE } from './tone'
import { cn } from '@/src/components/prism/utils/cn'
import type { EUTone } from '@/src/eu-ai-act-readiness-content'

type Tier = {
  tone: EUTone
  label: string
  body: string
  fine?: string
  findings: readonly string[]
}

const EASE = [0.23, 1, 0.32, 1] as const

/**
 * RiskPyramid: the Act's four tiers as a stepped pyramid, narrowest (prohibited) on top.
 * Each band is a clip-path trapezoid in its tone's color; the bands build up from the base when
 * the pyramid scrolls into view, and each band's row of text sits level with it on desktop.
 * Under reduced motion everything renders in place. Identity is never color alone: every band
 * carries its label.
 */
export function RiskPyramid({ tiers }: { tiers: readonly Tier[] }) {
  const reduce = useReducedMotion()
  const n = tiers.length
  const band = (i: number) => {
    const top = 34 - (i / n) * 34
    const bottom = 34 - ((i + 1) / n) * 34
    return `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% calc(100% - 3px), ${bottom}% calc(100% - 3px))`
  }
  const labelColor = (t: Tier) => (t.tone === 'high-risk' ? 'rgba(15,15,17,0.9)' : '#fff')
  return (
    <div>
      {/* Mobile: the whole pyramid at a glance, then the tiers as a list. */}
      <div className="mx-auto mb-8 max-w-xs lg:hidden" aria-hidden>
        {tiers.map((t, i) => (
          <motion.div
            key={t.label}
            className={cn('relative flex h-12 items-center justify-center', TONE[t.tone].fill)}
            style={{ clipPath: band(i) }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={reduce ? { duration: 0.2 } : { duration: 0.6, delay: (n - 1 - i) * 0.1, ease: EASE }}
          >
            <span className="pb-0.5 font-display text-xs font-semibold" style={{ color: labelColor(t) }}>
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>
      <ol className="grid">
        {tiers.map((t, i) => {
          // Band i spans from inset(top) to inset(bottom): a slice of one large triangle-ish trapezoid.
          const top = 34 - (i / n) * 34
          const bottom = 34 - ((i + 1) / n) * 34
          const tone = TONE[t.tone]
          return (
            <motion.li
              key={t.label}
              className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={reduce ? { duration: 0.2 } : { duration: 0.7, delay: (n - 1 - i) * 0.12, ease: EASE }}
            >
              <div className="relative hidden min-h-24 self-stretch lg:block" aria-hidden>
                <div
                  className={cn('absolute inset-0', tone.fill)}
                  style={{
                    clipPath: `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% calc(100% - 4px), ${bottom}% calc(100% - 4px))`,
                  }}
                />
                {/* sheen: light from the top, so the bands read as one lit object */}
                <div
                  className="absolute inset-0 mix-blend-soft-light"
                  style={{
                    clipPath: `polygon(${top}% 0, ${100 - top}% 0, ${100 - bottom}% calc(100% - 4px), ${bottom}% calc(100% - 4px))`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)',
                  }}
                />
                <span
                  className="absolute inset-0 hidden items-center justify-center pb-1 font-display text-base font-semibold tracking-tight lg:flex"
                  style={{ color: labelColor(t) }}
                >
                  {t.label}
                </span>
              </div>
              <div className="border-l-2 py-3 pl-5 lg:py-5" style={{ borderColor: tone.hex }}>
                <h3 className={cn('font-display text-lg font-semibold tracking-tight', tone.text)}>{t.label}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">{t.body}</p>
                {t.fine && <p className="mt-1 text-sm font-medium text-ink">{t.fine}</p>}
                <LegalCite findings={t.findings} className="mt-1.5" />
              </div>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
