'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SIM_LANDING_STEPS } from '@/src/simulator-landing-steps-content'
import { Section } from '@/src/components/prism/Section'
import { SectionHeader } from '@/src/components/prism/SectionHeader'

const S = SIM_LANDING_STEPS
const EASE = [0.22, 1, 0.36, 1] as const
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** A path that draws itself when the icon scrolls into view. Reduced motion shows it drawn. */
function Draw({ d, delay = 0, reduce }: { d: string; delay?: number; reduce: boolean }) {
  return (
    <motion.path
      d={d}
      {...STROKE}
      initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : delay, ease: EASE }}
    />
  )
}

function Icon({ id, reduce }: { id: string; reduce: boolean }) {
  let body: ReactNode
  if (id === 'company') {
    // A globe: ring, meridian, equator.
    body = (
      <>
        <Draw reduce={reduce} d="M24 6a18 18 0 1 0 0 36a18 18 0 1 0 0-36" />
        <Draw reduce={reduce} delay={0.25} d="M24 6c-8 6-8 30 0 36c8-6 8-30 0-36" />
        <Draw reduce={reduce} delay={0.45} d="M6 24h36" />
      </>
    )
  } else if (id === 'setup') {
    // Two slider tracks with knobs that slide into place.
    body = (
      <>
        <Draw reduce={reduce} d="M8 16h32" />
        <Draw reduce={reduce} delay={0.2} d="M8 32h32" />
        <motion.circle
          cy={16}
          r={4.5}
          className="fill-surface-base"
          {...STROKE}
          initial={{ cx: reduce ? 30 : 12 }}
          whileInView={{ cx: 30 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.5, ease: EASE }}
        />
        <motion.circle
          cy={32}
          r={4.5}
          className="fill-surface-base"
          {...STROKE}
          initial={{ cx: reduce ? 16 : 36 }}
          whileInView={{ cx: 16 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.65, ease: EASE }}
        />
      </>
    )
  } else {
    // Bars that grow, over an axis.
    body = (
      <>
        <Draw reduce={reduce} d="M8 40h32" />
        {[
          { x: 12, h: 12 },
          { x: 21, h: 20 },
          { x: 30, h: 28 },
        ].map((b, i) => (
          <motion.rect
            key={b.x}
            x={b.x}
            width={6}
            rx={1.5}
            className="fill-current opacity-80"
            initial={{ y: reduce ? 40 - b.h : 40, height: reduce ? b.h : 0 }}
            whileInView={{ y: 40 - b.h, height: b.h }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.3 + i * 0.15, ease: EASE }}
          />
        ))}
      </>
    )
  }
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden>
      {body}
    </svg>
  )
}

/**
 * How it works in three steps: a connected timeline whose line draws across as it scrolls into view
 * (down the side on a phone). Each step has a small icon that draws itself. `onStart` runs the tool
 * (scroll to the form); without it the button is not rendered.
 */
export function StepsSection({ onStart }: { onStart?: () => void }) {
  const reduce = useReducedMotion() ?? false
  const n = S.steps.length
  return (
    <Section id="how-it-works" rhythm="compact">
      <SectionHeader eyebrow={S.eyebrow} title={S.title} />
      <div className="relative mt-12">
        {/* Desktop line: sits through the centers of the node badges. */}
        <div aria-hidden className="absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-line-subtle md:block">
          <motion.div
            className="h-full origin-left bg-brand-violet-strong"
            initial={{ scaleX: reduce ? 1 : 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ duration: reduce ? 0 : 1.4, ease: EASE }}
          />
        </div>
        {/* Mobile line: down the left edge. */}
        <div aria-hidden className="absolute bottom-6 left-6 top-6 w-px bg-line-subtle md:hidden">
          <motion.div
            className="h-full origin-top bg-brand-violet-strong"
            initial={{ scaleY: reduce ? 1 : 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduce ? 0 : 1.4, ease: EASE }}
          />
        </div>

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {S.steps.map((step, i) => (
            <motion.li
              key={step.id}
              className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center"
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: reduce ? 0 : (i / n) * 0.9, ease: EASE }}
            >
              <span
                className="relative z-10 flex h-12 w-12 flex-none items-center justify-center rounded-full border border-line-subtle bg-surface-base text-brand-violet-strong shadow-sm"
                aria-label={S.stepLabel(i + 1)}
              >
                <Icon id={step.id} reduce={reduce} />
              </span>
              <div className="md:mt-5">
                <p className="type-xs font-medium tabular-nums text-ink-tertiary">{S.stepLabel(i + 1)}</p>
                <h3 className="mt-1 font-display type-xl font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 max-w-xs type-sm leading-relaxed text-ink-secondary md:mx-auto">{step.line}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
      {onStart && (
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={onStart} className="btn-primary">
            {S.cta}
          </button>
        </div>
      )}
    </Section>
  )
}
