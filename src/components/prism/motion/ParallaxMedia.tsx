'use client'

import React, { useRef } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from './useReducedMotionValue'
import { cn } from '../utils/cn'

/**
 * ParallaxMedia — a framed image that responds only to scroll. As the frame
 * enters, its clip opens from a slightly inset rounded rectangle to the full
 * frame; while it crosses the viewport the image drifts inside the frame.
 * Nothing moves while the page is still.
 *
 * Reduced motion: the mappers return the resting values, so the markup is
 * identical on server and client and the image simply sits still.
 */
export interface ParallaxMediaProps {
  src: string
  alt: string
  /** CSS aspect-ratio, e.g. "4 / 3". Omit to fill the parent (give it a height). */
  aspect?: string
  sizes?: string
  priority?: boolean
  /** Drift range in percent of the frame height. */
  depth?: number
  className?: string
  imageClassName?: string
  children?: React.ReactNode
}

export function ParallaxMedia({
  src,
  alt,
  aspect,
  sizes = '(max-width: 1024px) 92vw, 50vw',
  priority = false,
  depth = 6,
  className,
  imageClassName,
  children,
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  const y = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? '0%' : `${(v - 0.5) * 2 * depth}%`))
  const clipPath = useTransform([scrollYProgress, rm], ([v, r]: number[]) => {
    if (r) return 'inset(0% 0% 0% 0% round 16px)'
    const t = Math.min(1, v / 0.35)
    const e = 1 - Math.pow(1 - t, 3)
    return `inset(${(1 - e) * 8}% ${(1 - e) * 6}% ${(1 - e) * 8}% ${(1 - e) * 6}% round 16px)`
  })

  return (
    <motion.div
      ref={ref}
      className={cn('relative overflow-hidden rounded-2xl bg-ink/5', !aspect && 'h-full', className)}
      style={{ aspectRatio: aspect, clipPath }}
    >
      <motion.div className="absolute inset-[-8%]" style={{ y }}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn('object-cover', imageClassName)} />
      </motion.div>
      {children}
    </motion.div>
  )
}
