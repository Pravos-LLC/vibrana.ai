'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotionValue } from '@/src/components/prism/motion/useReducedMotionValue'
import { BrowserFrame, Button, Eyebrow } from '@/src/components/prism'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'

export interface AiosShowcaseProps {
  eyebrow: string
  title: string
  subtitle: string
  /** The two product points, each shown with its real screenshot. */
  points: { title: string; description: string; screenshot: { src: string; alt: string; width: number; height: number } }[]
  /** The open-source point, rendered as a strip. */
  openSource: { title: string; description: string }
  cta: { text: string; href: string }
  note: string
}

/**
 * AiosShowcase — proof that Vibrana builds the tools it teaches: the real
 * AIOS workspace and team brain in browser frames, side by side at the same
 * size, drifting in opposite directions as the section scrolls. The
 * open-source point closes it as a full-width strip.
 */
export function AiosShowcase({ eyebrow, title, subtitle, points, openSource, cta, note }: AiosShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null)
  const rm = useReducedMotionValue()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const up = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? 0 : (0.5 - v) * 48))
  const down = useTransform([scrollYProgress, rm], ([v, r]: number[]) => (r ? 0 : (v - 0.5) * 48))

  return (
    <div ref={ref}>
      <RevealGroup className="mx-auto max-w-3xl text-center">
        <RevealItem>
          <Eyebrow gradient="prism" size="sm">{eyebrow}</Eyebrow>
        </RevealItem>
        <RevealItem>
          <h2 className="mt-4 font-display text-3xl tracking-tight text-ink md:text-5xl md:leading-[1.1]">{title}</h2>
        </RevealItem>
        <RevealItem>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{subtitle}</p>
        </RevealItem>
      </RevealGroup>

      <RevealGroup className="mt-14 grid gap-10 md:grid-cols-2 md:gap-8">
        {points.map((point, i) => (
          <motion.div key={point.title} style={{ y: i === 0 ? up : down }}>
            <RevealItem>
              <BrowserFrame
                src={point.screenshot.src}
                alt={point.screenshot.alt}
                width={point.screenshot.width}
                height={point.screenshot.height}
                aspect="16 / 10"
              />
              <div className="mt-6 flex items-start gap-4">
                <span className="text-gradient-prism font-display text-3xl leading-none">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-ink">{point.title}</h3>
                  <p className="mt-2 text-base leading-7 text-ink-secondary">{point.description}</p>
                </div>
              </div>
            </RevealItem>
          </motion.div>
        ))}
      </RevealGroup>

      <RevealGroup className="mt-14">
        <RevealItem className="flex flex-col gap-6 rounded-2xl border border-line-subtle bg-surface-raised p-6 md:flex-row md:items-center md:p-8">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-line-subtle bg-surface-base">
            {/* eslint-disable-next-line @next/next/no-img-element -- small SVG mark */}
            <PublicDemoImg src="/brand/aios-mark.svg" alt="AIOS" className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-xl tracking-tight text-ink">{openSource.title}</h3>
            <p className="mt-1 text-base leading-7 text-ink-secondary">{openSource.description}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-ink-tertiary">{note}</p>
          </div>
          <Button href={cta.href} variant="secondary" target="_blank" rel="noopener noreferrer" showArrow className="md:flex-none">
            {cta.text}
          </Button>
        </RevealItem>
      </RevealGroup>
    </div>
  )
}
