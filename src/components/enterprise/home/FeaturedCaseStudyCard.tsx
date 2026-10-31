'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Eyebrow } from '@/src/components/prism'
import { CountUp } from '@/src/components/prism/motion/CountUp'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'
import { AnonymizedTag } from '@/src/components/proof/AnonymizedMark'
import { EASE_OUT, VIEWPORT } from '@/src/components/prism/motion/tokens'

export interface FeaturedCaseStudyCardProps {
  eyebrow: string
  statement: string
  metrics: { value: string; label: string }[]
  attribution: { name: string; role?: string; /** Client is under NDA: shows the quiet Anonymized tag. */ anonymized?: boolean }
  cta: { text: string; href: string }
  image: { src: string; alt: string }
  /** Which side the photo sits on at desktop widths. */
  imageSide?: 'left' | 'right'
}

/**
 * FeaturedCaseStudyCard — the "from a real engagement" proof, with people in
 * it: a workshop photo on the left, the outcome and three metrics on the
 * right. Each metric counts up from zero as it arrives, with a hairline drawn
 * underneath in step.
 */
export function FeaturedCaseStudyCard({ eyebrow, statement, metrics, attribution, cta, image, imageSide = 'left' }: FeaturedCaseStudyCardProps) {
  const reduce = useReducedMotion()
  return (
    <RevealGroup className="overflow-hidden rounded-3xl border border-line-subtle bg-surface-raised shadow-[0_8px_40px_rgba(124,58,237,0.08)]">
      <div className={imageSide === 'right' ? 'grid lg:grid-cols-[7fr_5fr]' : 'grid lg:grid-cols-[5fr_7fr]'}>
        <RevealItem distance={0} className={imageSide === 'right' ? 'relative p-3 lg:order-2 lg:p-4' : 'relative p-3 lg:p-4'}>
          <ParallaxMedia
            src={image.src}
            alt={image.alt}
            sizes="(max-width: 1024px) 92vw, 40vw"
            className="aspect-square lg:aspect-auto lg:h-full lg:min-h-[540px]"
          />
        </RevealItem>

        <div className="flex flex-col justify-center px-6 py-10 md:px-12 md:py-14 lg:order-1">
          <RevealItem>
            <Eyebrow gradient="prism" size="sm">{eyebrow}</Eyebrow>
          </RevealItem>
          <RevealItem>
            <p
              className="mt-4 max-w-xl font-display tracking-tight text-ink"
              style={{ fontSize: 'clamp(1.875rem, 3.4vw, 3rem)', lineHeight: 1.08 }}
            >
              {statement}
            </p>
          </RevealItem>

          <div className="mt-10 grid gap-8 sm:grid-cols-[0.9fr_0.7fr_1.4fr]">
            {metrics.map((m, i) => (
              <RevealItem key={m.label}>
                <div className="font-display text-4xl leading-none tracking-tight md:text-5xl">
                  <CountUp value={m.value} duration={1.6 + i * 0.2} textClassName="text-gradient-prism" prefixClassName="text-xl md:text-2xl" />
                </div>
                <motion.div
                  aria-hidden
                  className="mt-4 h-0.5 rounded-full"
                  style={{ background: 'var(--gradient-prism)', transformOrigin: 'left' }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={VIEWPORT}
                  transition={reduce ? { duration: 0 } : { duration: 1.6 + i * 0.2, ease: EASE_OUT }}
                />
                <p className="mt-3 text-sm leading-6 text-ink-secondary">{m.label}</p>
              </RevealItem>
            ))}
          </div>

          <RevealItem className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line-subtle pt-6">
            <p className="text-sm text-ink-secondary">
              <span className="font-medium text-ink">{attribution.name}</span>
              {attribution.role ? ` · ${attribution.role}` : ''}
            </p>
            {attribution.anonymized && <AnonymizedTag />}
            <Button href={cta.href} variant="secondary" showArrow className="sm:ml-auto">
              {cta.text}
            </Button>
          </RevealItem>
        </div>
      </div>
    </RevealGroup>
  )
}
