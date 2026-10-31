'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'
import { compareDelivery, simulate } from '@/src/lib/simulator/engine'
import { READINESS_DIMENSIONS, type ReadinessInput, type SimulatorResult } from '@/src/lib/simulator/types'
import { readinessBand } from '@/src/lib/simulator/readiness'
import { formatAbout, formatMoney } from '@/src/lib/simulator/format'
import { SIM_WALKTHROUGH } from '@/src/simulator-landing-walkthrough-content'
import { Section } from '@/src/components/prism/Section'
import { SectionHeader } from '@/src/components/prism/SectionHeader'
import { CostChart } from '../CostChart'
import { NetChart } from '../NetChart'
import { OrgScene } from '../OrgVisual'
import { buildLayout } from '../org-layout'
import { SAMPLE_INPUTS } from '../SamplePreview'
import { CAPACITY_GREEN, tint } from '../dept'

const W = SIM_WALKTHROUGH
const EASE = [0.22, 1, 0.36, 1] as const

/** Answers for two plausible starting points: mostly "interest, no owner" against mostly "named owner, in use". */
const answers = (scores: number[]) => Object.fromEntries(READINESS_DIMENSIONS.map((d, i) => [d, scores[i]])) as ReadinessInput
const LOW_BASELINE = answers([40, 40, 40, 0, 0, 40])
const HIGH_BASELINE = answers([70, 70, 100, 70, 70, 70])

/** The sample run, built once: the same insurer the hero shows, plus a lower and a higher readiness baseline. */
function buildSample() {
  const result = simulate(SAMPLE_INPUTS)
  return {
    result,
    layout: buildLayout(result),
    comparison: compareDelivery(result.inputs),
    low: simulate({ ...SAMPLE_INPUTS, readiness: LOW_BASELINE }),
    high: simulate({ ...SAMPLE_INPUTS, readiness: HIGH_BASELINE }),
  }
}
type Sample = ReturnType<typeof buildSample>

/** True from the large breakpoint up, after mount. The server and first paint use the stacked layout. */
function useDesktop() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setDesktop(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

/** Counts from zero to `value` the first time it is seen. Reduced motion shows the final text. */
function Count({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !inView) return
    const controls = animate(0, value, { duration: 1.3, ease: EASE, onUpdate: (v) => (el.textContent = format(v)) })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- format is a stable inline closure over `value`
  }, [inView, reduce, value])
  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  )
}

function Shell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-base shadow-[0_30px_80px_rgba(30,27,75,0.12)] ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-raised px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-3 truncate rounded-md bg-surface-overlay px-2 py-0.5 type-xs text-ink-tertiary">{W.frame.url}</span>
      </div>
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="type-sm font-medium text-ink">{caption}</p>
          <p className="type-xs text-ink-tertiary">{W.frame.sample}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function NetworkFrame({ sample, month }: { sample: Sample; month: number }) {
  const reduce = useReducedMotion()
  const m = Math.min(24, Math.max(0, month))
  const hours = sample.result.scenarios.central.months[m].hoursFreed
  return (
    <Shell caption={W.network.caption}>
      <div className="flex items-end justify-between gap-4">
        <p className="font-display type-2xl font-semibold tabular-nums text-ink">{W.network.month(m)}</p>
        <p className="text-right type-sm text-ink-secondary">
          <span className="font-display type-lg font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
            {formatAbout(hours)}
          </span>{' '}
          {W.network.hours}
        </p>
      </div>
      <div className="mt-2">
        <OrgScene result={sample.result} layout={sample.layout} month={m} animated={!reduce} growthLabel={W.network.growth} bare />
      </div>
      <div className="mt-3" role="img" aria-label={W.network.track}>
        <div className="relative h-1.5 rounded-full" style={{ background: tint(CAPACITY_GREEN, 0.14) }}>
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(m / 24) * 100}%`, background: CAPACITY_GREEN }} />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-base"
            style={{ left: `${(m / 24) * 100}%`, background: CAPACITY_GREEN }}
          />
        </div>
        <div className="mt-1.5 flex justify-between type-xs tabular-nums text-ink-tertiary">
          {[0, 6, 12, 18, 24].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function PnlFrame({ sample }: { sample: Sample }) {
  return (
    <Shell caption={W.pnl.caption}>
      <CostChart result={sample.result} currency="USD" />
    </Shell>
  )
}

function NetFrame({ sample }: { sample: Sample }) {
  return (
    <Shell caption={W.net.caption}>
      <NetChart comparison={sample.comparison} active={sample.result.resolved.delivery} currency="USD" />
    </Shell>
  )
}

const SIZE = 84
const STROKE = 7
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

function Ring({ score, id }: { score: number; id: string }) {
  const reduce = useReducedMotion()
  const to = CIRC * (1 - score / 100)
  return (
    <div className="relative flex-none" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-[rgba(120,120,140,0.2)]" />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: reduce ? to : CIRC }}
          whileInView={{ strokeDashoffset: to }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display type-xl font-semibold tabular-nums text-ink">
        <Count value={score} format={(n) => String(Math.round(n))} />
      </span>
    </div>
  )
}

function trainingCost(r: SimulatorResult) {
  return r.scenarios.central.months.reduce((a, m) => a + m.costs.trainingTime, 0)
}

function ReadinessFrame({ sample }: { sample: Sample }) {
  const reduce = useReducedMotion()
  const R = W.readiness
  const sides = [
    { key: 'lower', label: R.lower, result: sample.low },
    { key: 'higher', label: R.higher, result: sample.high },
  ]
  const maxCost = Math.max(...sides.map((s) => trainingCost(s.result)), 1)
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString()
  return (
    <Shell caption={R.caption}>
      <div className="grid gap-3 sm:grid-cols-2">
        {sides.map((s, i) => {
          const rd = s.result.resolved.readiness
          const score = rd.score ?? 0
          const cost = trainingCost(s.result)
          return (
            <div key={s.key} className="rounded-xl border border-line-subtle p-4">
              <p className="type-xs font-medium text-ink-tertiary">{s.label}</p>
              <div className="mt-3 flex items-center gap-4">
                <Ring score={score} id={`wt-ring-${s.key}`} />
                <div className="min-w-0">
                  <p className="font-display type-lg font-semibold text-ink">{R.bands[readinessBand(score)]}</p>
                  <p className="type-xs text-ink-tertiary">{R.score}</p>
                </div>
              </div>
              <p className="mt-3 type-sm text-ink-secondary">{R.half(fmt(s.result.resolved.adoptionCurve.t0))}</p>
              <p className="type-sm text-ink-secondary">{R.training(fmt(s.result.resolved.trainingHoursPerPerson))}</p>
              <p className="mt-3 type-xs text-ink-tertiary">{R.cost}</p>
              <p className="font-display type-xl font-semibold text-ink">
                <Count value={cost} format={(n) => formatMoney(n, 'USD', { compact: true })} />
              </p>
              <div className="mt-2 h-1.5 rounded-full" style={{ background: tint(CAPACITY_GREEN, 0.14) }}>
                <motion.div
                  className="h-full rounded-full bg-brand-violet-strong"
                  initial={{ width: reduce ? `${(cost / maxCost) * 100}%` : 0 }}
                  whileInView={{ width: `${(cost / maxCost) * 100}%` }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: reduce ? 0 : 1, ease: EASE, delay: reduce ? 0 : 0.15 * i }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

function Frame({ index, sample, month }: { index: number; sample: Sample; month: number }) {
  if (index === 0) return <NetworkFrame sample={sample} month={month} />
  if (index === 1) return <PnlFrame sample={sample} />
  if (index === 2) return <NetFrame sample={sample} />
  return <ReadinessFrame sample={sample} />
}

/**
 * Scroll-driven tour of the real output. A 240-person insurer is run through the engine and each
 * step shows a real render of it: the org network with a month playhead, the AI P&L, the net position
 * with Vibrana vs on your own, and the readiness baseline. Large screens pin the frame on the right
 * and swap it as the steps pass; smaller screens stack a frame under each step.
 */
export function WalkthroughSection() {
  const sample = useMemo(buildSample, [])
  const reduce = useReducedMotion()
  const desktop = useDesktop()
  const [active, setActive] = useState(0)
  const [month, setMonth] = useState(0)
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])
  const firstRef = useRef<HTMLLIElement | null>(null)

  const { scrollYProgress } = useScroll({ target: firstRef, offset: ['start 65%', 'end 45%'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setMonth(Math.round(Math.min(1, Math.max(0, v)) * 24)))

  useEffect(() => {
    if (!desktop) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step))
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )
    stepRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [desktop])

  const steps = W.steps
  return (
    <Section id="walkthrough" surface="raised">
      <SectionHeader eyebrow={W.eyebrow} title={W.title} subtitle={W.subtitle} />
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <ol className="space-y-14 lg:space-y-0">
          {steps.map((s, i) => (
            <li
              key={s.id}
              ref={(el) => {
                stepRefs.current[i] = el
                if (i === 0) firstRef.current = el
              }}
              data-step={i}
              className={i === 0 ? 'lg:min-h-[170vh]' : 'lg:min-h-[85vh]'}
            >
              <motion.div
                className={i === 0 ? 'lg:sticky lg:top-40' : undefined}
                animate={{ opacity: desktop && active !== i ? 0.4 : 1 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
              >
                <p className="type-xs font-medium tabular-nums text-ink-tertiary">{W.progress(i + 1, steps.length)}</p>
                <h3 className="mt-2 font-display type-2xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-3 max-w-md type-base leading-relaxed text-ink-secondary">{s.line}</p>
                {!desktop && (
                  <motion.div
                    className="mt-6"
                    initial={reduce ? false : { opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                    transition={{ duration: 0.8, ease: EASE }}
                  >
                    <Frame index={i} sample={sample} month={month} />
                  </motion.div>
                )}
              </motion.div>
            </li>
          ))}
        </ol>
        {desktop && (
          <div className="relative">
            <div className="sticky top-24">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
                >
                  <Frame index={active} sample={sample} month={month} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
