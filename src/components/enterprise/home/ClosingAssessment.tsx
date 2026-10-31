'use client'

import React, { useRef } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'
import { Button, TabletFrame } from '@/src/components/prism'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'

export interface ClosingAssessmentProps {
  eyebrow: string
  title: string
  body: string
  primaryCta: { text: string; href: string }
  secondaryCta: { text: string; href: string }
  /** Called when the secondary CTA is clicked (e.g. to count a booking-link click). */
  onSecondaryClick?: () => void
  scene: { src: string; alt: string }
  screenshot: { src: string; alt: string }
}

/**
 * ClosingAssessment — the company-wide door, given weight: a deep Prism
 * gradient card (not white on white) with a sample readiness report on a
 * tablet, laid over a photographed desk. The gradient and the tablet both
 * move with scroll; nothing moves on its own.
 */
export function ClosingAssessment({ eyebrow, title, body, primaryCta, secondaryCta, onSecondaryClick, scene, screenshot }: ClosingAssessmentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // The gradient is 160% of the card wide and slides 20% -> 80% of the slack. That is a pure
  // translate of its own layer (same pixels as animating background-position, without a
  // repaint of the blurred card every frame): shift = -(0.2 + 0.6v) * 0.6 / 1.6 of the layer.
  const gradX = useTransform([scrollYProgress, rm], ([v, r]: number[]) => `${-(r ? 0.5 : 0.2 + v * 0.6) * 37.5}%`)
  const tabletY = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? 0 : 40 - v * 60))

  return (
    <motion.div
      ref={ref}
      // The block itself rises from below, scaling up into place, before its contents cascade.
      // One `transform` string, not `y` + `scale`: framer-motion hands `transform` and `opacity`
      // to the compositor (WAAPI). As separate `y`/`scale` values it stepped the transform from
      // the main thread every frame, and each new scale re-rastered the whole card (film grain,
      // photo, tablet) while the opacity ran on its own clock.
      initial={{ opacity: 0, transform: 'translateY(90px) scale(0.94)' }}
      whileInView={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      // MotionConfig's reduced motion only strips x/y/scale-style keys, not a raw `transform`,
      // so snap it here. `initial` stays identical on server and client.
      transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], ...(reduce ? { transform: { duration: 0 } } : {}) }}
      className="relative overflow-hidden rounded-[28px] border border-line-subtle text-ink shadow-[0_24px_80px_rgba(99,102,241,0.14)] backdrop-blur-xl"
    >
      {/* moving gradient: its own transform-animated layer */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[160%] will-change-transform"
        style={{
          x: gradX,
          backgroundImage: 'linear-gradient(120deg, rgba(124,58,237,0.13) 0%, rgba(59,130,246,0.10) 45%, rgba(45,212,191,0.14) 100%)',
        }}
      />
      {/* film grain so the gradient reads as light, not a flat fill */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div className="relative grid items-center gap-10 p-8 md:p-14 lg:grid-cols-[1fr_1.05fr]">
        <RevealGroup>
          <RevealItem>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet-strong">{eyebrow}</p>
          </RevealItem>
          <RevealItem>
            <h2 className="mt-5 font-display text-4xl leading-[1.08] tracking-tight text-ink md:text-5xl">{title}</h2>
          </RevealItem>
          <RevealItem>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{body}</p>
          </RevealItem>
          <RevealItem className="mt-9 flex flex-wrap items-center gap-4">
            <Button href={primaryCta.href} showArrow>{primaryCta.text}</Button>
            <Button href={secondaryCta.href} variant="secondary" showArrow onClick={onSecondaryClick}>{secondaryCta.text}</Button>
          </RevealItem>
        </RevealGroup>

        <RevealGroup>
          <RevealItem className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-line-subtle">
              <Image src={scene.src} alt={scene.alt} fill sizes="(max-width: 1024px) 90vw, 45vw" className="object-cover" />
            </div>
            {/* own layer: the scroll-linked rise moves it without repainting the photo and the
                tablet's 60px shadow under it on every scroll frame */}
            <motion.div className="absolute inset-x-[11%] top-[17%] will-change-transform" style={{ y: tabletY }}>
              <TabletFrame
                src={screenshot.src}
                alt={screenshot.alt}
                style={{ transform: 'rotate(-4deg)', boxShadow: '0 30px 60px rgba(30,27,75,0.45)' }}
              />
            </motion.div>
          </RevealItem>
        </RevealGroup>
      </div>
    </motion.div>
  )
}
