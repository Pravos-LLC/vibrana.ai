'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { FUNCTIONS, type Currency, type FunctionId, type SimulatorResult } from '@/src/lib/simulator/types'
import { formatAbout, formatMoney, formatMoneyRange, formatRange } from '@/src/lib/simulator/format'
import { SIM_DASH, SIM_FUNCTION_LABELS } from '@/src/simulator-content'
import { DEPT_COLOR, DEPT_ICON, tint } from './dept'

const d = SIM_DASH.departments

/**
 * Month-12 hours and value by department: one row per team, its icon and color
 * (the same as in the network), a range plot (low to high, central marked) and
 * the value at that team's own pay level.
 */
export function DepartmentBreakdown({ result, currency }: { result: SimulatorResult; currency: Currency }) {
  const reduce = useReducedMotion()
  const m = (s: 'conservative' | 'central' | 'optimistic') => result.scenarios[s].months[12]
  const hours = (s: 'conservative' | 'central' | 'optimistic', f: FunctionId) => m(s).hoursByFunction[f]
  const value = (s: 'conservative' | 'central' | 'optimistic', f: FunctionId) => m(s).valueByFunction[f]
  const fns = FUNCTIONS.filter((f) => result.resolved.functionMix[f] > 0.0001 && hours('optimistic', f) > 0).sort((a, b) => value('central', b) - value('central', a))
  const max = Math.max(...fns.map((f) => value('optimistic', f)), 1)

  return (
    <div>
      <div className="hidden grid-cols-[minmax(10rem,1.1fr)_2fr_minmax(7rem,0.8fr)_minmax(9rem,0.9fr)] gap-4 border-b border-line-subtle pb-2 type-xs text-ink-tertiary md:grid">
        <span>{d.headers.team}</span>
        <span />
        <span className="text-right">{d.headers.hours}</span>
        <span className="text-right">{d.headers.value}</span>
      </div>
      <ul>
        {fns.map((f, i) => {
          const Icon = DEPT_ICON[f]
          const color = DEPT_COLOR[f]
          const lo = (value('conservative', f) / max) * 100
          const hi = (value('optimistic', f) / max) * 100
          const mid = (value('central', f) / max) * 100
          return (
            <li key={f} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line-subtle py-3 last:border-0 md:grid-cols-[minmax(10rem,1.1fr)_2fr_minmax(7rem,0.8fr)_minmax(9rem,0.9fr)]">
              <span className="flex items-center gap-2.5 type-sm font-medium text-ink">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg" style={{ background: tint(color, 0.1) }}>
                  <Icon className="h-4 w-4" style={{ color }} aria-hidden />
                </span>
                {SIM_FUNCTION_LABELS[f]}
              </span>
              <span className="order-last col-span-2 md:order-none md:col-span-1">
                <span className="relative block h-5">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[rgba(15,15,17,0.08)]" />
                  <motion.span
                    className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
                    style={{ left: `${lo}%`, background: tint(color, 0.28), transformOrigin: 'left center' }}
                    initial={reduce ? false : { width: 0 }}
                    whileInView={{ width: `${Math.max(0.6, hi - lo)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full" style={{ left: `calc(${mid}% - 2px)`, background: color }} />
                </span>
              </span>
              <span className="hidden text-right type-sm tabular-nums text-ink md:block">
                {formatAbout(hours('central', f))}
                <span className="block type-xs text-ink-tertiary">{formatRange({ low: hours('conservative', f), high: hours('optimistic', f) })}</span>
              </span>
              <span className="text-right type-sm font-medium tabular-nums text-ink">
                {formatMoney(value('central', f), currency)}
                <span className="block type-xs font-normal text-ink-tertiary">
                  {formatMoneyRange({ low: value('conservative', f), high: value('optimistic', f) }, currency)}
                </span>
                <span className="block type-xs font-normal text-ink-tertiary md:hidden">
                  {formatRange({ low: hours('conservative', f), high: hours('optimistic', f) })} {d.hours}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
