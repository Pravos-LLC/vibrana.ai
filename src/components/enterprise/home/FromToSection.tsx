'use client'

import React, { useRef } from 'react'
import { Check } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Eyebrow } from '@/src/components/prism'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'

export interface FromToSide {
  eyebrow: string
  items: string[]
  image: { src: string; alt: string }
}

/**
 * FromToSection - "who this is for" to "what you have after 12 weeks" as one
 * movement instead of two cards. The starting position sits unframed and
 * quiet on the left; the arrival sits on a tinted panel on the right. A spine
 * between them draws itself as the section scrolls through, so the eye
 * travels from one to the other. On mobile the spine collapses to a single
 * dot between the two stacks.
 */
/**
 * One outcome line. Each line triggers on its own as it scrolls into view: the
 * check disc lands first, then the text rises in behind it. Individually
 * triggered (not part of the group stagger) so the cascade follows the reader.
 */
function ChecklistItem({ children }: { children: React.ReactNode }) {
  const ease = [0.23, 1, 0.32, 1] as const
  const viewport = { once: true, margin: '0px 0px -14% 0px' } as const
  return (
    <li className="flex items-start gap-4">
      <motion.span
        className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-brand-violet-strong"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.20), rgba(45,212,191,0.22))',
          boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.28)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewport}
        transition={{ duration: 0.7, ease }}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </motion.span>
      <motion.p
        className="text-lg leading-7 text-ink"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.9, ease, delay: 0.3 }}
      >
        {children}
      </motion.p>
    </li>
  )
}

export function FromToSection({ from, to }: { from: FromToSide; to: FromToSide }) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 55%'] })
  const draw = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? 1 : Math.min(1, Math.max(0, v))))

  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_72px_1.15fr] lg:gap-0"
    >
      {/* FROM: quiet, unframed */}
      <RevealGroup className="lg:pr-4">
        <RevealItem>
          <ParallaxMedia
            src={from.image.src}
            alt={from.image.alt}
            aspect="16 / 9"
            sizes="(max-width: 1024px) 92vw, 38vw"
          />
        </RevealItem>
        <RevealItem className="mt-8">
          <Eyebrow gradient="prism" size="sm">{from.eyebrow}</Eyebrow>
        </RevealItem>
        <ul className="mt-2">
          {from.items.map((item) => (
            <RevealItem as="li" key={item} className="border-b border-line-subtle py-6 last:border-b-0">
              <p className="max-w-md text-xl leading-snug text-ink-secondary">{item}</p>
            </RevealItem>
          ))}
        </ul>
      </RevealGroup>

      {/* SPINE */}
      <div aria-hidden className="relative hidden lg:block">
        <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-line-subtle" />
        <motion.div
          className="absolute inset-y-6 left-1/2 w-px origin-top -translate-x-1/2 bg-linear-to-b from-brand-violet-strong/10 to-brand-violet-strong"
          style={{ scaleY: draw }}
        />
        <div className="sticky top-1/2 flex -translate-y-1/2 justify-center">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-base shadow-[0_0_0_1px_var(--border-subtle),0_4px_18px_rgba(124,58,237,0.22)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--gradient-prism)' }} />
          </span>
        </div>
      </div>
      <div aria-hidden className="flex justify-center lg:hidden">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-base shadow-[0_0_0_1px_var(--border-subtle)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--gradient-prism)' }} />
        </span>
      </div>

      {/* TO: framed arrival */}
      <RevealGroup className="rounded-3xl border border-line-subtle bg-surface-frost p-4 shadow-[0_8px_40px_rgba(124,58,237,0.08)] backdrop-blur-md sm:p-6">
        <RevealItem>
          <ParallaxMedia
            src={to.image.src}
            alt={to.image.alt}
            aspect="16 / 9"
            sizes="(max-width: 1024px) 92vw, 42vw"
          />
        </RevealItem>
        <RevealItem className="mt-8 px-1">
          <Eyebrow gradient="prism" size="sm">{to.eyebrow}</Eyebrow>
        </RevealItem>
        <ul className="mt-5 space-y-5 px-1 pb-2">
          {to.items.map((item) => (
            <ChecklistItem key={item}>{item}</ChecklistItem>
          ))}
        </ul>
      </RevealGroup>
    </div>
  )
}
