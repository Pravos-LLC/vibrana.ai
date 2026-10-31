'use client'

import { useState } from 'react'
import { Cite } from './Cite'

const BAR = '#7c3aed'

export interface PreparednessChartProps {
  title: string
  subtitle: string
  note: string
  finding: string
  sample: string
  tableToggle: string
  chartToggle: string
  columns: { area: string; value: string }
  bars: readonly { label: string; value: number }[]
}

/**
 * PreparednessChart — one series of horizontal bars (Deloitte's "highly prepared" share by
 * area) on a fixed 0 to 100% scale, value at each bar's tip. A single series needs no
 * legend: the title names it. Hover or focus dims the other bars; a table view carries the
 * same numbers.
 */
export function PreparednessChart({ title, subtitle, note, finding, sample, tableToggle, chartToggle, columns, bars }: PreparednessChartProps) {
  const [asTable, setAsTable] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  return (
    <figure className="rounded-2xl border border-line-subtle bg-surface-base p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <figcaption className="max-w-xl">
          <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h3>
          <div className="mt-2 text-sm leading-6 text-ink-secondary">{subtitle}</div>
        </figcaption>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="self-start whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:border-line-strong hover:text-ink"
        >
          {asTable ? chartToggle : tableToggle}
        </button>
      </div>

      {asTable ? (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-subtle text-xs text-ink-tertiary">
              <th className="py-2 pr-4 font-medium">{columns.area}</th>
              <th className="py-2 font-medium tabular-nums">{columns.value}</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.label} className="border-b border-line-subtle last:border-0">
                <td className="py-3 pr-4 text-ink">{b.label}</td>
                <td className="py-3 tabular-nums text-ink">{b.value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6 space-y-4">
          {bars.map((b) => (
            <div
              key={b.label}
              tabIndex={0}
              aria-label={`${b.label}: ${b.value}%`}
              onMouseEnter={() => setActive(b.label)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(b.label)}
              onBlur={() => setActive(null)}
              className="grid grid-cols-[8.5rem_1fr] items-center gap-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/30 sm:grid-cols-[11rem_1fr]"
            >
              <span className="text-sm leading-5 text-ink-secondary">{b.label}</span>
              <div className="relative flex h-6 items-center">
                <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-line" />
                <span
                  aria-hidden
                  className="h-4 rounded-r-[4px] transition-opacity duration-200"
                  style={{ width: `${b.value}%`, background: BAR, opacity: active === null || active === b.label ? 1 : 0.35 }}
                />
                <span aria-hidden className="pl-2 text-sm font-semibold tabular-nums text-ink">{b.value}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 text-xs leading-5 text-ink-secondary">{note}</div>
      <Cite findings={[finding]} sample={sample} className="mt-1" />
    </figure>
  )
}
