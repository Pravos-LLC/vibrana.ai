'use client'

import React from 'react'

/**
 * CaseStudyChart — lightweight, dependency-free SVG charts for case-study
 * markdown. Authors add a fenced ```chart block with a JSON spec:
 *
 *   ```chart
 *   { "type": "bar", "title": "QA coverage", "unit": "%",
 *     "data": [ { "label": "Before", "value": 2 }, { "label": "After", "value": 100 } ] }
 *   ```
 *
 * Types: "bar" (vertical bars) and "progress" (horizontal before/after rows).
 * Colours come from the Prism spectrum. Renders nothing (with a hint) on bad JSON.
 */

export interface ChartDatum {
  label: string
  value: number
  /** Optional override: 'violet' | 'blue' | 'cyan' | 'emerald' | 'amber' */
  color?: keyof typeof ACCENTS
}

export interface ChartSpec {
  type?: 'bar' | 'progress'
  title?: string
  unit?: string
  /** For progress charts: the value that represents 100% (defaults to max). */
  max?: number
  data: ChartDatum[]
}

const ACCENTS = {
  violet: '#7c3aed',
  blue: '#3b82f6',
  cyan: '#0d9488',
  emerald: '#16a34a',
  amber: '#b45309',
} as const

const ORDER: (keyof typeof ACCENTS)[] = ['violet', 'blue', 'cyan', 'emerald', 'amber']

function fmt(n: number, unit?: string): string {
  const s = Number.isInteger(n) ? n.toLocaleString() : n.toString()
  return unit ? `${s}${unit}` : s
}

export function CaseStudyChart({ spec }: { spec: ChartSpec }) {
  const data = spec.data ?? []
  if (data.length === 0) return null
  const max = spec.max ?? Math.max(...data.map((d) => d.value), 1)
  const isProgress = spec.type === 'progress'

  return (
    <figure className="my-8 rounded-2xl border border-line-subtle bg-surface-frost p-6 backdrop-blur-md">
      {spec.title && (
        <figcaption className="mb-5 text-xs font-medium uppercase tracking-wider text-ink-tertiary">
          {spec.title}
        </figcaption>
      )}

      {isProgress ? (
        <div className="space-y-4">
          {data.map((d, i) => {
            const pct = Math.max(0, Math.min(100, (d.value / max) * 100))
            const color = ACCENTS[d.color ?? ORDER[i % ORDER.length]]
            return (
              <div key={d.label}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-ink-secondary">{d.label}</span>
                  <span className="font-semibold text-ink">{fmt(d.value, spec.unit)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-overlay">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-end justify-around gap-4" style={{ height: '180px' }}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * 100)
            const color = ACCENTS[d.color ?? ORDER[i % ORDER.length]]
            return (
              <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-2 text-sm font-semibold text-ink">
                  {fmt(d.value, spec.unit)}
                </span>
                <div
                  className="w-full max-w-[72px] rounded-t-md"
                  style={{ height: `${h}%`, background: color }}
                />
                <span className="mt-3 text-center text-xs text-ink-secondary">{d.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </figure>
  )
}

/** Parse a ```chart code block body into a spec (null if invalid). */
export function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const spec = JSON.parse(raw) as ChartSpec
    if (!spec || !Array.isArray(spec.data)) return null
    return spec
  } catch {
    return null
  }
}
