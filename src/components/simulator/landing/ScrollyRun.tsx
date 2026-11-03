'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { Section } from '@/src/components/prism/Section'
import { SectionHeader } from '@/src/components/prism/SectionHeader'
import { cn } from '@/src/components/prism/utils/cn'
import { compareDelivery, simulate } from '@/src/lib/simulator/engine'
import { READINESS_DIMENSIONS, type Pace, type ReadinessInput, type SimulatorResult } from '@/src/lib/simulator/types'
import { readinessBand } from '@/src/lib/simulator/readiness'
import { formatMoney, formatRange } from '@/src/lib/simulator/format'
import { SIM_PACES, SIM_SECTOR_LABELS } from '@/src/simulator-content'
import { SIM_MINI } from '@/src/simulator-landing-hero-content'
import { SIM_WALKTHROUGH } from '@/src/simulator-landing-walkthrough-content'
import { CostChart } from '../CostChart'
import { NetChart } from '../NetChart'
import { OrgScene } from '../OrgVisual'
import { BRAIN_START, buildLayout } from '../org-layout'
import { RollingText } from './RollingText'
import { RoadmapStrip } from './RoadmapStrip'
import { SCROLLY_RUN_ID } from './MiniSimulator'
import { SANDBOX_DEFAULT, runSandbox, sandboxInputs, sandboxOutputs, type Sandbox } from './sandbox'

const W = SIM_WALKTHROUGH
const EASE = [0.23, 1, 0.32, 1] as const

/** Answers for two plausible starting points: mostly "interest, no owner" against mostly "named owner, in use". */
const answers = (scores: number[]) => Object.fromEntries(READINESS_DIMENSIONS.map((d, i) => [d, scores[i]])) as ReadinessInput
const LOW_BASELINE = answers([40, 40, 40, 0, 0, 40])
const HIGH_BASELINE = answers([70, 70, 100, 70, 70, 70])

type StepId = (typeof W.steps)[number]['id']
/** What each caption sets on the panel: the pace it runs at and the picture it shows. */
/** The brain step's month: two months after the brain starts going live, when knowledge visibly flows. */
export const BRAIN_STEP_MONTH = BRAIN_START + 2

export const STEP_STATE: Record<StepId, { pace: Pace; month?: number }> = {
  'month-0': { pace: 'steady', month: 0 },
  'brain-live': { pace: 'steady', month: BRAIN_STEP_MONTH },
  pnl: { pace: 'steady' },
  cautious: { pace: 'cautious' },
  readiness: { pace: 'steady' },
  net: { pace: 'steady' },
}

/** The sample run, built once from the real engine: the sandbox's default insurer at both paces. */
function buildRun() {
  const steady = runSandbox(SANDBOX_DEFAULT)
  const cautious = runSandbox({ ...SANDBOX_DEFAULT, pace: 'cautious' })
  const base = sandboxInputs(SANDBOX_DEFAULT)
  return {
    steady,
    cautious,
    layout: buildLayout(steady),
    comparison: compareDelivery(base),
    low: simulate({ ...base, readiness: LOW_BASELINE }),
    high: simulate({ ...base, readiness: HIGH_BASELINE }),
  }
}
type Run = ReturnType<typeof buildRun>

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

function NetworkView({ run, month }: { run: Run; month: number }) {
  const reduce = useHydratedReducedMotion()
  // A range like every other figure on the page: conservative to optimistic at this month.
  const hours = { low: run.steady.scenarios.conservative.months[month].hoursFreed, high: run.steady.scenarios.optimistic.months[month].hoursFreed }
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <span className="whitespace-nowrap font-display type-2xl font-semibold tabular text-ink">{W.network.month(month)}</span>
        <span className="text-right type-sm text-ink-secondary">
          <span className="font-display type-lg font-semibold tabular text-ink">{formatRange(hours)}</span> {W.network.hours}
        </span>
      </div>
      <div className="mt-2">
        <OrgScene result={run.steady} layout={run.layout} month={month} animated={!reduce} growthLabel={W.network.growth} bare />
      </div>
    </div>
  )
}

function trainingCost(r: SimulatorResult) {
  return r.scenarios.central.months.reduce((a, m) => a + m.costs.trainingTime, 0)
}

function ReadinessView({ run }: { run: Run }) {
  const R = W.readiness
  const sides = [
    { key: 'lower', label: R.lower, result: run.low },
    { key: 'higher', label: R.higher, result: run.high },
  ]
  const maxCost = Math.max(...sides.map((s) => trainingCost(s.result)), 1)
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString()
  // Rounded up, so "by month N" stays true for a fractional half-adoption month.
  const byMonth = (n: number) => String(Math.ceil(n))
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sides.map((s) => {
        const score = s.result.resolved.readiness.score ?? 0
        const cost = trainingCost(s.result)
        return (
          <div key={s.key} className="rounded-xl border border-line-subtle p-4">
            <p className="label-mono text-ink-tertiary">{s.label}</p>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="font-display type-2xl font-semibold tabular text-ink">{score}</span>
              <span className="type-xs text-ink-tertiary">{R.score}</span>
            </p>
            <p className="font-display type-base font-semibold text-ink">{R.bands[readinessBand(score)]}</p>
            <p className="mt-3 type-sm text-ink-secondary">{R.half(byMonth(s.result.resolved.adoptionCurve.t0))}</p>
            <p className="type-sm text-ink-secondary">{R.training(fmt(s.result.resolved.trainingHoursPerPerson))}</p>
            <p className="mt-3 type-xs text-ink-tertiary">{R.cost}</p>
            <p className="font-display type-lg font-semibold tabular text-ink">{formatMoney(cost, 'USD', { compact: true })}</p>
            <p className="type-xs text-ink-tertiary">{R.sameInAll}</p>
            <div className="mt-2 h-1.5 rounded-full bg-[rgba(124,58,237,0.12)]">
              <div className="h-full rounded-full bg-brand-violet-strong" style={{ width: `${(cost / maxCost) * 100}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function View({ id, run }: { id: StepId; run: Run }) {
  switch (id) {
    case 'month-0':
    case 'brain-live':
      return <NetworkView run={run} month={STEP_STATE[id].month ?? 0} />
    case 'pnl':
      return <CostChart result={run.steady} currency="USD" />
    case 'cautious':
      return (
        <div className="py-2">
          <RoadmapStrip result={run.cautious} ghost={run.steady} caption={SIM_MINI.roadmapLabel} label={SIM_MINI.roadmapAria(SIM_PACES.cautious.label.toLowerCase())} />
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 type-xs text-ink-secondary">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="inline-block h-0.5 w-5 rounded bg-brand-violet-strong" />
              {SIM_PACES.cautious.label}
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="inline-block w-5 border-t-[1.5px] border-dashed border-ink-tertiary" />
              {SIM_PACES.steady.label}
            </span>
          </p>
          <p className="mt-4 type-sm text-ink-secondary">{SIM_MINI.paceHint.cautious}</p>
        </div>
      )
    case 'readiness':
      return <ReadinessView run={run} />
    case 'net':
      return <NetChart comparison={run.comparison} active={run.steady.resolved.delivery} currency="USD" />
  }
}

/** What each picture shows, labeled where it prints a single central value (the net chart). */
const VIEW_CAPTION: Partial<Record<StepId, string>> = {
  'month-0': W.network.caption,
  'brain-live': W.network.caption,
  pnl: W.pnl.caption,
  readiness: W.readiness.caption,
  net: W.net.caption,
}

const pill = (on: boolean) =>
  cn('inline-flex items-center rounded-full border px-3 py-1 type-xs transition-colors duration-200', on ? 'border-brand-violet bg-[rgba(124,58,237,0.09)] text-ink' : 'border-line-subtle text-ink-tertiary')

/** The sticky panel: the sandbox's inputs as the run sets them, its three outputs, and the step's picture. */
function Panel({
  index,
  run,
  onTakeOver,
  outputs = true,
  capped = false,
  children,
}: {
  index: number
  run: Run
  onTakeOver: (s: Sandbox) => void
  /** The three ranges; stacked panels show them only where the step changes them. */
  outputs?: boolean
  /** Pinned panel: hold to the viewport height. */
  capped?: boolean
  children: ReactNode
}) {
  const step = W.steps[index]
  const pace = STEP_STATE[step.id].pace
  const out = sandboxOutputs(pace === 'cautious' ? run.cautious : run.steady)
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[1.5rem] border border-line-subtle bg-surface-base shadow-[0_30px_80px_rgba(30,27,75,0.10)]',
        // Pinned beside the captions it never outgrows the viewport, less the nav and the sticky CTA bar: the picture scrolls, the hand-back button stays.
        capped && 'max-h-[calc(100dvh-11.5rem)]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface-raised px-5 py-3.5">
        <span className="label-mono text-ink-tertiary">{W.presetLabel(index + 1)}</span>
        <span className="flex flex-wrap gap-1.5" aria-hidden>
          <span className={pill(true)}>{SIM_SECTOR_LABELS[SANDBOX_DEFAULT.sector]}</span>
          <span className={pill(true)}>{SIM_MINI.peopleValue(String(SANDBOX_DEFAULT.people))}</span>
          {(['cautious', 'steady'] as const).map((p) => (
            <span key={p} className={pill(pace === p)}>
              {SIM_PACES[p].label}
            </span>
          ))}
        </span>
      </div>
      {outputs && <div className="grid grid-cols-1 divide-y divide-line-subtle border-b border-line-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { label: SIM_MINI.outputs.capacity.label, text: out.capacity.text },
          { label: SIM_MINI.outputs.runCost.label, text: out.runCost.text },
          { label: SIM_MINI.outputs.timeFreed.label, text: out.timeFreed.text },
        ].map((o) => (
          <div key={o.label} className="min-w-0 px-5 py-3.5" style={{ containerType: 'inline-size' }}>
            <span className="block type-xs text-ink-tertiary">{o.label}</span>
            <span className="mt-1 block font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.05rem, 0.3rem + 8cqi, 1.5rem)', lineHeight: 1.1 }}>
              <RollingText text={o.text} />
              <span className="sr-only">{o.text}</span>
            </span>
            <span className="label-mono mt-1 block text-ink-tertiary">{SIM_MINI.rangeLabel}</span>
          </div>
        ))}
      </div>}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {VIEW_CAPTION[step.id] && <p className="label-mono mb-3 text-ink-tertiary">{VIEW_CAPTION[step.id]}</p>}
        {children}
      </div>
      <div className="flex shrink-0 justify-end border-t border-line-subtle px-5 py-3">
        <button
          type="button"
          onClick={() => onTakeOver({ ...SANDBOX_DEFAULT, pace })}
          className="inline-flex items-center rounded-full border border-line px-4 py-2 type-sm font-medium text-ink transition-[border-color,transform] duration-150 ease-out hover:border-brand-violet active:scale-[0.97]"
        >
          {W.takeOver}
        </button>
      </div>
    </div>
  )
}

/**
 * The scroll run: captions scroll past and each one sets the sticky panel, so the reader sees the
 * model move without touching it. Large screens pin the panel beside the captions; smaller screens
 * put a panel under each caption. "Try it yourself" hands the panel's inputs to the hero sandbox.
 */
export function ScrollyRun({ onTakeOver }: { onTakeOver: (s: Sandbox) => void }) {
  const run = useMemo(buildRun, [])
  const reduce = useHydratedReducedMotion()
  const desktop = useDesktop()
  const [active, setActive] = useState(0)
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    if (!desktop) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    stepRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [desktop])

  // Both network steps share one picture, so month 0 to month 4 animates in place instead of swapping.
  const viewKey = (i: number) => (STEP_STATE[W.steps[i].id].month !== undefined ? 'network' : W.steps[i].id)

  return (
    <Section id={SCROLLY_RUN_ID} surface="raised" className="scroll-mt-16">
      <SectionHeader eyebrow={W.eyebrow} title={W.title} subtitle={W.subtitle} />
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <ol className="flex flex-col gap-12 lg:gap-0">
          {W.steps.map((s, i) => (
            <li
              key={s.id}
              ref={(el) => {
                stepRefs.current[i] = el
              }}
              data-step={i}
              className="lg:flex lg:min-h-[62vh] lg:items-center"
            >
              <div className={cn('transition-opacity duration-300', desktop && active !== i ? 'opacity-35' : 'opacity-100')}>
                <p className="label-mono tabular text-ink-tertiary">{W.progress(i + 1, W.steps.length)}</p>
                <p className="mt-3 max-w-[30ch] font-display font-medium text-ink" style={{ fontSize: 'clamp(1.25rem, 1rem + 0.8vw, 1.625rem)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {s.caption}
                </p>
              </div>
              {!desktop && (
                <div className="mt-6">
                  <Panel index={i} run={run} onTakeOver={onTakeOver} outputs={i === 0 || s.id === 'cautious'}>
                    <View id={s.id} run={run} />
                  </Panel>
                </div>
              )}
            </li>
          ))}
        </ol>
        {desktop && (
          <div className="relative">
            <div className="sticky top-24">
              <Panel index={active} run={run} onTakeOver={onTakeOver} capped>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={viewKey(active)}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={{ duration: reduce ? 0.15 : 0.3, ease: EASE }}
                  >
                    <View id={W.steps[active].id} run={run} />
                  </motion.div>
                </AnimatePresence>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
