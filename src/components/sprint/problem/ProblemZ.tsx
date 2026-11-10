'use client'

import { useId, useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { GradientText } from '@/src/components/prism'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'
import { MonoLabel } from '../ui'
import { DeckScene } from './DeckScene'
import { PilotScene } from './PilotScene'
import { ShippedScene } from './ShippedScene'
import { VendorScene } from './VendorScene'

/**
 * "Most AI work stops short." as one continuous Z. Line one sits top-left and a drawn gradient
 * sweep carries the eye right to its picture; a diagonal path swings back to the left for line
 * two, and so on down to the close, which ends bottom-left with an arrow into the next section.
 *
 * Nothing pins and nothing cuts: every row, picture and path is tied to scroll progress with long
 * opacity ramps, so content melts in and out. Reduced motion renders the finished composition.
 */

const STROKE = 'url(#__ID__)'

/** The default h2 content: the key phrase set in the italic serif gradient. */
export function ProblemHeading() {
  const text = SPRINT_PROBLEM.heading
  const key = 'stops short'
  const at = text.indexOf(key)
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <GradientText gradient="prism" className="font-serif-accent pr-[0.06em]">
        {key}
      </GradientText>
      {text.slice(at + key.length)}
    </>
  )
}

function GradDefs({ id, x1, x2 }: { id: string; x1: number; x2: number }) {
  return (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
        <stop offset="0" stopColor="#7c3aed" />
        <stop offset="0.55" stopColor="#3b82f6" />
        <stop offset="1" stopColor="#2dd4bf" />
      </linearGradient>
    </defs>
  )
}

function Chevron({ className, style, down }: { className?: string; style?: { opacity: MotionValue<number> | number }; down?: boolean }) {
  return (
    <motion.svg aria-hidden viewBox="0 0 16 16" className={className} style={style} fill="none">
      <path d={down ? 'M3 5.5 L8 11 L13 5.5' : 'M5.5 3 L11 8 L5.5 13'} stroke="#2dd4bf" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}

/** Soft ramps: in over the first third of the pass, out over the last third. */
function useRamp(p: MotionValue<number>, lastRow: boolean, lag = 0) {
  const input = lastRow ? [0.02 + lag, 0.34 + lag] : [0.02 + lag, 0.34 + lag, 0.62, 0.97]
  const opacity = useTransform(p, input, lastRow ? [0, 1] : [0, 1, 1, 0])
  const y = useTransform(p, input, lastRow ? [34, 0] : [34, 0, 0, -30])
  return { opacity, y }
}

function Row({ text, visual, last, still }: { text: string; visual: ReactNode; last?: boolean; still: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const copy = useRamp(p, !!last)
  const pic = useRamp(p, !!last, 0.05)
  const sweep = useTransform(p, [0.14, 0.4], [0, 1])
  const tip = useTransform(p, [0.36, 0.42], [0, 1])
  const sweepFade = useTransform(p, last ? [0.02, 0.3] : [0.02, 0.3, 0.62, 0.97], last ? [0, 1] : [0, 1, 1, 0])

  return (
    <div ref={ref} className="grid items-center gap-y-10 py-8 md:grid-cols-12 md:gap-x-10 md:py-10">
      <motion.div className="relative md:col-span-5" style={still ? undefined : { opacity: copy.opacity, y: copy.y }}>
        <p
          className="max-w-[20ch] text-balance font-display font-semibold tracking-[-0.025em] text-ink"
          style={{ fontSize: 'clamp(1.75rem, 1.2rem + 1.7vw, 2.9rem)', lineHeight: 1.08 }}
        >
          {text}
        </p>
        {last ? null : (
          <motion.div aria-hidden className="pointer-events-none absolute left-0 top-full mt-7 hidden h-4 w-[calc(100%+1.75rem)] md:block" style={still ? undefined : { opacity: sweepFade }}>
            <svg viewBox="0 0 400 16" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <GradDefs id={id} x1={0} x2={400} />
              <motion.path d="M2 8 H392" fill="none" stroke={STROKE.replace('__ID__', id)} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={still ? undefined : { pathLength: sweep }} />
            </svg>
            <Chevron className="absolute -right-1 top-0 h-4 w-4" style={still ? undefined : { opacity: tip }} />
          </motion.div>
        )}
      </motion.div>
      <motion.div className="md:col-span-7" style={still ? undefined : { opacity: pic.opacity, y: pic.y }}>
        {visual}
      </motion.div>
    </div>
  )
}

/** The diagonal swing from the right of one row back to the left of the next. */
function Connector({ still }: { still: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const draw = useTransform(p, [0.1, 0.5], [0, 1])
  const tip = useTransform(p, [0.46, 0.52], [0, 1])
  const fade = useTransform(p, [0.02, 0.22, 0.8, 0.98], [0, 1, 1, 0])
  return (
    <motion.div ref={ref} aria-hidden className="relative -my-2 h-24 md:-my-4 md:h-36" style={still ? undefined : { opacity: fade }}>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <GradDefs id={id} x1={800} x2={30} />
        <motion.path d="M800 0 C 800 70, 30 30, 30 98" fill="none" stroke={STROKE.replace('__ID__', id)} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={still ? undefined : { pathLength: draw }} />
      </svg>
      <Chevron down className="absolute bottom-0 left-[3%] h-4 w-4 -translate-x-1/2" style={still ? undefined : { opacity: tip }} />
    </motion.div>
  )
}

/** The last stroke: straight down from the close, into the next section. */
function Landing({ still }: { still: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 95%', 'end 70%'] })
  const draw = useTransform(p, [0, 1], [0, 1])
  const tip = useTransform(p, [0.9, 1], [0, 1])
  return (
    <div ref={ref} aria-hidden className="relative ml-[3%] h-24 w-4 -translate-x-1/2 md:h-32">
      <svg viewBox="0 0 16 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
            <stop offset="0" stopColor="#7c3aed" />
            <stop offset="0.55" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <motion.path d="M8 0 V96" fill="none" stroke={STROKE.replace('__ID__', id)} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" style={still ? undefined : { pathLength: draw }} />
      </svg>
      <Chevron down className="absolute bottom-0 left-0 h-4 w-4" style={still ? undefined : { opacity: tip }} />
    </div>
  )
}

export function ProblemZ({ heading }: { heading?: ReactNode }) {
  const reduce = useHydratedReducedMotion()
  const { eyebrow, lines, close, ariaSummary } = SPRINT_PROBLEM
  const headRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: hp } = useScroll({ target: headRef, offset: ['start end', 'end start'] })
  const headOpacity = useTransform(hp, [0.04, 0.3, 0.7, 0.98], [0, 1, 1, 0])
  const headY = useTransform(hp, [0.04, 0.3], [26, 0])

  const scenes = [<PilotScene key="p" still={reduce} />, <DeckScene key="d" still={reduce} />, <VendorScene key="v" still={reduce} />]

  return (
    <section
      aria-labelledby="sprint-problem-heading"
      data-testid="sprint-problem"
      className="relative overflow-x-clip px-6 py-24 md:py-32"
      style={{ background: 'linear-gradient(to bottom, var(--surface-base) 0%, var(--surface-raised) 16%, var(--surface-raised) 84%, var(--surface-base) 100%)' }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div ref={headRef} className="max-w-3xl" style={reduce ? undefined : { opacity: headOpacity, y: headY }}>
          <MonoLabel className="mb-4">{eyebrow}</MonoLabel>
          <h2 id="sprint-problem-heading" className="text-balance text-ink" style={{ fontSize: 'clamp(2rem, 1.5rem + 2.2vw, 3.25rem)', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
            {heading ?? <ProblemHeading />}
          </h2>
        </motion.div>
        <p className="sr-only">{ariaSummary}</p>

        <div className="mt-14 md:mt-20">
          {lines.map((text, i) => (
            <div key={text}>
              <Row text={text} visual={scenes[i]} still={reduce} />
              <Connector still={reduce} />
            </div>
          ))}
          <Row text={close} visual={<ShippedScene still={reduce} />} last still={reduce} />
          <Landing still={reduce} />
        </div>
      </div>
    </section>
  )
}
