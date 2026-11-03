'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT, PRISM_STROKE } from '@/src/components/landing'
import { TRANSFORMATION_PAGE } from '@/src/ai-transformation-content'

const MAP = TRANSFORMATION_PAGE.map
const GATES = TRANSFORMATION_PAGE.gates
const N = MAP.phases.length

/** Share of each phase's scroll window spent drawing its line; the rest holds before the gate is signed. */
const DRAW = 0.72
const SIGN_AT = 0.86
const DROP_AT = 0.42

const count = (v: number, at: number) => MAP.phases.reduce((n, _, i) => n + (v * N >= i + at ? 1 : 0), 0)

/**
 * OperatingMap: the hero centerpiece of /ai-transformation. Four phases drawn left to right at equal
 * widths (the SOW sets the weeks, so no week scale is drawn), each closed by a gate marked "you sign".
 *
 * Motion has one job: show the sequence. From 768px up, with motion allowed, the map pins under the
 * nav for about one and a half screens of scroll. The line draws through each phase (scrubbed by
 * scroll, so it is as slow as the reader), the phase's artifact settles onto the page, then the gate
 * is signed (a 220 ms tick) and the readout names what that signature unlocks. Discrete changes stay
 * under 400 ms. Under 768px the map runs top to bottom, unpinned, drawn by the same scroll progress.
 *
 * Text is on the page from the server render; only the lines, ticks and settle wait. Reduced motion
 * shows the finished map. The diagram is aria-hidden; the deck's summary is the accessible text.
 */
export function OperatingMap() {
  const wrap = useRef<HTMLDivElement>(null)
  const reduce = useHydratedReducedMotion()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start 0.4', 'end end'] })
  const [state, setState] = useState({ signed: 0, dropped: 0 })
  const sync = (v: number) => {
    const next = { signed: count(v, SIGN_AT), dropped: count(v, DROP_AT) }
    setState((s) => (s.signed === next.signed && s.dropped === next.dropped ? s : next))
  }
  useMotionValueEvent(scrollYProgress, 'change', sync)
  // A page restored mid-scroll gets its state without waiting for the next scroll event.
  useEffect(() => {
    sync(scrollYProgress.get())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const done = hydrated && reduce
  const signed = done ? N : state.signed
  const dropped = done ? N : state.dropped
  const readout = Math.min(Math.max(signed, 1), N) - 1
  const readoutKey = MAP.phases[readout].id

  return (
    <figure className="m-0" aria-labelledby="operating-map-caption" aria-describedby="operating-map-summary">
      <p id="operating-map-summary" className="sr-only">
        {MAP.ariaSummary}
      </p>
      {done ? <p className="sr-only">{MAP.reducedMotionNote}</p> : null}

      {/* From md the pinned frame is centered in the viewport under the nav; the wrapper starts half the
          spare height early so the map sits right under the masthead before it pins. That band is
          transparent to the pointer, so the masthead links above it stay clickable. */}
      <div ref={wrap} data-operating-map="" className="pointer-events-none relative motion-safe:md:-mb-[max(0px,calc((100dvh-560px)/2))] motion-safe:md:-mt-[max(0px,calc((100dvh-560px)/2))] motion-safe:md:h-[180vh]">
        <div className="md:sticky md:top-[77px] md:flex md:flex-col md:justify-center md:py-8 motion-safe:md:min-h-[calc(100dvh-77px)]">
          <div aria-hidden className="pointer-events-auto rounded-[28px] border border-line bg-surface-base px-5 pb-6 pt-7 sm:px-8 md:px-6 md:pb-8 md:pt-9 lg:px-10">
            {/* Wide: left to right */}
            <ol className="hidden grid-cols-4 md:grid">
              {MAP.phases.map((phase, i) => (
                <li key={phase.id} className="relative min-w-0">
                  <PhaseName index={i} on={signed >= i || dropped > i} />
                  <div className="relative mt-6 flex h-7 items-center">
                    {i === 0 ? <span className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-ink" /> : null}
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--border-strong)]" />
                    <Segment progress={scrollYProgress} index={i} done={done} axis="x" />
                    <GateNode signed={signed > i} className="absolute right-0 top-0" />
                  </div>
                  <p className="label-mono mt-2.5 pr-0 text-right text-ink-secondary">{MAP.gateLabel(i + 1)}</p>
                  <Artifact text={phase.artifact} dropped={dropped > i} className="mr-3 mt-6 lg:mr-14" />
                </li>
              ))}
            </ol>

            {/* Narrow: top to bottom */}
            <ol className="md:hidden">
              {MAP.phases.map((phase, i) => (
                <li key={phase.id} className="grid grid-cols-[28px_1fr] gap-x-4">
                  <div className="relative flex justify-center">
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--border-strong)]" />
                    <Segment progress={scrollYProgress} index={i} done={done} axis="y" />
                    <GateNode signed={signed > i} className="absolute bottom-0 left-0" />
                  </div>
                  <div className="pb-12 pt-0.5">
                    <PhaseName index={i} on={signed >= i || dropped > i} />
                    <Artifact text={phase.artifact} dropped={dropped > i} className="mt-4" />
                    <p className="label-mono mt-5 text-ink-secondary">{MAP.gateLabel(i + 1)}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Readout: what the next signature unlocks (wide screens; the gate cards carry it below). */}
            <div className="mt-8 hidden items-baseline gap-6 border-t border-dashed border-line pt-6 md:flex">
              <span className="label-mono tabular shrink-0 text-ink-tertiary">{MAP.gateLabel(readout + 1)}</span>
              <span className="relative min-h-[1.6em] flex-1 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={readoutKey}
                    className="block font-display text-ink"
                    style={{ fontSize: 'clamp(1.15rem, 0.9rem + 0.7vw, 1.5rem)', lineHeight: 1.3, letterSpacing: '-0.01em' }}
                    initial={done ? false : { opacity: 0, transform: 'translateY(10px)' }}
                    animate={{ opacity: 1, transform: 'translateY(0px)' }}
                    exit={{ opacity: 0, transform: 'translateY(-10px)' }}
                    transition={{ duration: DUR.draw, ease: EASE_OUT }}
                  >
                    {GATES[readoutKey].note}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>

          <figcaption id="operating-map-caption" className="pointer-events-auto mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-1">
            <span className="label-mono text-ink-tertiary">{MAP.caption}</span>
            <span className="flex items-baseline gap-3">
              <span className="label-mono text-ink-tertiary">Signed off by</span>
              <span className="text-sm font-medium text-ink">{GATES.map.signedBy}</span>
            </span>
          </figcaption>
        </div>
      </div>
    </figure>
  )
}

function PhaseName({ index, on }: { index: number; on: boolean }) {
  const [num, ...rest] = MAP.phases[index].label.split(' ')
  return (
    <div className="flex items-baseline gap-3">
      <span className="label-mono tabular text-ink-tertiary">{num}</span>
      <span
        className={`font-display font-semibold transition-colors duration-300 ${on ? 'text-ink' : 'text-ink-secondary'}`}
        style={{ fontSize: 'clamp(1.5rem, 1.1rem + 1.2vw, 2.25rem)', lineHeight: 1.05, letterSpacing: '-0.025em' }}
      >
        {rest.join(' ')}
      </span>
    </div>
  )
}

/**
 * One phase's stretch of the line. The gradient is sized to the whole map and offset per phase, so
 * the four segments read as one continuous stroke: the page's single gradient element. On phones the
 * vertical map draws in ink, because the chapter bar's gradient hairline shares that screen.
 */
function Segment({ progress, index, done, axis }: { progress: MotionValue<number>; index: number; done: boolean; axis: 'x' | 'y' }) {
  const start = index / N
  const scale = useTransform(progress, [start, start + DRAW / N], [0, 1])
  const horizontal = axis === 'x'
  const pos = `${(index / (N - 1)) * 100}%`
  return (
    <motion.span
      className={
        horizontal
          ? 'absolute left-0 right-7 top-1/2 h-[2px] -translate-y-1/2 rounded-full motion-reduce:!transform-none'
          : 'absolute bottom-7 left-1/2 top-0 w-[2px] -translate-x-1/2 rounded-full motion-reduce:!transform-none'
      }
      style={{
        background: horizontal ? PRISM_STROKE : 'var(--text-primary)',
        ...(horizontal ? { backgroundSize: `${N * 100}% 100%`, backgroundPosition: `${pos} 0` } : {}),
        transformOrigin: horizontal ? '0% 50%' : '50% 0%',
        ...(done ? {} : horizontal ? { scaleX: scale } : { scaleY: scale }),
      }}
    />
  )
}

function GateNode({ signed, className }: { signed: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={`h-7 w-7 ${className ?? ''}`}>
      <motion.rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="7"
        strokeWidth="1.25"
        initial={false}
        animate={{ fill: signed ? 'var(--text-primary)' : 'var(--surface-base)', stroke: signed ? 'var(--text-primary)' : 'var(--border-strong)' }}
        transition={{ duration: DUR.tick, ease: EASE_OUT }}
      />
      <motion.path
        d="M8.5 14.4l3.7 3.7 7.3-8"
        fill="none"
        stroke="var(--surface-base)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: signed ? 1 : 0, opacity: signed ? 1 : 0 }}
        transition={{ duration: DUR.tick, delay: signed ? 0.08 : 0, ease: EASE_OUT }}
      />
    </svg>
  )
}

/** The phase's artifact as a slip of paper that settles into place when its stretch of line is half drawn. */
function Artifact({ text, dropped, className }: { text: string; dropped: boolean; className?: string }) {
  return (
    <motion.div
      className={`rounded-xl border bg-surface-raised px-3 py-3 lg:px-4 lg:py-3.5 ${className ?? ''}`}
      initial={false}
      animate={{
        opacity: dropped ? 1 : 0.5,
        transform: dropped ? 'translateY(0px) rotate(0deg)' : 'translateY(-10px) rotate(-1.5deg)',
        borderColor: dropped ? 'var(--border-strong)' : 'var(--border-subtle)',
      }}
      transition={{ duration: DUR.draw, ease: EASE_OUT }}
    >
      <span className="label-mono block text-ink-tertiary">{TRANSFORMATION_PAGE.gateLabels.transfers}</span>
      <span className="mt-1.5 block text-ink" style={{ fontSize: '0.95rem', lineHeight: 1.35 }}>
        {text}
      </span>
    </motion.div>
  )
}
