'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/src/components/prism/motion/CountUp'
import { Eyebrow } from '@/src/components/prism/Eyebrow'
import { Heading } from '@/src/components/prism/typography'
import {
  SIM_PROBLEM,
  SIM_PROBLEM_BCG,
  SIM_PROBLEM_MCKINSEY,
  SIM_PROBLEM_MIT,
  SIM_PROBLEM_PWC,
} from '@/src/simulator-landing-problem-content'

const EASE = [0.22, 1, 0.36, 1] as const
const VIEW = { once: true, amount: 0.35 } as const

/** Source line shared by every row. */
function Source({ children }: { children: string }) {
  return <p className="mt-3 type-xs text-ink-tertiary">{children}</p>
}

const DOT_TONE = { neither: 'fill-ink', both: 'fill-brand-violet', other: 'fill-line-strong' } as const

/** 100 dots, 10 by 10. Dots appear in reading order: 56 "neither", then 12 "both", then the rest. */
function DotField() {
  const reduce = useReducedMotion()
  const { neither, both } = SIM_PROBLEM_PWC.dots
  const tone = (i: number) => (i < neither ? DOT_TONE.neither : i < neither + both ? DOT_TONE.both : DOT_TONE.other)
  return (
    <div>
      <svg viewBox="0 0 200 200" className="block w-full max-w-[22rem]" role="img" aria-label={SIM_PROBLEM_PWC.visualLabel}>
        {Array.from({ length: 100 }, (_, i) => (
          <motion.circle
            key={i}
            cx={10 + (i % 10) * 20}
            cy={10 + Math.floor(i / 10) * 20}
            r={7}
            className={tone(i)}
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.2 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={VIEW}
            transition={{ duration: 0.45, ease: EASE, delay: i * 0.014 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}
      </svg>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 type-xs text-ink-secondary">
        {(['neither', 'both', 'other'] as const).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <svg width="10" height="10" aria-hidden>
              <circle cx="5" cy="5" r="5" className={DOT_TONE[k]} />
            </svg>
            {SIM_PROBLEM_PWC.legend[k]}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A horizontal track that fills to `pct`. */
function FillBar({ pct, label, caption }: { pct: number; label: string; caption: { yes: string; rest: string } }) {
  const reduce = useReducedMotion()
  return (
    <div>
      <div className="relative h-5 overflow-hidden rounded-full bg-surface-overlay" role="img" aria-label={label}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-violet"
          initial={reduce ? { width: `${pct}%` } : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={VIEW}
          transition={{ duration: 1.3, ease: EASE, delay: 0.1 }}
        />
      </div>
      <div className="mt-2 flex justify-between type-xs text-ink-secondary">
        <span className="font-medium text-ink">{caption.yes}</span>
        <span>{caption.rest}</span>
      </div>
    </div>
  )
}

/** One bar cut into three weighted segments that grow in turn. */
function SplitBar() {
  const reduce = useReducedMotion()
  const tones = ['bg-line-strong', 'bg-ink-tertiary', 'bg-brand-violet']
  return (
    <div role="img" aria-label={SIM_PROBLEM_BCG.barLabel}>
      <div className="flex h-5 gap-1">
        {SIM_PROBLEM_BCG.segments.map((s, i) => (
          <motion.div
            key={s.label}
            className={`h-full rounded-full ${tones[i]}`}
            style={{ flexBasis: `${s.value}%`, transformOrigin: 'left' }}
            initial={reduce ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0.4 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={VIEW}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.25 }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1 type-xs text-ink-secondary">
        {SIM_PROBLEM_BCG.segments.map((s, i) => (
          <span key={s.label} style={{ flexBasis: `${s.value}%` }} className={i === 2 ? 'font-medium text-ink' : ''}>
            {s.value}% {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Ring drawn with pathLength, muted because the figure is contested. */
function Ring({ pct }: { pct: number }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={SIM_PROBLEM_MIT.arcLabel}>
      <circle cx="60" cy="60" r="52" fill="none" strokeWidth="9" className="stroke-surface-overlay" />
      <motion.circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        className="stroke-ink-tertiary"
        initial={reduce ? { pathLength: pct / 100 } : { pathLength: 0 }}
        whileInView={{ pathLength: pct / 100 }}
        viewport={VIEW}
        transition={{ duration: 1.6, ease: EASE, delay: 0.1 }}
      />
    </svg>
  )
}

function Row({ children, first = false }: { children: ReactNode; first?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`grid items-center gap-8 py-12 md:grid-cols-12 md:gap-12 ${first ? 'pt-0' : 'border-t border-line-subtle'}`}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

const BIG = 'font-display text-6xl font-semibold leading-none tracking-tight text-ink md:text-7xl'

export function ProblemSection() {
  const P = SIM_PROBLEM
  const reduce = useReducedMotion()
  return (
    <section id={P.id} aria-label={P.title} className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <Eyebrow className="mb-4">{P.eyebrow}</Eyebrow>
          <Heading level={2}>{P.title}</Heading>
          <p className="mt-4 max-w-2xl type-base text-secondary-token">{P.subtitle}</p>
        </div>

        {/* PwC: the lead stat, with the dot field */}
        <Row first>
          <div className="md:col-span-7">
            <div className="font-display text-8xl font-semibold leading-none tracking-tight text-ink md:text-[9rem]">
              <CountUp value={SIM_PROBLEM_PWC.value} duration={1.8} />
            </div>
            <p className="mt-5 max-w-md type-lg text-ink">{SIM_PROBLEM_PWC.label}</p>
            <p className="mt-4 flex items-baseline gap-3 text-ink-secondary">
              <span className="font-display text-3xl font-semibold text-brand-violet-strong">
                <CountUp value={SIM_PROBLEM_PWC.both.value} />
              </span>
              <span className="type-base">{SIM_PROBLEM_PWC.both.label}</span>
            </p>
            <Source>{SIM_PROBLEM_PWC.source}</Source>
          </div>
          <div className="md:col-span-5 md:justify-self-end">
            <DotField />
          </div>
        </Row>

        {/* McKinsey */}
        <Row>
          <div className="md:col-span-5">
            <div className={BIG}>
              <CountUp value={SIM_PROBLEM_MCKINSEY.value} />
            </div>
            <p className="mt-4 max-w-sm type-base text-ink">{SIM_PROBLEM_MCKINSEY.label}</p>
          </div>
          <div className="md:col-span-7">
            <FillBar pct={21} label={SIM_PROBLEM_MCKINSEY.barLabel} caption={SIM_PROBLEM_MCKINSEY.barCaption} />
            <p className="mt-5 type-base text-ink-secondary">{SIM_PROBLEM_MCKINSEY.note}</p>
            <Source>{SIM_PROBLEM_MCKINSEY.source}</Source>
          </div>
        </Row>

        {/* BCG: mirrored so the page does not read as a stack of identical rows */}
        <Row>
          <div className="md:order-2 md:col-span-5">
            <div className={BIG}>
              <CountUp value={SIM_PROBLEM_BCG.value} />
            </div>
            <p className="mt-4 max-w-sm type-base text-ink">{SIM_PROBLEM_BCG.label}</p>
          </div>
          <div className="md:order-1 md:col-span-7">
            <SplitBar />
            <p className="mt-5 type-base text-ink-secondary">{SIM_PROBLEM_BCG.note}</p>
            <Source>{SIM_PROBLEM_BCG.source}</Source>
          </div>
        </Row>

        {/* MIT NANDA: muted, contested */}
        <Row>
          <div className="flex items-center gap-6 md:col-span-5">
            <div className="relative shrink-0">
              <Ring pct={95} />
              <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold text-ink-secondary">
                <CountUp value={SIM_PROBLEM_MIT.value} />
              </span>
            </div>
            <div>
              <span className="inline-block rounded-full border border-line px-2.5 py-0.5 type-xs font-medium text-ink-secondary">
                {SIM_PROBLEM_MIT.tag}
              </span>
              <p className="mt-2 type-base text-ink-secondary">{SIM_PROBLEM_MIT.label}</p>
            </div>
          </div>
          <div className="md:col-span-7">
            <p className="type-base text-ink-secondary">{SIM_PROBLEM_MIT.detail}</p>
            <p className="mt-2 text-[0.8125rem] leading-snug text-ink-tertiary">{SIM_PROBLEM_MIT.caveat}</p>
            <Source>{SIM_PROBLEM_MIT.source}</Source>
          </div>
        </Row>

        <motion.div
          className="border-t border-line-subtle pt-12 md:flex md:items-baseline md:justify-between"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="font-display text-2xl font-semibold text-ink md:text-3xl">{P.closing.line}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-brand-violet-strong md:mt-0 md:text-3xl">{P.closing.bridge}</p>
        </motion.div>
      </div>
    </section>
  )
}
