'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'
import { cn } from '@/src/components/prism/utils/cn'
import { LoopVideo } from './LoopVideo'

/**
 * ParallaxVideo: ParallaxMedia's scroll behavior for a LoopVideo. The footage drifts a few
 * percent inside its frame while the frame crosses the viewport; nothing moves while the page
 * is still, and under reduced motion it sits at rest.
 */
export function ParallaxVideo({
  name,
  priority,
  sizes,
  depth = 5,
  className,
  children,
}: {
  name: string
  priority?: boolean
  sizes?: string
  depth?: number
  className?: string
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? '0%' : `${(v - 0.5) * 2 * depth}%`))
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div className="absolute inset-[-7%]" style={{ y }}>
        <LoopVideo name={name} priority={priority} sizes={sizes} className="absolute inset-0" />
      </motion.div>
      {children}
    </div>
  )
}
