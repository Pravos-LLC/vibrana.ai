'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue, type UseScrollOptions } from 'framer-motion'
import { useReducedMotionValue } from './useReducedMotionValue'
import { cn } from '../utils/cn'

/**
 * ScrollLine — a 2px Prism-gradient line that draws itself as you scroll.
 * Pass `progress` to drive it from a parent's scroll; otherwise it tracks its
 * own position (drawn from when it enters until it reaches the middle).
 */
export interface ScrollLineProps {
  orientation?: 'vertical' | 'horizontal'
  progress?: MotionValue<number>
  /** Scroll offsets when the line tracks its own position. */
  offset?: NonNullable<UseScrollOptions['offset']>
  className?: string
}

export function ScrollLine({ orientation = 'vertical', progress, offset, className }: ScrollLineProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: offset ?? ['start 85%', 'end 50%'] })
  const source = progress ?? scrollYProgress
  const smooth = useSpring(source, { stiffness: 140, damping: 30, mass: 0.4 })
  const scale = useTransform([smooth, rm], ([v, r]: number[]) => (r ? 1 : Math.min(1, Math.max(0, v))))
  const vertical = orientation === 'vertical'

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('relative overflow-hidden rounded-full bg-line-subtle', vertical ? 'w-0.5' : 'h-0.5', className)}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: vertical
            ? 'linear-gradient(180deg, var(--violet), var(--blue), var(--cyan))'
            : 'linear-gradient(90deg, var(--violet), var(--blue), var(--cyan))',
          transformOrigin: vertical ? 'top' : 'left',
          scaleY: vertical ? scale : undefined,
          scaleX: vertical ? undefined : scale,
        }}
      />
    </div>
  )
}
