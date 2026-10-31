'use client'

import React from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { DIST, DUR, EASE_OUT, STAGGER, VIEWPORT } from './tokens'

/**
 * RevealGroup / RevealItem — the page-wide scroll entrance. A group watches
 * the viewport once and staggers its items in: fade, rise, a touch of scale
 * and a soft blur that resolves.
 *
 * Hydration rule: `initial` and the variants never depend on reduced motion,
 * so server and client markup match. Only the transition changes; under
 * reduced motion MotionConfig strips the transforms and this collapses the
 * rest to a short plain fade.
 */

const itemVariants = (distance: number): Variants => ({
  hidden: { opacity: 0, y: distance, scale: 0.98, filter: 'blur(4px)' },
  shown: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
})

interface RevealGroupProps {
  children: React.ReactNode
  className?: string
  /** Seconds between items. */
  stagger?: number
  delay?: number
  as?: 'div' | 'ul' | 'ol' | 'section'
}

export function RevealGroup({ children, className, stagger = STAGGER.base, delay = 0.05, as = 'div' }: RevealGroupProps) {
  const reduce = useReducedMotion()
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay } },
      }}
    >
      {children}
    </Tag>
  )
}

interface RevealItemProps {
  children?: React.ReactNode
  className?: string
  distance?: number
  as?: 'div' | 'li' | 'p' | 'span' | 'article'
  style?: React.CSSProperties
}

export function RevealItem({ children, className, distance = DIST.item, as = 'div', style }: RevealItemProps) {
  const reduce = useReducedMotion()
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag
      className={className}
      style={style}
      variants={itemVariants(distance)}
      transition={reduce ? { duration: DUR.reduced, filter: { duration: 0 } } : { duration: DUR.item, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  )
}

/** A single self-triggering reveal (a group of one). */
export function RevealBlock({ children, className, distance = DIST.block }: RevealItemProps) {
  return (
    <RevealGroup className={className} delay={0}>
      <RevealItem distance={distance}>{children}</RevealItem>
    </RevealGroup>
  )
}
