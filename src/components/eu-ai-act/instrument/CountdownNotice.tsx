'use client'

import { useEffect, useState } from 'react'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import type { EUMilestone } from '@/src/eu-ai-act-readiness-content'
import { LegalCite } from '../LegalCite'
import { TONE } from '../tone'

const DAY = 86_400_000

/**
 * Today as an ISO date. The server passes the render date so the first paint already names the
 * right milestone; after mount the visitor's own date takes over (the page is prerendered, so the
 * render date can be days old).
 */
export function useLiveToday(initial: string): string {
  const [today, setToday] = useState(initial)
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), [])
  return today
}

/** The next milestone after `today`, or null once every date has passed. */
export function nextMilestone(milestones: readonly EUMilestone[], today: string): EUMilestone | null {
  return milestones.find((m) => m.date > today) ?? null
}

/**
 * One digit on an odometer wheel: a column of 0 to 9 that rolls to its value. Under reduced
 * motion it is set in place.
 */
function Wheel({ digit, delay, reduce }: { digit: number; delay: number; reduce: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden align-top">
      <span
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{
          transform: `translateY(${-digit * 10}%)`,
          transition: reduce ? 'none' : `transform 900ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
        }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="block h-[1em] text-center leading-none">
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * CountdownNotice: the hero's instrument. The number of days to the next date in the Act, the
 * milestone it counts to (read from the timeline data, so it rolls over on its own), the footnote
 * on the amended dates and the provision behind the milestone.
 *
 * The day count is measured in the visitor's browser: before hydration the wheels rest at zero
 * width-reserved and hidden; after mount they roll to the value. Screen readers get the count as
 * text, once.
 */
export function CountdownNotice({
  milestones,
  initialToday,
  label,
  daysLabel,
  footnote,
  nextTitle,
  className,
}: {
  milestones: readonly EUMilestone[]
  initialToday: string
  label: string
  daysLabel: string
  footnote: string
  nextTitle: (m: { dateLabel: string; title: string }) => string
  className?: string
}) {
  const today = useLiveToday(initialToday)
  const reduce = useHydratedReducedMotion()
  const [measured, setMeasured] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMeasured(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const next = nextMilestone(milestones, today)
  const days = next ? Math.ceil((Date.parse(next.date) - Date.parse(today)) / DAY) : null
  const digits = days !== null ? String(days).split('').map(Number) : []

  return (
    <div className={cn('relative border border-line bg-surface-base', className)} data-countdown>
      <div className="flex items-center justify-between gap-4 border-b border-line-subtle px-5 py-2.5">
        <span className="label-mono text-ink-secondary">{label}</span>
        {next && <span aria-hidden className={cn('h-2 w-2 rotate-45', TONE[next.tone].fill)} />}
      </div>
      {next && days !== null ? (
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-end gap-3">
            <span
              aria-hidden
              className={cn('tabular font-display font-semibold text-ink transition-opacity duration-300', measured ? 'opacity-100' : 'opacity-0')}
              style={{ fontSize: 'clamp(3.25rem, 2.6rem + 2.4vw, 4.5rem)', lineHeight: 1, letterSpacing: '-0.04em' }}
            >
              {digits.map((d, i) => (
                <Wheel key={i} digit={measured ? d : 0} delay={i * 90} reduce={reduce} />
              ))}
            </span>
            <span className="pb-1.5 text-ink-secondary" style={{ fontSize: 15 }}>
              {daysLabel}
            </span>
            <span className="sr-only" data-countdown-days>
              {days} {daysLabel}
            </span>
          </div>
          <div className="mt-4 border-t border-line-subtle pt-3 font-display font-semibold text-ink" style={{ fontSize: 17, lineHeight: 1.35 }} data-countdown-milestone>
            {nextTitle(next)}
          </div>
          <LegalCite findings={next.findings} className="mt-2" />
          <div className="mt-2 text-xs leading-5 text-ink-tertiary">{footnote}</div>
        </div>
      ) : (
        <div className="px-5 py-4 text-xs leading-5 text-ink-tertiary">{footnote}</div>
      )}
    </div>
  )
}
