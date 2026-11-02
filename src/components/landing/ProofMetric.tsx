import React from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import { PROOF_MIN_CELL, proofGridTemplate } from './proof-metric-layout'

export interface ProofMetricProps {
  /** The figure, as written: `12`, `100+`, `4.2`. Kept on one line. */
  value: React.ReactNode
  /** Set smaller and lighter after the figure: `weeks`, `%`, `m`. */
  unit?: React.ReactNode
  /** Set smaller before the figure: `$`, `EUR`. */
  prefix?: React.ReactNode
  /** What the number counts. Held to a fixed measure under the figure. */
  label: React.ReactNode
  /** Where the number comes from, in the mono label voice. */
  source?: React.ReactNode
  className?: string
}

/**
 * ProofMetric: one stat in its own cell. The cell is never narrower than 160px; the figure scales
 * with the cell (container query units) inside a clamp, so a narrow cell gets a smaller figure,
 * never a wrapped or squeezed one. Tabular numerals; units smaller and lighter.
 *
 * Use inside ProofMetricRow, which owns the grid and the hairlines.
 */
export function ProofMetric({ value, unit, prefix, label, source, className }: ProofMetricProps) {
  return (
    <div
      data-proof-metric=""
      className={cn('flex flex-col px-5 py-6 sm:px-6 sm:py-7', className)}
      style={{ minWidth: PROOF_MIN_CELL, containerType: 'inline-size', boxShadow: '-1px 0 0 var(--border-default), 0 -1px 0 var(--border-default)' }}
    >
      <p
        data-proof-figure=""
        className="tabular whitespace-nowrap font-display font-semibold text-ink"
        style={{ fontSize: 'clamp(1.5rem, 0.5rem + 14cqi, 3.5rem)', lineHeight: 1, letterSpacing: '-0.025em' }}
      >
        {prefix ? <span className="mr-[0.14em] align-[0.42em] text-[0.42em] font-medium text-ink-tertiary">{prefix}</span> : null}
        {value}
        {unit ? <span className="ml-[0.1em] text-[0.46em] font-medium tracking-normal text-ink-tertiary">{unit}</span> : null}
      </p>
      <p className="type-sm mt-3 max-w-[24ch] text-ink-secondary" style={{ lineHeight: 1.35 }}>{label}</p>
      {source ? <p className="label-mono mt-auto pt-4 text-ink-tertiary">{source}</p> : null}
    </div>
  )
}

export interface ProofMetricRowProps {
  children: React.ReactNode
  /** Most columns the row may use. It drops columns (never shrinks cells below 160px) as space runs out. */
  maxColumns?: 2 | 3 | 4
  /** One source line for the whole row, under the hairline. */
  source?: React.ReactNode
  /** Accessible name for the group of stats. */
  label?: string
  className?: string
}

/**
 * ProofMetricRow: an auto-fit grid of ProofMetric cells with hairline dividers between cells only
 * (no outer box), and a top and bottom rule. Three per row reads best; four only for short figures.
 */
export function ProofMetricRow({ children, maxColumns = 3, source, label, className }: ProofMetricRowProps) {
  return (
    <figure role="group" aria-label={label} className={cn('m-0', className)}>
      <div className="overflow-hidden border-y border-line">
        <div data-proof-row="" className="grid" style={{ gridTemplateColumns: proofGridTemplate(maxColumns) }}>
          {children}
        </div>
      </div>
      {source ? <figcaption className="label-mono mt-3 text-ink-tertiary">{source}</figcaption> : null}
    </figure>
  )
}
