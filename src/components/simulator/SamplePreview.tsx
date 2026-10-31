'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { simulate } from '@/src/lib/simulator/engine'
import { FUNCTIONS, type SimulatorInputs } from '@/src/lib/simulator/types'
import { formatAbout, formatMoney, formatMoneyRange, formatRange, sizeBand } from '@/src/lib/simulator/format'
import { SIM_DASH, SIM_FUNCTION_LABELS, SIM_INTRO, SIM_SECTOR_LABELS } from '@/src/simulator-content'
import { OrgScene } from './OrgVisual'
import { buildLayout } from './org-layout'
import { CAPACITY_GREEN, DEPT_COLOR, DEPT_ICON, tint } from './dept'

/** The sample the hero shows: a 240-person insurer at a steady rollout. Real engine, real components. */
export const SAMPLE_INPUTS: SimulatorInputs = {
  domain: null,
  headcount: 240,
  sector: 'insurance',
  providers: ['anthropic', 'google'],
  cap: 50,
  dataRule: 'internal',
  pace: 'steady',
  adoptionTarget: 0.8,
  overrides: { region: 'us' },
}

const D = SIM_DASH
const EASE = [0.22, 1, 0.36, 1] as const

/** Plays the sample's org picture from month 0 to month 18 once on load, so the network visibly builds. */
function useBuildUp(to: number, reduce: boolean | null) {
  const [m, setM] = useState(to)
  const started = useRef(false)
  useEffect(() => {
    if (reduce || started.current) return
    started.current = true
    setM(0)
    const controls = animate(0, to, { duration: 4.2, delay: 0.7, ease: [0.4, 0, 0.2, 1], onUpdate: setM })
    return () => controls.stop()
  }, [reduce, to])
  return m
}

/** A number that counts up on load. The server renders the final text. */
function CountIn({ value, format, delay }: { value: number; format: (n: number) => string; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    el.textContent = format(0)
    const controls = animate(0, value, { duration: 1.4, delay, ease: EASE, onUpdate: (v) => (el.textContent = format(v)) })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce])
  return <span ref={ref}>{format(value)}</span>
}

/**
 * The promise, shown before any input: a live render of the dashboard for a
 * sample company, inside a window frame. Decorative for screen readers (the
 * caption below says what it is); nothing in it is interactive.
 */
export function SamplePreview() {
  const reduce = useReducedMotion()
  const result = useMemo(() => simulate(SAMPLE_INPUTS), [])
  const h = result.headline
  const value = { low: h.capacityValue.low * 12, high: h.capacityValue.high * 12, central: h.capacityValue.central * 12 }
  const at12 = result.scenarios.central.months[12]
  const top = FUNCTIONS.filter((f) => at12.hoursByFunction[f] > 0)
    .sort((a, b) => at12.hoursByFunction[b] - at12.hoursByFunction[a])
    .slice(0, 4)
  const max = Math.max(...top.map((f) => at12.hoursByFunction[f]), 1)
  const layout = useMemo(() => buildLayout(result), [result])
  const month = useBuildUp(18, reduce)

  return (
    <motion.div
      aria-hidden
      className="relative"
      initial={reduce ? false : { opacity: 0, y: 24, rotate: 0.6 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
    >
      <span className="pointer-events-none absolute -inset-8 -z-10 bg-[radial-gradient(55%_50%_at_50%_45%,rgba(124,58,237,0.12),transparent_72%)] blur-md" />
      <div className="overflow-hidden rounded-2xl border border-line-subtle bg-surface-base shadow-[0_30px_80px_rgba(30,27,75,0.14)] ring-1 ring-black/5">
        <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-raised px-3.5 py-2.5">
          <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
          <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
          <span className="h-2 w-2 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded-md bg-surface-overlay px-2 py-0.5 type-xs text-ink-tertiary">{SIM_INTRO.sampleUrl}</span>
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7c3aed,#3b82f6)] font-display text-sm font-semibold text-white">
              {SIM_INTRO.sampleName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display type-sm font-semibold text-ink">{SIM_INTRO.sampleName}</p>
              <p className="truncate type-xs text-ink-tertiary">
                {SIM_SECTOR_LABELS.insurance}, {D.header.size(sizeBand(SAMPLE_INPUTS.headcount))}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Tile i={0} featured label={D.kpi.value.label} value={<CountIn value={value.central} format={(n) => formatMoney(n, 'USD')} delay={0.5} />} range={formatMoneyRange(value, 'USD')} />
            <Tile i={1} label={D.kpi.run.label} value={<CountIn value={h.runCost.central} format={(n) => formatMoney(n, 'USD')} delay={0.65} />} range={formatMoneyRange(h.runCost, 'USD')} />
            <Tile i={2} label={D.efficiency.kpiLabel} value={<><CountIn value={h.hoursFreed.central} format={(n) => formatAbout(n)} delay={0.8} /> {D.departments.hours}</>} range={`${formatRange(h.hoursFreed)} ${D.departments.hours}`} />
          </div>

          <div className="mt-3 rounded-xl border border-line-subtle px-2 pb-1 pt-2">
            <p className="px-1 type-xs font-medium text-ink">{D.efficiency.heading}</p>
            <OrgScene result={result} layout={layout} month={month} animated={!reduce} growthLabel={D.efficiency.growth} bare />
          </div>

          <ul className="mt-3 space-y-1.5">
            {top.map((f) => {
              const Icon = DEPT_ICON[f]
              return (
                <motion.li
                  key={f}
                  className="grid grid-cols-[10rem_1fr_4.5rem] items-center gap-3 text-[12px]"
                  initial={reduce ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + top.indexOf(f) * 0.1, ease: EASE }}
                >
                  <span className="flex items-center gap-1.5 truncate text-ink-secondary">
                    <Icon className="h-3.5 w-3.5 flex-none" style={{ color: DEPT_COLOR[f] }} />
                    {SIM_FUNCTION_LABELS[f]}
                  </span>
                  <span className="h-1.5 rounded-full" style={{ background: tint(DEPT_COLOR[f], 0.12) }}>
                    <motion.span
                      className="block h-full rounded-full"
                      style={{ background: DEPT_COLOR[f] }}
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${(at12.hoursByFunction[f] / max) * 100}%` }}
                      transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-ink">{formatAbout(at12.hoursByFunction[f])} {D.departments.hours}</span>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function Tile({ label, value, range, featured, i }: { label: string; value: ReactNode; range: string; featured?: boolean; i: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="min-w-0 rounded-xl border p-2.5"
      style={featured ? { borderColor: tint(CAPACITY_GREEN, 0.3), background: tint(CAPACITY_GREEN, 0.05) } : { borderColor: 'rgba(0,0,0,0.08)' }}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease: EASE }}
    >
      <div className="text-[11px] leading-tight text-ink-tertiary">{label}</div>
      <div className="mt-1 truncate font-display text-[17px] font-semibold leading-tight tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 truncate text-[11px] leading-tight tabular-nums text-ink-tertiary">{range}</div>
    </motion.div>
  )
}
