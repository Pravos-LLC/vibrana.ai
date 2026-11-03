import type { ReactNode } from 'react'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * Small shared pieces for the Build Sprint page (Workshop Log). The mono label voice
 * carries figure numbers, day counters and section labels; headlines stay grotesk.
 */
export function MonoLabel({ children, className, as: Tag = 'p' }: { children: ReactNode; className?: string; as?: 'p' | 'span' | 'div' }) {
  return <Tag className={cn('label-mono text-ink-tertiary', className)}>{children}</Tag>
}

/** Section heading, left-aligned: an optional mono label, then the h2. */
export function SprintHeading({ label, heading, id, className, children }: { label?: string; heading: string; id?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      {label ? <MonoLabel className="mb-4">{label}</MonoLabel> : null}
      <h2 id={id} className="text-balance text-ink" style={{ fontSize: 'clamp(2rem, 1.5rem + 2.2vw, 3.25rem)', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
        {heading}
      </h2>
      {children}
    </div>
  )
}

export const textLink =
  'rounded text-sm font-medium text-ink-secondary underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink'
