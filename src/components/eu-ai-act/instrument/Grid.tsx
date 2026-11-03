import React from 'react'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * The Regulatory Instrument grid for /eu-ai-act-readiness.
 *
 * The page sits inside one ruled column: two hairlines run the full height of the page at the
 * container edges (md and up), and every section opens on a horizontal hairline with a mono tab
 * resting on it (Oneleet's pattern). The lines carry structure, not decoration: each one is the
 * edge of a section or of the reading column.
 */
export const INSTRUMENT_WIDTH = 'max-w-[84rem]'

export function InstrumentColumn({ children }: { children: React.ReactNode }) {
  return <div className={cn('relative mx-auto md:border-x md:border-line-subtle', INSTRUMENT_WIDTH)}>{children}</div>
}

/**
 * A section of the instrument: a hairline across the column with its mono tab on the line.
 * `band` sets the surface; `dark` scopes the dark tokens to this section (the page's one
 * inversion band).
 */
export function InstrumentSection({
  id,
  tab,
  children,
  dark = false,
  band = 'base',
  className,
}: {
  id: string
  tab: string
  children: React.ReactNode
  dark?: boolean
  band?: 'base' | 'raised'
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-tab`}
      data-theme={dark ? 'dark' : undefined}
      className={cn(
        'relative border-t border-line-subtle',
        band === 'raised' ? 'bg-surface-raised' : 'bg-surface-base',
        dark && 'text-ink [color-scheme:dark]',
        className,
      )}
    >
      <div className="flex">
        <span
          id={`${id}-tab`}
          className="label-mono -mt-px border-b border-r border-line-subtle bg-surface-base px-4 py-2 text-ink-secondary md:px-6"
        >
          {tab}
        </span>
      </div>
      <div className="px-6 pb-20 pt-12 md:px-10 md:pb-28 md:pt-16 xl:px-14">{children}</div>
    </section>
  )
}

/** Dashed column guides behind the hero: the grid made visible, wide screens only. */
export function ColumnGuides({ columns = 12 }: { columns?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="mx-auto grid h-full px-10 2xl:px-14" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, i) => (
          <span key={i} className={cn('h-full', i > 0 && 'border-l border-dashed border-line-subtle/70')} />
        ))}
      </div>
    </div>
  )
}

export const H2_CLASS = 'max-w-[22ch] font-display font-semibold text-ink'
export const H2_STYLE: React.CSSProperties = { fontSize: 'clamp(1.875rem, 1.2rem + 2.2vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.025em' }
export const LEAD_CLASS = 'max-w-[62ch] text-ink-secondary'
export const LEAD_STYLE: React.CSSProperties = { fontSize: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)', lineHeight: 1.65 }
