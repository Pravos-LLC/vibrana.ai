'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Currency, SimulatorResult } from '@/src/lib/simulator/types'
import { formatMoney, formatMoneyRange, formatRange } from '@/src/lib/simulator/format'
import { SIM_DASH } from '@/src/simulator-content'
import { CAPACITY_GREEN, COST_ONE_OFF, COST_RUN } from './dept'

const c = SIM_DASH.pnl
/** Everything above the run cost: training and setup time, outside fees, and your own build hours. */
const oneOffOf = (m: SimulatorResult['scenarios']['central']['months'][number]) => m.costs.trainingTime + m.costs.governanceSetup + m.costs.outsideFees + m.costs.buildTime
const PAD = { top: 14, right: 12, bottom: 28, left: 64 }
const TICKS = [0, 3, 6, 12, 18, 24]

/** Width of the chart's container, so the SVG draws at real pixels (readable text on a phone, no sideways scroll). */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/**
 * The AI P&L projection: a diverging monthly bar chart. Above the axis, what the
 * company spends (AI run cost, then training and setup time); below it, the
 * capacity value freed (hatched: time, not cash) and a cash saving only when the
 * visitor gave a cash number. Bands show the conservative-optimistic range.
 */
export function CostChart({ result, currency, width }: { result: SimulatorResult; currency: Currency; /** A fixed width (a motion-studio reel); the page measures its container. */ width?: number }) {
  const [wrapRef, measured] = useWidth<HTMLDivElement>(900)
  const W = width ?? measured
  const reduce = useReducedMotion()
  const [hover, setHover] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const central = result.scenarios.central.months
  const cons = result.scenarios.conservative.months
  const opt = result.scenarios.optimistic.months
  const hasCash = central.some((m) => m.cashSaving !== null)
  const H = W < 560 ? 300 : 380

  const rows = useMemo(
    () => central.map((m) => ({ m, run: m.runCost, oneOff: oneOffOf(m) })),
    [central],
  )

  const upOf = (m: (typeof central)[number]) => m.runCost + oneOffOf(m)
  const maxUp = Math.max(...cons.map(upOf), ...central.map((m) => m.ceiling), 1)
  const maxDown = Math.max(...opt.map((m) => m.capacityValue + (m.cashSaving ?? 0)), 1)
  const innerH = H - PAD.top - PAD.bottom
  const upShare = maxUp / (maxUp + maxDown)
  const axisY = PAD.top + innerH * Math.min(0.6, Math.max(0.2, upShare))
  const scale = Math.min((axisY - PAD.top) / maxUp, (H - PAD.bottom - axisY) / maxDown)
  const innerW = W - PAD.left - PAD.right
  const step = innerW / central.length
  const gap = Math.max(2, Math.min(5, step * 0.22))
  const barW = Math.max(3, step - gap)
  const x = (i: number) => PAD.left + i * step + (step - barW) / 2
  const xc = (i: number) => PAD.left + i * step + step / 2

  const bandPath = (top: number[], bottom: number[]) =>
    `M${top.map((v, i) => `${xc(i)},${v}`).join('L')}L${bottom
      .map((v, i) => `${xc(i)},${v}`)
      .reverse()
      .join('L')}Z`
  const linePath = (vals: number[]) => `M${vals.map((v, i) => `${xc(i)},${v}`).join('L')}`
  const upY = (ms: typeof central) => ms.map((m) => axisY - upOf(m) * scale)
  const capY = (ms: typeof central) => ms.map((m) => axisY + m.capacityValue * scale)
  const ceilingY = central.map((m) => axisY - m.ceiling * scale)
  const ticks = niceTicks(maxUp, maxDown, scale, axisY)
  const hv = hover === null ? null : rows[hover]
  const grow = (i: number) => (reduce ? { duration: 0 } : { duration: 0.55, delay: i * 0.018, ease: [0.22, 1, 0.36, 1] as const })

  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 type-xs text-ink-secondary">
        <LegendSwatch color={COST_RUN} label={c.series.run} />
        <LegendSwatch color={COST_ONE_OFF} label={c.series.oneOff} />
        <li className="flex items-center gap-2">
          <svg width="10" height="10" aria-hidden>
            <defs>
              <Hatch id="sim-hatch-legend" />
            </defs>
            <rect width="10" height="10" rx="2" fill="url(#sim-hatch-legend)" />
          </svg>
          {c.series.capacity}
        </li>
        {hasCash && <LegendSwatch color={CAPACITY_GREEN} label={c.series.cash} />}
        <li className="flex items-center gap-2">
          <svg width="18" height="6" aria-hidden>
            <line x1="0" y1="3" x2="18" y2="3" stroke="rgba(15,15,17,0.66)" strokeDasharray="4 3" strokeWidth="1.5" />
          </svg>
          {c.series.ceiling}
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: 'rgba(15,15,17,0.08)' }} aria-hidden />
          {c.series.band}
        </li>
      </ul>

      <div ref={wrapRef} className="relative mt-4">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={c.heading} onMouseLeave={() => setHover(null)}>
          <defs>
            <Hatch id="sim-hatch" />
          </defs>

          {ticks.map((tk) => (
            <g key={tk.y}>
              <line x1={PAD.left} x2={W - PAD.right} y1={tk.y} y2={tk.y} stroke="rgba(15,15,17,0.06)" />
              <text x={PAD.left - 8} y={tk.y + 4} textAnchor="end" className="fill-ink-tertiary" style={{ fontSize: 11 }}>
                {formatMoney(tk.value, currency, { compact: true })}
              </text>
            </g>
          ))}

          <path d={bandPath(upY(cons), upY(opt))} fill="rgba(15,15,17,0.06)" />
          <path d={bandPath(capY(opt), capY(cons))} fill="rgba(22,163,74,0.08)" />

          {rows.map((r, i) => {
            const runH = r.run * scale
            const oneH = r.oneOff * scale
            const capH = r.m.capacityValue * scale
            const cashH = (r.m.cashSaving ?? 0) * scale
            return (
              <g key={i} opacity={hover === null || hover === i ? 1 : 0.4} style={{ transition: 'opacity 150ms ease' }}>
                <motion.g initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={grow(i)} style={{ transformOrigin: `0px ${axisY}px` }}>
                  {runH > 0.5 && <rect x={x(i)} y={axisY - runH + 1} width={barW} height={Math.max(0, runH - 2)} rx={1.5} fill={COST_RUN} />}
                  {oneH > 0.5 && <rect x={x(i)} y={axisY - runH - oneH + 1} width={barW} height={Math.max(0, oneH - 2)} rx={1.5} fill={COST_ONE_OFF} />}
                  {capH > 0.5 && <rect x={x(i)} y={axisY + 1} width={barW} height={Math.max(0, capH - 2)} rx={1.5} fill="url(#sim-hatch)" stroke={CAPACITY_GREEN} strokeOpacity={0.5} strokeWidth={0.8} />}
                  {cashH > 0.5 && <rect x={x(i)} y={axisY + capH + 1} width={barW} height={Math.max(0, cashH - 2)} rx={1.5} fill={CAPACITY_GREEN} />}
                </motion.g>
              </g>
            )
          })}

          <path d={linePath(upY(central))} fill="none" stroke="rgba(15,15,17,0.5)" strokeWidth={1.5} />
          <path d={linePath(capY(central))} fill="none" stroke={CAPACITY_GREEN} strokeWidth={1.5} />
          <path d={linePath(ceilingY)} fill="none" stroke="rgba(15,15,17,0.6)" strokeWidth={1.5} strokeDasharray="5 4" />

          <line x1={PAD.left} x2={W - PAD.right} y1={axisY} y2={axisY} stroke="rgba(15,15,17,0.4)" />
          {TICKS.map((m) => (
            <text key={m} x={xc(m)} y={H - 8} textAnchor="middle" className="fill-ink-tertiary" style={{ fontSize: 11 }}>
              {m}
            </text>
          ))}
          <text x={PAD.left - 8} y={axisY - 6} textAnchor="end" className="fill-ink-secondary" style={{ fontSize: 11, fontWeight: 600 }}>
            {c.axisUp}
          </text>
          <text x={PAD.left - 8} y={axisY + 15} textAnchor="end" className="fill-ink-secondary" style={{ fontSize: 11, fontWeight: 600 }}>
            {c.axisDown}
          </text>

          {/* Hit targets wider than the bars. */}
          {rows.map((_, i) => (
            <rect key={`hit-${i}`} x={PAD.left + i * step} y={PAD.top} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
          ))}
        </svg>

        {hv && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-64 rounded-xl border border-line-subtle bg-surface-base/95 p-3 shadow-[0_12px_32px_rgba(76,29,149,0.12)] backdrop-blur"
            style={{ left: Math.min(W - 264, Math.max(0, xc(hover) + 12)) }}
          >
            <p className="type-xs font-semibold text-ink">{c.tooltip.month(hover)}</p>
            <dl className="mt-2 space-y-1 type-xs">
              <Row label={c.tooltip.lines.seats} value={formatMoney(hv.m.costs.seats, currency)} />
              <Row label={c.tooltip.lines.builders} value={formatMoney(hv.m.costs.builders, currency)} />
              <Row label={c.tooltip.lines.usage} value={formatMoney(hv.m.costs.usage, currency)} />
              <Row label={c.tooltip.lines.agents} value={formatMoney(hv.m.costs.agents, currency)} />
              <Row label={c.tooltip.lines.tooling} value={formatMoney(hv.m.costs.tooling, currency)} />
              {hv.m.costs.addOns > 0.5 && <Row label={c.tooltip.lines.addOns} value={formatMoney(hv.m.costs.addOns, currency)} />}
              <Row label={c.tooltip.lines.reserve} value={formatMoney(hv.m.costs.reserve, currency)} />
              <Row label={c.tooltip.lines.governance} value={formatMoney(hv.m.costs.governance, currency)} />
              <Row strong label={c.tooltip.run} value={`${formatMoney(hv.run, currency)}`} swatch={COST_RUN} />
              <p className="text-ink-tertiary">
                {c.tooltip.range} {formatMoneyRange({ low: opt[hover].runCost, high: cons[hover].runCost }, currency)}
              </p>
              {hv.oneOff > 0.5 && <Row label={c.series.oneOff} value={formatMoney(hv.oneOff, currency)} swatch={COST_ONE_OFF} />}
              <div className="border-t border-line-subtle pt-1.5">
                <Row strong label={c.tooltip.capacity} value={formatMoney(hv.m.capacityValue, currency)} swatch={CAPACITY_GREEN} />
                <p className="text-ink-tertiary">
                  {c.tooltip.range} {formatMoneyRange({ low: cons[hover].capacityValue, high: opt[hover].capacityValue }, currency)}
                </p>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        {result.resolved.functionMix.sales > 0 ? <p className="type-xs text-ink-tertiary">{c.salesNote}</p> : <span />}
        <button type="button" onClick={() => setTable((v) => !v)} className="type-xs font-medium text-brand-violet-strong hover:underline">
          {table ? c.tableHide : c.tableToggle}
        </button>
      </div>
      {table && (
        <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-line-subtle">
          <table className="w-full type-xs tabular-nums">
            <thead className="sticky top-0 bg-surface-raised">
              <tr className="text-left text-ink-tertiary">
                {c.tableHeaders.map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {central.map((m, i) => (
                <tr key={i} className="border-t border-line-subtle text-ink-secondary">
                  <td className="px-3 py-1.5">{m.month}</td>
                  <td className="px-3 py-1.5">{formatMoneyRange({ low: opt[i].runCost, high: cons[i].runCost }, currency)}</td>
                  <td className="px-3 py-1.5">{formatMoney(oneOffOf(m), currency)}</td>
                  <td className="px-3 py-1.5">{formatMoneyRange({ low: cons[i].capacityValue, high: opt[i].capacityValue }, currency)}</td>
                  <td className="px-3 py-1.5">{formatRange({ low: cons[i].hoursFreed, high: opt[i].hoursFreed })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} aria-hidden />
      {label}
    </li>
  )
}

function Row({ label, value, swatch, strong }: { label: string; value: string; swatch?: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={`flex items-center gap-1.5 ${strong ? 'font-medium text-ink' : 'text-ink-secondary'}`}>
        {swatch && <span className="inline-block h-2 w-2 rounded-sm" style={{ background: swatch }} aria-hidden />}
        {label}
      </dt>
      <dd className={`tabular-nums ${strong ? 'font-medium text-ink' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="rgba(22,163,74,0.10)" />
      <line x1="0" y1="0" x2="0" y2="6" stroke={CAPACITY_GREEN} strokeWidth="1.6" strokeOpacity="0.7" />
    </pattern>
  )
}

function niceTicks(maxUp: number, maxDown: number, scale: number, axisY: number) {
  const nice = (v: number) => {
    const p = 10 ** Math.floor(Math.log10(Math.max(1, v)))
    const n = v / p
    return (n >= 5 ? 5 : n >= 2 ? 2 : 1) * p
  }
  const out: { y: number; value: number }[] = []
  const up = nice(maxUp / 2)
  for (let v = up; v <= maxUp * 1.01; v += up) out.push({ y: axisY - v * scale, value: v })
  const down = nice(maxDown / 2)
  for (let v = down; v <= maxDown * 1.01; v += down) out.push({ y: axisY + v * scale, value: v })
  const kept: { y: number; value: number }[] = []
  for (const t of out) {
    if (Math.abs(t.y - axisY) < 24) continue
    if (kept.some((k) => Math.abs(k.y - t.y) < 18)) continue
    kept.push(t)
  }
  return kept
}
