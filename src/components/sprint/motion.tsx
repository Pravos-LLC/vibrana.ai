'use client'

import type { ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { RevealGroup, RevealItem } from '@/src/components/prism'

/**
 * The Build Sprint page's entrance motion is the homepage's: fade, rise, a touch of scale and a
 * soft blur that resolves, staggered so a section lands like a waterfall. These two wrappers are
 * the only way content enters on this page, so every block cascades the same way.
 *
 * - `RevealStack`: a group; its `Reveal variant="item"` children stagger in once it is on screen.
 * - `Reveal`: a single block that triggers itself (`delay` offsets it inside a section), or, with
 *   `variant="item"`, an item inside a RevealStack.
 */
export function RevealStack({ children, className, stagger, delay, as }: { children: ReactNode; className?: string; stagger?: number; delay?: number; as?: 'div' | 'ul' | 'ol' | 'section' }) {
  return (
    <RevealGroup className={className} stagger={stagger} delay={delay} as={as}>
      {children}
    </RevealGroup>
  )
}

export function Reveal({
  children,
  className,
  delay = 0,
  distance,
  variant = 'block',
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
  variant?: 'block' | 'item'
  as?: 'div' | 'li' | 'p' | 'span' | 'article'
}) {
  if (variant === 'item') {
    return (
      <RevealItem className={className} distance={distance} as={as}>
        {children}
      </RevealItem>
    )
  }
  return (
    <RevealGroup className={className} delay={delay}>
      <RevealItem distance={distance} as={as}>
        {children}
      </RevealItem>
    </RevealGroup>
  )
}

/**
 * Deal / DealItem: a drawn object whose parts arrive one after another, like cards dealt from a
 * deck (each part rises, turns a few degrees and settles on a spring). Put `DealItem`s anywhere
 * inside a `Deal`; the group starts when it scrolls into view. Under reduced motion MotionConfig
 * removes the transforms and the parts simply appear.
 */
const DEAL_PART: Variants = {
  hidden: { opacity: 0, y: 22, rotate: -3, scale: 0.94 },
  shown: { opacity: 1, y: 0, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 22, mass: 0.9 } },
}

export function Deal({ children, className, stagger = 0.085, delay = 0.15 }: { children: ReactNode; className?: string; stagger?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

export function DealItem({ children, className, as = 'div' }: { children?: ReactNode; className?: string; as?: 'div' | 'li' | 'span' }) {
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag className={className} variants={DEAL_PART}>
      {children}
    </Tag>
  )
}
