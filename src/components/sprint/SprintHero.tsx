'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { GradientText } from '@/src/components/prism'
import { SPRINT_HERO } from '@/src/ai-build-sprint-content'
import { SprintCtaPair } from './SprintCta'
import { SprintHeroReel } from './SprintHeroReel'
import { MonoLabel } from './ui'

export const SPRINT_HERO_ID = 'sprint-hero'

/** The homepage's hero entrance: each part fades up out of a soft blur, 120 ms apart. */
function heroReveal(step: number, reduce: boolean | null) {
  return {
    initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: reduce ? { duration: 0 } : { duration: 1.1, delay: step * 0.12, ease: [0.23, 1, 0.32, 1] as const },
  }
}

/**
 * The hero: the headline on the left, the Build Sprint film in a framed 9:16 card on the right,
 * lit by a faint screen glow (no panel behind it). The reel loads no video bytes until it is half
 * in view.
 */
export function SprintHero() {
  const { eyebrow, headline, subhead, microcopy } = SPRINT_HERO
  const reduce = useReducedMotion()

  return (
    <section id={SPRINT_HERO_ID} className="relative px-6 pb-16 pt-28 md:pb-20 lg:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="max-w-[46rem]">
          <motion.div {...heroReveal(0, reduce)}>
            <MonoLabel className="mb-6">{eyebrow}</MonoLabel>
          </motion.div>
          <motion.h1
            {...heroReveal(1, reduce)}
            className="text-balance text-ink"
            style={{ fontSize: 'clamp(2.4rem, 1.3rem + 3.1vw, 3.9rem)', lineHeight: 1.04, letterSpacing: '-0.035em' }}
          >
            {headline.lead}{' '}
            <GradientText gradient="prism" className="font-serif-accent pr-[0.06em]">
              {headline.accent}
            </GradientText>{' '}
            {headline.trail} {headline.second}
          </motion.h1>
          <motion.p {...heroReveal(2, reduce)} className="type-lg mt-7 max-w-xl text-ink-secondary" style={{ lineHeight: 1.5 }}>
            {subhead}
          </motion.p>
          <motion.div {...heroReveal(3, reduce)} className="mt-9 flex flex-col items-start gap-4">
            <SprintCtaPair location="hero" />
            <p className="type-sm max-w-md text-ink-tertiary">{microcopy}</p>
          </motion.div>
        </div>
        <motion.div {...heroReveal(4, reduce)}>
          <SprintHeroReel className="w-full lg:w-[380px]" />
        </motion.div>
      </div>
    </section>
  )
}
