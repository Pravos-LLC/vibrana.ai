'use client'

import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Currency, Delivery, SimulatorResult } from '@/src/lib/simulator/types'
import { formatMoney } from '@/src/lib/simulator/format'
import { SIM_DELIVERY } from '@/src/simulator-content'
import { useWidth } from './CostChart'

const N = SIM_DELIVERY.net
const PAD = { top: 16, right: 92, bottom: 26, left: 64 }
const TICKS = [0, 6, 12, 18, 24]
const COLORS: Record<Delivery, string> = { consultant: '#7c3aed', diy: '#64748b' }
const ORDER: Delivery[] = ['consultant', 'diy']

/**
 * The running total of value freed less everything spent, month by month, for both ways of
 * getting there. The line crosses zero at break-even. Central scenario; the band behind the
 * chosen line is the conservative to optimistic range.
 */
export function NetChart({ comparison, active, currency }: { comparison: Record<Delivery, SimulatorResult>; active: Delivery; currency: Currency }) {
  const [wrapRef, W] = useWidth<HTMLDivElement>(900)
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<number | null>(null)
  const H = W < 560 ? 260 : 320
  const series = useMemo(() => Object.fromEntries(ORDER.map((d) => [d, comparison[d].scenarios.central.cumulativeNet])) as Record<Delivery, number[]>, [comparison])
  const cons = comparison[active].scenarios.conservative.cumulativeNet
  const opt = comparison[active].scenarios.optimistic.cumulativeNet

  const all = [...series.consultant, ...series.diy, ...cons, ...opt, 0]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (i / 24) * innerW
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * innerH
  const path = (vals: number[]) => `M${vals.map((v, i) => `${x(i)},${y(v)}`).join('L')}`
  const band = `M${cons.map((v, i) => `${x(i)},${y(v)}`).join('L')}L${opt.map((v, i) => `${x(i)},${y(v)}`).reverse().join('L')}Z`
  const yTicks = niceTicks(lo, hi)
  const draw = reduce ? { duration: 0 } : { duration: 1.3, ease: [0.22, 1, 0.36, 1] as const }

  const end = (d: Delivery) => series[d][24]
  const gap = end('consultant') - end('diy')

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <ul className="flex flex-wrap gap-6">
          {ORDER.map((d) => {
            const be = comparison[d].scenarios.central.breakEven
            return (
              <li key={d} className="min-w-[10rem]">
                <p className="flex items-center gap-2 type-xs font-medium text-ink-secondary">
                  <span aria-hidden className="inline-block h-2 w-5 rounded-full" style={{ background: COLORS[d], opacity: d === active ? 1 : 0.55 }} />
                  {SIM_DELIVERY.options[d]}
                </p>
                <p className="mt-1 font-display type-xl font-semibold tabular-nums text-ink">{formatMoney(end(d), currency, { compact: true })}</p>
                <p className="type-xs text-ink-tertiary">
                  {N.after} · {N.breakEven(be)}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="max-w-sm type-sm text-ink-secondary">{gap > 0 ? SIM_DELIVERY.verdict.ahead(formatMoney(gap, currency, { compact: true })) : SIM_DELIVERY.verdict.behind}</p>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={N.heading} onMouseLeave={() => setHover(null)}>
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'rgba(120,120,140,0.55)' : 'rgba(120,120,140,0.14)'} strokeDasharray={v === 0 ? '4 3' : undefined} />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-ink-tertiary" style={{ fontSize: 11 }}>
                {formatMoney(v, currency, { compact: true })}
              </text>
            </g>
          ))}
          {TICKS.map((t) => (
            <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="fill-ink-tertiary" style={{ fontSize: 11 }}>
              {t}
            </text>
          ))}

          <path d={band} fill={COLORS[active]} opacity={0.06} />
          {ORDER.filter((d) => d !== active).concat(active).map((d) => (
            <motion.path
              key={d}
              d={path(series[d])}
              fill="none"
              stroke={COLORS[d]}
              strokeWidth={d === active ? 2.75 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={d === active ? 1 : 0.6}
              initial={{ pathLength: reduce ? 1 : 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={draw}
            />
          ))}

          {ORDER.map((d) => {
            const be = comparison[d].scenarios.central.breakEven
            return be !== null && be > 0 ? (
              <motion.circle
                key={`be-${d}`}
                cx={x(be)}
                cy={y(series[d][be])}
                r={4.5}
                fill="var(--surface-base, #fff)"
                stroke={COLORS[d]}
                strokeWidth={2}
                initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: reduce ? 0 : 1.1, duration: 0.35 }}
                style={{ transformOrigin: `${x(be)}px ${y(series[d][be])}px` }}
              />
            ) : null
          })}

          {ORDER.map((d) => (
            <text key={`end-${d}`} x={x(24) + 8} y={y(end(d)) + 4} className="font-medium" style={{ fontSize: 11, fill: COLORS[d] }}>
              {formatMoney(end(d), currency, { compact: true })}
            </text>
          ))}

          {Array.from({ length: 25 }, (_, i) => (
            <rect key={i} x={x(i) - innerW / 48} y={PAD.top} width={innerW / 24} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(120,120,140,0.4)" />}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line-subtle bg-surface-raised px-3 py-2 type-xs shadow-lg"
            style={{ left: Math.min(Math.max(x(hover) - 70, 4), W - 190) }}
          >
            <p className="font-medium text-ink">{`Month ${hover}`}</p>
            {ORDER.map((d) => (
              <p key={d} className="mt-1 flex items-center justify-between gap-4 tabular-nums text-ink-secondary">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[d] }} />
                  {SIM_DELIVERY.options[d]}
                </span>
                {formatMoney(series[d][hover], currency)}
              </p>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 type-xs text-ink-tertiary">{N.axis}</p>
    </div>
  )
}

function niceTicks(lo: number, hi: number): number[] {
  const span = hi - lo || 1
  const raw = span / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v))
  return out.includes(0) ? out : [...out, 0].sort((a, b) => a - b)
}
