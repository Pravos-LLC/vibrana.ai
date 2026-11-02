'use client'

import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT } from './tokens'

export interface GateCardProps {
  /** Gate number, shown in mono: `2` renders `Gate 02`. */
  gate: number
  /** What the gate decides, in a few words. */
  title: string
  /** What must be true to pass. Three to five lines. */
  criteria: readonly string[]
  /** Who signs the gate off, as a role: `Your COO`. */
  signedBy?: string
  /** When it falls: `Week 6`. */
  when?: string
  className?: string
}

const STAGGER = 0.12

/**
 * GateCard: an acceptance gate made tangible. A mono header (gate number, when it falls), the
 * decision, a checklist of what must be true, and who signs. When the card is well into view the
 * boxes tick one by one (120 ms apart, each check drawn in 220 ms), then the sign-off line inks in.
 * The card and its text are visible from the first paint; only the ticks wait. Reduced motion:
 * rendered ticked.
 */
export function GateCard({ gate, title, criteria, signedBy, when, className }: GateCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useHydratedReducedMotion()
  const ticked = reduce || seen
  const signDelay = reduce ? 0 : criteria.length * STAGGER + 0.2

  return (
    <div ref={ref} className={cn('rounded-2xl border border-line bg-surface-base p-6 sm:p-7', className)}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line-subtle pb-4">
        <span className="label-mono tabular text-ink">Gate {String(gate).padStart(2, '0')}</span>
        {when ? <span className="label-mono text-ink-tertiary">{when}</span> : null}
      </div>
      <h3 className="mt-5 font-display font-semibold text-ink" style={{ fontSize: '1.25rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {criteria.map((c, i) => (
          <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-3 text-[15px] leading-snug text-ink-secondary">
            <Tick on={ticked} delay={reduce ? 0 : i * STAGGER} />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      {signedBy ? (
        <motion.p
          className="mt-6 flex items-baseline gap-3 border-t border-dashed border-line pt-4"
          style={{ fontSize: '0.875rem', lineHeight: 1.4 }}
          initial={false}
          animate={{ opacity: ticked ? 1 : 0.45 }}
          transition={{ duration: DUR.swap, delay: ticked ? signDelay : 0, ease: EASE_OUT }}
        >
          <span className="label-mono text-ink-tertiary">Signed off by</span>
          <span className="text-sm font-medium text-ink">{signedBy}</span>
        </motion.p>
      ) : null}
    </div>
  )
}

function Tick({ on, delay }: { on: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 20 20" className="mt-[1px] h-5 w-5" aria-hidden>
      <motion.rect
        x="1"
        y="1"
        width="18"
        height="18"
        rx="5"
        initial={false}
        animate={{ fill: on ? 'var(--text-primary)' : 'rgba(0,0,0,0)', stroke: on ? 'var(--text-primary)' : 'var(--border-strong)' }}
        transition={{ duration: DUR.tick, delay, ease: EASE_OUT }}
        strokeWidth="1.25"
      />
      <motion.path
        d="M5.5 10.4l3 3 6-6.6"
        fill="none"
        stroke="var(--surface-base)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ duration: DUR.tick, delay: delay + 0.06, ease: EASE_OUT }}
      />
    </svg>
  )
}
