'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { DistinctProductFrame, PRISM_STROKE } from '@/src/components/landing'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { SPRINT_DAYS } from '@/src/ai-build-sprint-content'
import { MonoLabel, SprintHeading } from './ui'

const { steps, log, shippedStamp, afterLine, railLabel, reducedMotionNote, logTitle, figCaption } = SPRINT_DAYS
/** Ten days, then the shipped stamp. */
const STEPS = log.length + 1
const SHIPPED = log.length

/** Which of the four kept phases (Scope, Build together, Real users, Hand over) a day belongs to. */
function phaseOf(day: number) {
  if (day <= 0) return 0
  if (day <= 7) return 1
  if (day === 8) return 2
  return 3
}

type Mode = 'static' | 'pinned' | 'flow'
const PIN_QUERY = '(min-width: 1024px) and (min-height: 760px)'

/**
 * SprintTimeline: the ten days as a build log (plan B7, hub deck §4).
 *
 * Pinned (1024px wide and 760px tall, motion allowed): the section holds while the visitor
 * scrolls. Each scroll step is one day: the D1 to D10 rail fills with the page's gradient, the
 * phase on the left lights, and that day's log line types into the dark build window. After D10
 * a "Shipped" stamp lands and the D+30 line follows.
 *
 * Flow (phones, short screens): no pinning; the phases stack, then the log lines appear as they
 * scroll into view. Static (reduced motion, and the server render): every line shown at once.
 * All ten lines are always in the DOM, so screen readers read the whole log in any mode.
 */
export function SprintTimeline({ after }: { after?: React.ReactNode }) {
  const reduce = useHydratedReducedMotion()
  const [pin, setPin] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY)
    const on = () => setPin(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const mode: Mode = reduce || pin === null ? 'static' : pin ? 'pinned' : 'flow'

  return (
    <div ref={ref} className="sprint-log-track relative" data-testid="sprint-timeline" data-mode={mode}>
      {mode === 'pinned' ? <Pinned target={ref} after={after} /> : <Stacked mode={mode} after={after} />}
    </div>
  )
}

function Heading({ wide }: { wide?: boolean }) {
  return <SprintHeading label={SPRINT_DAYS.eyebrow} heading={SPRINT_DAYS.heading} className={wide ? 'max-w-none' : undefined} />
}

/** The D1 to D10 rail. `reached` is how many days are filled. */
function Rail({ reached }: { reached: number }) {
  return (
    <div aria-hidden className="relative">
      <div className="grid grid-cols-10">
        {log.map((_, i) => (
          <span key={i} className={cn('label-mono tabular pb-2 transition-colors duration-200', i < reached ? 'text-ink' : 'text-ink-tertiary')}>
            {railLabel(i + 1)}
          </span>
        ))}
      </div>
      <div className="relative h-[3px] overflow-hidden rounded-full bg-line">
        <span
          className="absolute inset-0 origin-left rounded-full transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ background: PRISM_STROKE, transform: `scaleX(${reached / log.length})` }}
        />
      </div>
    </div>
  )
}

/** The four kept phase steps. `active` lights one; -1 shows them all at full ink. */
function Phases({ active, compact, className }: { active: number; compact?: boolean; className?: string }) {
  return (
    <ol className={cn('grid gap-0', className)}>
      {steps.map((step, i) => {
        const on = active === -1 || active === i
        return (
          <li key={step.title} className={cn('relative border-l border-line pl-6', compact ? 'py-2.5' : 'py-4')}>
            <span
              aria-hidden
              className="absolute -left-px top-2.5 bottom-2.5 w-[2px] origin-top rounded-full bg-ink transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ transform: `scaleY(${active === i ? 1 : 0})` }}
            />
            <MonoLabel className={cn('transition-colors duration-200', on ? 'text-ink-secondary' : 'text-ink-tertiary')}>{step.days}</MonoLabel>
            <h3 className={cn('mt-1.5 transition-colors duration-200', on ? 'text-ink' : 'text-ink-tertiary')} style={{ fontSize: '1.25rem', lineHeight: 1.25 }}>
              {step.title}
            </h3>
            <p className={cn('type-sm mt-1 max-w-xs transition-colors duration-200', on ? 'text-ink-secondary' : 'text-ink-tertiary')} style={{ lineHeight: 1.45 }}>
              {step.body}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** Types `text` in over at most 650 ms once `active`; renders the untyped rest invisibly so the line keeps its height. */
function Typed({ text, active }: { text: string; active: boolean }) {
  const [n, setN] = useState(active ? 0 : text.length)
  useEffect(() => {
    if (!active) {
      setN(text.length)
      return
    }
    setN(0)
    const total = Math.min(650, text.length * 14)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / total)
      setN(Math.round(k * text.length))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, text])
  const typing = active && n < text.length
  return (
    <>
      <span>{text.slice(0, n)}</span>
      {typing ? <span aria-hidden className="sprint-caret inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-white/70" /> : null}
      <span aria-hidden className="opacity-0">{text.slice(n)}</span>
    </>
  )
}

type LineState = 'done' | 'typing' | 'future'

function LogWindow({ stateOf, stamped, afterShown, onLineEnter }: { stateOf: (i: number) => LineState; stamped: boolean; afterShown: boolean; onLineEnter?: (i: number) => void }) {
  return (
    <DistinctProductFrame chrome="terminal" accent="violet" density="compact" title={logTitle} caption={figCaption}>
      <ol className="space-y-1.5 text-[13px] leading-[1.55]">
        {log.map((line, i) => {
          const state = stateOf(i)
          return (
            <motion.li
              key={line.day}
              className="grid grid-cols-[3.25rem_1fr] gap-2 transition-opacity duration-200"
              style={{ opacity: state === 'future' ? 0 : 1 }}
              viewport={{ once: true, margin: '0px 0px -25% 0px' }}
              onViewportEnter={onLineEnter ? () => onLineEnter(i) : undefined}
            >
              <span className="tabular text-[#c4b5fd]">{line.day}</span>
              <span className="text-white/85">
                {state === 'future' ? <span className="opacity-0">{line.text}</span> : <Typed text={line.text} active={state === 'typing'} />}
              </span>
            </motion.li>
          )
        })}
      </ol>
      <div className="mt-4 flex items-center gap-4">
        <span
          className={cn(
            '-rotate-3 rounded-md border-2 border-[#6ee7b7] px-3 py-1 text-[14px] font-semibold text-[#6ee7b7] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
            stamped ? 'scale-100 opacity-100' : 'scale-125 opacity-0',
          )}
        >
          {shippedStamp}
        </span>
        <p
          className="grid grid-cols-[3.25rem_1fr] gap-2 text-[13px] text-white/50 transition-opacity duration-300"
          style={{ opacity: afterShown ? 1 : 0, fontSize: 13, lineHeight: 1.55 }}
        >
          <span className="tabular">{afterLine.day}</span>
          <span>{afterLine.text}</span>
        </p>
      </div>
    </DistinctProductFrame>
  )
}

function Pinned({ target, after }: { target: React.RefObject<HTMLDivElement | null>; after?: React.ReactNode }) {
  const [step, setStep] = useState(0)
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(STEPS - 1, Math.max(0, Math.floor(p * STEPS * 0.999)))
    setStep((s) => (s === next ? s : next))
  })
  const shipped = step >= SHIPPED
  const day = Math.min(step, SHIPPED - 1)

  return (
    <div className="sticky top-0 flex min-h-[100dvh] flex-col justify-center px-6 pb-8 pt-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-end justify-between gap-10">
          <Heading wide />
          <MonoLabel className="tabular shrink-0 pb-2">
            {shipped ? shippedStamp : `${railLabel(day + 1)} / ${railLabel(10)}`}
          </MonoLabel>
        </div>
        <div className="mt-7">
          <Rail reached={shipped ? log.length : day + 1} />
        </div>
        <div className="mt-7 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-12">
          <div>
            <Phases active={shipped ? 3 : phaseOf(day)} compact />
            {after ? <div className="mt-6">{after}</div> : null}
          </div>
          <LogWindow stateOf={(i) => (shipped || i < day ? 'done' : i === day ? 'typing' : 'future')} stamped={shipped} afterShown={shipped} />
        </div>
      </div>
    </div>
  )
}

function Stacked({ mode, after }: { mode: Mode; after?: React.ReactNode }) {
  // Flow: each line appears as it scrolls in. Static: all at once.
  const [seen, setSeen] = useState(-1)
  const all = mode === 'static'
  return (
    <div className="px-6 py-20 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <Heading />
        <div className="mt-10 hidden md:block">
          <Rail reached={log.length} />
        </div>
        {/* Phones: phases, then the log, then the CTA. Desktop: the CTA sits under the phases. */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-12 lg:gap-y-6">
          <Phases active={-1} className="lg:col-start-1 lg:row-start-1" />
          {after ? <div className="order-3 lg:order-none lg:col-start-1 lg:row-start-2">{after}</div> : null}
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {all ? <p className="sr-only">{reducedMotionNote}</p> : null}
            {all ? (
              <LogWindow stateOf={() => 'done'} stamped afterShown />
            ) : (
              <LogWindow
                stateOf={(i) => (i < seen ? 'done' : i === seen ? 'typing' : 'future')}
                stamped={seen >= log.length - 1}
                afterShown={seen >= log.length - 1}
                onLineEnter={(i) => setSeen((n) => Math.max(n, i))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

