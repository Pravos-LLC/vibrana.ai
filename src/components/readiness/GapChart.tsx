'use client'

import { useState } from 'react'
import { Cite } from './Cite'

// Emphasis encoding: leaders are the one violet series; the comparison group is a hollow
// neutral ring. Fill vs hollow plus the legend carry identity, so it never rests on color.
const LEADER = '#7c3aed'
const REST = 'rgba(15,15,17,0.48)'
const TICKS = [0, 25, 50, 75, 100]

interface Row { label: string; leaders: number; rest: number; finding: string }
interface Group { source: string; definition: string; finding: string; sample: string; rows: readonly Row[] }

export interface GapChartProps {
  title: string
  subtitle: string
  legend: { leaders: string; rest: string }
  tableToggle: string
  chartToggle: string
  columns: { practice: string; leaders: string; rest: string; source: string }
  groups: readonly Group[]
}

/**
 * GapChart — a dumbbell chart: for each practice, the share of leaders (filled dot) and of
 * the comparison group (hollow ring) that report it, on one 0 to 100% axis. Rows are grouped
 * by survey, each with its own definition of a leader and its sample. Hover or focus a row
 * for its exact values; a table view carries the same numbers.
 */
export function GapChart({ title, subtitle, legend, tableToggle, chartToggle, columns, groups }: GapChartProps) {
  const [asTable, setAsTable] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  return (
    <figure className="rounded-2xl border border-line-subtle bg-surface-frost p-6 backdrop-blur-md md:p-8">
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

      <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-ink-secondary">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ background: LEADER }} />
          {legend.leaders}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full border-2 bg-surface-base" style={{ borderColor: REST }} />
          {legend.rest}
        </span>
      </div>

      {asTable ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line-subtle text-xs text-ink-tertiary">
                <th className="py-2 pr-4 font-medium">{columns.practice}</th>
                <th className="py-2 pr-4 font-medium tabular-nums">{columns.leaders}</th>
                <th className="py-2 pr-4 font-medium tabular-nums">{columns.rest}</th>
                <th className="py-2 font-medium">{columns.source}</th>
              </tr>
            </thead>
            <tbody>
              {groups.flatMap((g) =>
                g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-line-subtle last:border-0">
                    <td className="py-3 pr-4 text-ink">{r.label}</td>
                    <td className="py-3 pr-4 tabular-nums text-ink">{r.leaders}%</td>
                    <td className="py-3 pr-4 tabular-nums text-ink">{r.rest}%</td>
                    <td className="py-3 text-ink-secondary">{g.source}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((g) => (
            <div key={g.source}>
              <div className="text-sm font-semibold text-ink">{g.source}</div>
              <div className="mt-1 max-w-2xl text-xs leading-5 text-ink-secondary">{g.definition}</div>
              <div className="mt-4 space-y-5">
                {g.rows.map((r) => {
                  const on = active === r.label
                  return (
                    <div
                      key={r.label}
                      tabIndex={0}
                      aria-label={`${r.label}: ${legend.leaders} ${r.leaders}%, ${legend.rest} ${r.rest}%`}
                      onMouseEnter={() => setActive(r.label)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(r.label)}
                      onBlur={() => setActive(null)}
                      className="grid gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/30 md:grid-cols-[minmax(0,15rem)_1fr] md:items-center md:gap-6"
                    >
                      <div className={`text-sm leading-5 transition-colors ${on ? 'text-ink' : 'text-ink-secondary'}`}>{r.label}</div>
                      <div className="relative mx-9 h-10">
                        {/* hairline gridlines at 0 / 25 / 50 / 75 / 100 */}
                        {TICKS.map((t) => (
                          <span key={t} aria-hidden className="absolute inset-y-1 w-px bg-line-subtle" style={{ left: `${t}%` }} />
                        ))}
                        <span
                          aria-hidden
                          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full"
                          style={{ left: `${r.rest}%`, width: `${r.leaders - r.rest}%`, background: on ? 'rgba(124,58,237,0.45)' : 'rgba(124,58,237,0.22)' }}
                        />
                        <span
                          aria-hidden
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface-base ring-2 ring-surface-base"
                          style={{ left: `${r.rest}%`, borderColor: REST }}
                        />
                        <span
                          aria-hidden
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-base"
                          style={{ left: `${r.leaders}%`, background: LEADER }}
                        />
                        {/* direct labels: the comparison value sits left of its ring, the leader value right of its dot */}
                        <span aria-hidden className="absolute top-1/2 -translate-y-1/2 pr-3 text-xs tabular-nums text-ink-secondary" style={{ right: `${100 - r.rest}%` }}>
                          {r.rest}%
                        </span>
                        <span aria-hidden className="absolute top-1/2 -translate-y-1/2 pl-3 text-sm font-semibold tabular-nums text-ink" style={{ left: `${r.leaders}%` }}>
                          {r.leaders}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Cite findings={g.rows.map((r) => r.finding)} sample={g.sample} className="mt-3 md:pl-[calc(15rem+1.5rem)]" />
            </div>
          ))}
          <div aria-hidden className="relative hidden h-4 md:ml-[calc(15rem+3.75rem)] md:mr-9 md:block">
            {TICKS.map((t) => (
              <span key={t} className="absolute -translate-x-1/2 text-[11px] tabular-nums text-ink-tertiary" style={{ left: `${t}%` }}>
                {t}%
              </span>
            ))}
          </div>
        </div>
      )}
    </figure>
  )
}
