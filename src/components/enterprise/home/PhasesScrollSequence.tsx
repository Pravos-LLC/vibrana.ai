'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'
import { ScrollLine } from '@/src/components/prism/motion/ScrollLine'
import { VerticalWaveField } from '@/src/components/prism/VerticalWaveField'
import { cn } from '@/src/components/prism/utils/cn'

export interface Phase {
  title: string
  description: string
  image: { src: string; alt: string }
}

/**
 * PhasesScrollSequence — the 12-week arc as a scroll story. On desktop the
 * image column stays pinned while the four steps scroll past; the image
 * cross-fades to the active phase and a gradient line draws down the rail,
 * lighting each marker as it is reached. A single faint hairline ribbon drifts
 * in the whitespace under each step's text; the rail itself stays clean. No
 * scroll hijacking: the page scrolls normally. On mobile it is a stacked
 * sequence with the same rail.
 */
export function PhasesScrollSequence({ phases }: { phases: Phase[] }) {
  return (
    <>
      <DesktopSequence phases={phases} />
      <MobileSequence phases={phases} />
    </>
  )
}

type MarkerState = 'upcoming' | 'active' | 'done'

const RING: Record<MarkerState, string> = {
  upcoming: 'inset 0 0 0 1.5px var(--border-default)',
  done: 'inset 0 0 0 1.5px color-mix(in srgb, var(--violet) 40%, transparent)',
  active:
    'inset 0 0 0 1.5px var(--violet), 0 0 0 4px color-mix(in srgb, var(--violet) 16%, transparent)',
}

/**
 * Rail marker. Centred on its anchor point with a translate, so the caller
 * only has to put the anchor on the rail. The gradient lives on an inner
 * element (never a border or background-clip), so no square can be painted.
 */
function Marker({ state, className }: { state: MarkerState; className?: string }) {
  const reached = state !== 'upcoming'
  return (
    <span
      aria-hidden
      data-phase-marker={state}
      className={cn(
        'z-10 grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface-base transition-shadow duration-500',
        className,
      )}
      style={{ boxShadow: RING[state] }}
    >
      <span
        className="size-2 rounded-full transition-[transform,opacity] duration-500 ease-out"
        style={{
          background: 'var(--gradient-prism)',
          opacity: reached ? 1 : 0,
          transform: reached ? 'scale(1)' : 'scale(0.3)',
        }}
      />
    </span>
  )
}

/** Height of every desktop step; the rail spans (n - 1) of them, marker to marker. */
const STEP_H = 'max(60vh, 25rem)'
/** Vertical centre of the numeral, where each marker sits. */
const MARKER_Y = '2.25rem'

function DesktopSequence({ phases }: { phases: Phase[] }) {
  const railRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const n = phases.length
  // 0 when the first marker reaches the anchor line, 1 when the last one does.
  const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 42%', 'end 42%'] })
  const [active, setActive] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(n - 1, Math.max(0, Math.floor(v * (n - 1) + 0.02)))
    setActive((cur) => (cur === next ? cur : next))
  })

  return (
    <div className="relative hidden gap-16 lg:grid lg:grid-cols-[1fr_1fr]" style={{ ['--step-h' as string]: STEP_H }}>
      <div className="sticky top-28 self-start">
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-line-subtle shadow-[0_12px_48px_rgba(124,58,237,0.12)]">
          {phases.map((p, i) => (
            <motion.div
              key={p.image.src}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.04 }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <Image src={p.image.src} alt={i === active ? p.image.alt : ''} fill sizes="45vw" className="object-cover" />
            </motion.div>
          ))}
          <span className="absolute bottom-4 left-4 rounded-full bg-surface-base/85 px-3 py-1 text-xs font-semibold tracking-wide text-ink backdrop-blur">
            {String(active + 1).padStart(2, '0')} · {phases[active]?.title}
          </span>
        </div>
      </div>

      <div className="relative">
        {/* Rail: marker to marker only. */}
        <div
          ref={railRef}
          aria-hidden
          data-phase-rail
          className="pointer-events-none absolute left-[-2rem] w-0.5 -translate-x-1/2"
          style={{ top: MARKER_Y, height: `calc(${n - 1} * var(--step-h))` }}
        >
          <ScrollLine progress={scrollYProgress} className="h-full" />
        </div>
        {phases.map((p, i) => (
          <Step key={p.title} phase={p} index={i} state={i < active ? 'done' : i === active ? 'active' : 'upcoming'} last={i === n - 1} />
        ))}
      </div>
    </div>
  )
}

function Step({ phase, index, state, last }: { phase: Phase; index: number; state: MarkerState; last: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const opacity = useTransform([scrollYProgress, rm], ([v, r]: number[]) => {
    if (r) return 1
    if (v < 0.2) return 0.3
    if (v < 0.35) return 0.3 + 0.7 * ((v - 0.2) / 0.15)
    if (v < 0.6) return 1
    if (v < 0.8) return 1 - 0.7 * ((v - 0.6) / 0.2)
    return 0.3
  })
  const y = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? 0 : (0.5 - v) * 32))

  return (
    <div ref={ref} className="relative" style={{ height: 'var(--step-h)' }}>
      <Marker state={state} className="absolute left-[-2rem]" />
      <motion.div style={{ opacity, y }}>
        <span className="text-gradient-prism font-display text-7xl leading-none tracking-tight">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="mt-5 font-display text-4xl tracking-tight text-ink md:text-5xl">{phase.title}</h3>
        <p className="mt-5 max-w-xl text-lg leading-8 text-ink-secondary">{phase.description}</p>
      </motion.div>
      {/* Whisper: a hairline ribbon in the empty space under the text, clear of text and rail. */}
      {!last && (
        <VerticalWaveField
          className="bottom-0 right-[18%] w-20"
          style={{ top: 'var(--whisper-top, 24rem)' }}
          intensity={1}
        />
      )}
    </div>
  )
}

function MobileItem({
  phase,
  index,
  state,
  onReach,
}: {
  phase: Phase
  index: number
  state: MarkerState
  onReach: (i: number) => void
}) {
  const probe = useRef<HTMLDivElement>(null)
  const reached = useInView(probe, { margin: '0px 0px -50% 0px' })
  useEffect(() => {
    if (reached) onReach(index)
  }, [reached, index, onReach])

  return (
    <div data-phase-item className="relative">
      <div ref={probe} aria-hidden className="absolute inset-x-0 top-0 h-px" />
      {/* Rail centre is 12px from the group edge; items start at 40px (pl-10). */}
      <Marker state={state} className="absolute left-[-1.75rem] top-6" />
      <RevealItem>
        <span className="text-gradient-prism font-display text-5xl leading-none tracking-tight">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="mt-3 font-display text-3xl tracking-tight text-ink">{phase.title}</h3>
        <ParallaxMedia src={phase.image.src} alt={phase.image.alt} aspect="16 / 10" sizes="90vw" className="mt-5" />
        <p className="mt-5 text-base leading-7 text-ink-secondary">{phase.description}</p>
      </RevealItem>
    </div>
  )
}

function MobileSequence({ phases }: { phases: Phase[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [reachedIdx, setReachedIdx] = useState(-1)
  const [lastH, setLastH] = useState(0)
  const onReach = React.useCallback((i: number) => setReachedIdx((c) => (i > c ? i : c)), [])

  // The rail ends on the last marker, not at the bottom of the last item.
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const last = wrap?.querySelector<HTMLElement>('[data-phase-item]:last-child')
    if (!last) return
    const measure = () => setLastH(last.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(last)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className="relative lg:hidden">
      <div
        aria-hidden
        data-phase-rail
        className="absolute left-[11px] top-6 w-0.5"
        style={{ height: `calc(100% - ${lastH}px)` }}
      >
        <ScrollLine className="h-full" offset={['start 70%', 'end 60%']} />
      </div>
      <RevealGroup className="space-y-12 pl-10">
        {phases.map((p, i) => (
          <MobileItem
            key={p.title}
            phase={p}
            index={i}
            onReach={onReach}
            state={i < reachedIdx ? 'done' : i === reachedIdx ? 'active' : 'upcoming'}
          />
        ))}
      </RevealGroup>
    </div>
  )
}
