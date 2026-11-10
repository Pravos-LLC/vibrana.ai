'use client'

import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react'
import { motion, useInView, type TargetAndTransition, type Variants } from 'framer-motion'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * Shared pieces for the four problem illustrations. Every scene is a stack of small parts that
 * deal in one after another (translate + rotate + fade, staggered springs), then a few ambient
 * loops keep it alive. `still` renders the final state with no motion at all.
 */
export const VIOLET = '#7c3aed'
export const BLUE = '#3b82f6'
export const TEAL = '#2dd4bf'
export const AMBER = '#f59e0b'
export const RED = '#ef4444'
export const GREEN = '#22c55e'
export const PRISM = `linear-gradient(135deg, ${VIOLET} 0%, ${BLUE} 55%, ${TEAL} 100%)`

type SceneState = { still: boolean; on: boolean; live: boolean }
const SceneCtx = createContext<SceneState>({ still: true, on: true, live: true })
export const useScene = () => useContext(SceneCtx)

/** Marching dashes: a motion path/rect prop set that loops only while the scene is live. */
export function useMarch(distance = -26, duration = 1.4) {
  const { still, on } = useScene()
  return {
    initial: false as const,
    animate: on && !still ? { strokeDashoffset: [0, distance] } : undefined,
    transition: { duration, ease: 'linear' as const, repeat: Infinity },
  }
}

export interface Deal {
  x?: number
  y?: number
  /** Degrees the part starts rotated by. */
  r?: number
  /** Degrees the part rests at. */
  to?: number
  s?: number
}

const SPRING = { type: 'spring', stiffness: 190, damping: 19, mass: 0.9 } as const

export const dealVariants: Variants = {
  hidden: (c: Deal = {}) => ({ opacity: 0, x: c.x ?? 0, y: c.y ?? -34, rotate: c.r ?? -12, scale: c.s ?? 0.9 }),
  show: (c: Deal = {}) => ({ opacity: 1, x: 0, y: 0, rotate: c.to ?? 0, scale: 1, transition: { ...SPRING, opacity: { duration: 0.35 } } }),
}

export const growVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0 },
  show: { opacity: 1, scaleY: 1, transition: { type: 'spring', stiffness: 150, damping: 17 } },
}

export const growXVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: { opacity: 1, scaleX: 1, transition: { type: 'spring', stiffness: 150, damping: 20 } },
}

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 16 } },
}

export const drawVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] } },
}

/** A dealt part. Pass `variants` for a different entrance, `c` to tune the deal. */
export function P({ c, variants = dealVariants, className, style, children }: { c?: Deal; variants?: Variants; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <motion.div custom={c} variants={variants} className={className} style={style}>
      {children}
    </motion.div>
  )
}

/** A group whose direct motion children stagger in. */
export function G({ stagger = 0.07, delay = 0, className, style, children }: { stagger?: number; delay?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

/** Ambient loop: runs only once the scene is on screen and motion is allowed. */
export function Loop({ animate, duration = 3, times, delay = 0, ease = 'easeInOut', className, style, children }: { animate: TargetAndTransition; duration?: number; times?: number[]; delay?: number; ease?: string | number[]; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const { still, live } = useScene()
  return (
    <motion.div
      className={className}
      style={style}
      initial={false}
      animate={live && !still ? animate : undefined}
      transition={{ duration, times, delay, ease: ease as never, repeat: Infinity }}
    >
      {children}
    </motion.div>
  )
}

/** The painted ground every scene sits on: two soft Prism washes over a card surface. */
export function Scene({ still, tint = [VIOLET, BLUE], children, className }: { still: boolean; tint?: [string, string]; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4, once: true })
  const on = still || inView
  // Ambient loops follow current visibility (not the once-latched reveal), so they stop when the scene scrolls away.
  const live = useInView(ref, { amount: 0.05, margin: '120px 0px' })
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('relative h-[336px] w-full overflow-hidden rounded-3xl border border-line-subtle md:h-[400px]', className)}
      style={{
        background: `radial-gradient(70% 80% at 12% 6%, color-mix(in srgb, ${tint[0]} 20%, transparent), transparent 72%), radial-gradient(70% 80% at 92% 100%, color-mix(in srgb, ${tint[1]} 18%, transparent), transparent 72%), var(--surface-raised)`,
      }}
    >
      <SceneCtx.Provider value={{ still, on, live }}>
        <motion.div
          className="absolute inset-0"
          initial={still ? 'show' : 'hidden'}
          animate={on ? 'show' : 'hidden'}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
        >
          {children}
        </motion.div>
      </SceneCtx.Provider>
    </div>
  )
}

/** Browser-style window frame used by the pilot and the shipped scene. */
export function Win({ title, badge, children, className }: { title: string; badge?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-full w-full flex-col overflow-hidden rounded-xl border border-line bg-surface-base shadow-[0_28px_60px_-28px_rgba(76,29,149,0.5)]', className)}>
      <div className="flex shrink-0 items-center gap-2 border-b border-line-subtle bg-surface-raised px-3 py-2">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: RED, opacity: 0.75 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: AMBER, opacity: 0.75 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: GREEN, opacity: 0.75 }} />
        </span>
        <span className="label-mono flex-1 truncate text-ink-tertiary">{title}</span>
        {badge}
      </div>
      {children}
    </div>
  )
}

/** A small status chip that reads as UI, not as a caption. */
export function Chip({ dot, children, className }: { dot: string; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface-base px-2.5 py-1 text-[11px] font-medium text-ink-secondary shadow-sm', className)}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
      <span className="truncate">{children}</span>
    </span>
  )
}
