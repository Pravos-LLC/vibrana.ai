import type { ReactNode } from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import { GradientText } from '@/src/components/prism'

/**
 * Small shared pieces for the Build Sprint page (Workshop Log). The mono label voice
 * carries figure numbers, day counters and section labels; headlines stay grotesk.
 */
export function MonoLabel({ children, className, as: Tag = 'p' }: { children: ReactNode; className?: string; as?: 'p' | 'span' | 'div' }) {
  return <Tag className={cn('label-mono text-ink-tertiary', className)}>{children}</Tag>
}

/**
 * Section heading, left-aligned: an optional mono label, then the h2. Every h2 on the page carries
 * one key phrase (`accent`) in the Vibrana way: italic serif with the Prism gradient fill.
 */
export function SprintHeading({ label, heading, accent, id, className, children }: { label?: string; heading: string; accent?: string; id?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={cn('max-w-3xl', className)}>
      {label ? <MonoLabel className="mb-4">{label}</MonoLabel> : null}
      <h2 id={id} className="text-balance text-ink" style={{ fontSize: 'clamp(2rem, 1.5rem + 2.2vw, 3.25rem)', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
        <AccentedHeading heading={heading} accent={accent} />
      </h2>
      {children}
    </div>
  )
}

/** The heading text with the accent phrase set in italic serif gradient. Plain text when there is no accent. */
export function AccentedHeading({ heading, accent }: { heading: string; accent?: string }) {
  const at = accent ? heading.indexOf(accent) : -1
  if (!accent || at < 0) return <>{heading}</>
  const rest = heading.slice(at + accent.length)
  // Punctuation that directly follows the accent stays glued to it, so a comma never wraps onto its own line.
  const glued = rest.match(/^[,.;:!?]+/)?.[0] ?? ''
  return (
    <>
      {heading.slice(0, at)}
      <span className="whitespace-nowrap">
        <GradientText gradient="prism" className="font-serif-accent pr-[0.06em]">
          {accent}
        </GradientText>
        {glued}
      </span>
      {rest.slice(glued.length)}
    </>
  )
}

export const textLink =
  'rounded text-sm font-medium text-ink-secondary underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink'
