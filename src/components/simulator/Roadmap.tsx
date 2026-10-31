'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import type { Currency, OfferCard, SimulatorResult } from '@/src/lib/simulator/types'
import { SIM_DASH, SIM_OFFERS } from '@/src/simulator-content'
import { offerPrice } from './OfferGallery'

const r = SIM_DASH.roadmap
const EASE = [0.22, 1, 0.36, 1] as const
/** Phase colors walk the prism spectrum, so time reads left to right. */
const PHASE = ['#7c3aed', '#5b4ff0', '#3b82f6', '#0ea5a4']

/**
 * The sequence as a roadmap: a 24-month rail with each phase's span drawn to
 * scale, then one column per phase with its milestones and the services that fund it.
 */
export function Roadmap({ result, currency }: { result: SimulatorResult; currency: Currency }) {
  const reduce = useReducedMotion()
  const offers = new Map(result.offers.map((o) => [o.id, o]))

  return (
    <div>
      {/* The rail: true-to-scale spans over 24 months. */}
      <div className="relative hidden md:block" aria-hidden>
        <div className="flex h-2 overflow-hidden rounded-full bg-surface-overlay">
          {r.phases.map((p, i) => (
            <motion.span
              key={p.title}
              className="h-full"
              style={{ width: `${((p.end - p.start) / 24) * 100}%`, background: PHASE[i], transformOrigin: 'left center', opacity: 0.85 }}
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, delay: i * 0.18, ease: EASE }}
            />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 type-xs text-ink-tertiary tabular-nums">
          {[0, 3, 6, 12, 24].map((m) => (
            <span key={m} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(m / 24) * 100}%` }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <ol className="relative mt-2 grid gap-4 md:mt-6 md:grid-cols-4 md:gap-3">
        {/* Mobile: a vertical spine instead of the rail. */}
        <span aria-hidden className="absolute bottom-4 left-[11px] top-4 w-px bg-[linear-gradient(180deg,#7c3aed,#3b82f6,#0ea5a4)] opacity-40 md:hidden" />
        {r.phases.map((p, i) => (
          <motion.li
            key={p.title}
            className="relative pl-9 md:pl-0"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.12, ease: EASE }}
          >
            <span aria-hidden className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-surface-base md:hidden" style={{ borderColor: PHASE[i] }}>
              <span className="h-2 w-2 rounded-full" style={{ background: PHASE[i] }} />
            </span>
            <div className="h-full rounded-2xl border border-line-subtle bg-surface-base p-4 transition-shadow hover:shadow-[0_10px_30px_rgba(76,29,149,0.08)] md:p-5">
              <p className="type-xs font-semibold tabular-nums" style={{ color: PHASE[i] }}>
                {r.months(p.start, p.end)}
              </p>
              <p className="mt-1.5 font-display type-base font-semibold leading-snug text-ink">{p.title}</p>
              <ul className="mt-3 space-y-1.5">
                {p.milestones.map((m) => (
                  <li key={m} className="flex gap-2 type-xs leading-relaxed text-ink-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none" style={{ color: PHASE[i] }} aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-line-subtle pt-3">
                <p className="type-xs text-ink-tertiary">{r.funded}</p>
                <ul className="mt-1.5 space-y-1">
                  {p.offers
                    .map((id) => offers.get(id))
                    .filter((o): o is OfferCard => Boolean(o))
                    .map((o) => (
                      <li key={o.id}>
                        <a
                          href={`#offer-${o.id}`}
                          className="-mx-2 flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 type-xs text-ink-secondary transition-colors hover:bg-surface-overlay hover:text-ink"
                        >
                          <span>{SIM_OFFERS[o.id].title}</span>
                          <span className="flex-none text-ink-tertiary tabular-nums">{offerPrice(o, currency).short}</span>
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
