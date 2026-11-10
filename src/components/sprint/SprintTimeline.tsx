'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PRISM_STROKE } from '@/src/components/landing'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { SPRINT_DAYS } from '@/src/ai-build-sprint-content'
import { LoopPlate } from './LoopPlate'
import { SprintHeading } from './ui'
import { Reveal, RevealStack } from './motion'

const { steps, log, railLabel, railAria, afterLine } = SPRINT_DAYS

/** First day (0-based) of each phase, derived from the spans so the rail can never disagree with the steps. */
const FIRST_DAY = steps.reduce<number[]>((acc, step, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + steps[i - 1].span)
  return acc
}, [])

function phaseOf(day: number) {
  for (let i = steps.length - 1; i >= 0; i--) if (day >= FIRST_DAY[i]) return i
  return 0
}

const AUTO_MS = 7000

/**
 * The ten days as four phases you can click through (replaces the pinned terminal build log).
 * Each phase has its own gentle loop; the day rail jumps to any day, so "Day 10" is one click.
 * It advances by itself while on screen until the visitor takes over. Nothing is pinned, so the page
 * scrolls normally. Under reduced motion it never auto-advances and videos stay on their posters.
 */
export function SprintTimeline({ after }: { after?: React.ReactNode }) {
  const reduce = useHydratedReducedMotion()
  const [day, setDay] = useState(0)
  const [manual, setManual] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const phase = phaseOf(day)
  const step = steps[phase]

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Auto-advance one phase at a time until the visitor clicks.
  useEffect(() => {
    if (manual || reduce || !inView) return
    const id = window.setTimeout(() => setDay(FIRST_DAY[(phaseOf(day) + 1) % steps.length]), AUTO_MS)
    return () => window.clearTimeout(id)
  }, [day, manual, reduce, inView])

  const pick = useCallback((d: number) => {
    setManual(true)
    setDay(d)
  }, [])

  return (
    <div ref={ref} className="px-6 py-20 md:py-28" data-testid="sprint-timeline">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <SprintHeading label={SPRINT_DAYS.eyebrow} heading={SPRINT_DAYS.heading} accent={SPRINT_DAYS.accent} id="sprint-days-heading" />
        </Reveal>

        {/* All ten days stay in the DOM for crawlers and screen readers, whichever one is on show. */}
        <ol className="sr-only">
          {log.map((line) => (
            <li key={line.day}>
              {line.day}: {line.text}
            </li>
          ))}
        </ol>

        {/* Day rail: every day is a button. */}
        <Reveal delay={0.1} className="mt-10">
          <div role="group" aria-label={railAria} className="grid grid-cols-10 gap-1.5">
            {log.map((_, i) => {
              const on = i === day
              const inPhase = phaseOf(i) === phase
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(i)}
                  className={cn(
                    'label-mono tabular relative rounded-md border py-2 text-center transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.96]',
                    on ? 'border-transparent text-white' : inPhase ? 'border-line-strong bg-surface-raised text-ink' : 'border-line-subtle text-ink-tertiary hover:border-line hover:text-ink',
                  )}
                >
                  {on ? <motion.span layoutId="sprint-day-pill" className="absolute inset-0 -z-0 rounded-md" style={{ background: PRISM_STROKE }} transition={{ type: 'spring', stiffness: 380, damping: 34 }} /> : null}
                  <span className="relative z-10">{railLabel(i + 1)}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          <RevealStack as="ol" className="grid gap-3" stagger={0.09}>
            {steps.map((s, i) => {
              const on = i === phase
              return (
                <Reveal as="li" key={s.title} variant="item">
                  <button
                    type="button"
                    aria-current={on}
                    onClick={() => pick(FIRST_DAY[i])}
                    className={cn(
                      'group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-300',
                      on ? 'border-line-strong bg-surface-base shadow-[0_18px_44px_-28px_rgba(91,60,210,0.45)]' : 'border-line-subtle hover:border-line hover:bg-surface-base/60',
                    )}
                  >
                    <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] origin-top transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ background: PRISM_STROKE, transform: `scaleY(${on ? 1 : 0})` }} />
                    <span className="label-mono block text-ink-tertiary">{s.days}</span>
                    <span className={cn('mt-1 block font-display text-xl font-semibold transition-colors duration-300', on ? 'text-ink' : 'text-ink-secondary')} style={{ lineHeight: 1.25 }}>
                      {s.title}
                    </span>
                    <span className={cn('type-sm mt-1.5 block max-w-md transition-colors duration-300', on ? 'text-ink-secondary' : 'text-ink-tertiary')} style={{ lineHeight: 1.5 }}>
                      {s.body}
                    </span>
                  </button>
                </Reveal>
              )
            })}
            {after ? <li className="pt-4">{after}</li> : null}
          </RevealStack>

          <Reveal delay={0.15} variant="block" className="lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-overlay shadow-[0_30px_70px_-40px_rgba(30,20,90,0.55)]">
              <div className="relative aspect-[16/10]">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={step.stem}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <LoopPlate stem={step.stem} className="h-full rounded-none border-0" />
                  </motion.div>
                </AnimatePresence>
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
                      <span className="label-mono tabular rounded-full bg-white/15 px-2.5 py-1 text-white backdrop-blur-sm">{log[day].day}</span>
                      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white sm:text-base">{log[day].text}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <div className="h-[3px] bg-line">
                <span className="block h-full origin-left transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ background: PRISM_STROKE, transform: `scaleX(${(day + 1) / log.length})` }} />
              </div>
            </div>
            <p className="type-sm mt-4 text-ink-tertiary">
              <span className="label-mono mr-2">{afterLine.day}</span>
              {afterLine.text}
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
