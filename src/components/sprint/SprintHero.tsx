import { GradientText } from '@/src/components/prism'
import { SPRINT_HERO } from '@/src/ai-build-sprint-content'
import { SprintCta } from './SprintCta'
import { SprintHeroReel } from './SprintHeroReel'
import { MonoLabel } from './ui'

export const SPRINT_HERO_ID = 'sprint-hero'

/**
 * The hero: the headline on the left, the Build Sprint film in a framed 9:16 card on the
 * right (plan B1, B2: the photo collage and the placeholder disc are gone). The headline paints
 * with the HTML and carries no entrance motion, and the reel loads no video bytes until it is
 * half in view. Note: the LCP element is the reel's blurred backdrop (the 41 KB loop poster), not
 * the headline; video never blocks either.
 */
export function SprintHero() {
  const { eyebrow, headline, subhead, microcopy } = SPRINT_HERO

  return (
    <section id={SPRINT_HERO_ID} className="relative px-6 pb-16 pt-28 md:pb-20 lg:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
        <div className="max-w-[46rem]">
          <MonoLabel className="mb-6">{eyebrow}</MonoLabel>
          <h1 className="text-balance text-ink" style={{ fontSize: 'clamp(2.4rem, 1.3rem + 3.1vw, 3.9rem)', lineHeight: 1.04, letterSpacing: '-0.035em' }}>
            {headline.lead}{' '}
            <GradientText gradient="prism" className="font-serif-accent pr-[0.06em]" >
              {headline.accent}
            </GradientText>{' '}
            {headline.trail} {headline.second}
          </h1>
          <p className="type-lg mt-7 max-w-xl text-ink-secondary" style={{ lineHeight: 1.5 }}>
            {subhead}
          </p>
          <div className="mt-9 flex flex-col items-start gap-4">
            <SprintCta location="hero" />
            <p className="type-sm max-w-md text-ink-tertiary">{microcopy}</p>
          </div>
        </div>
        <SprintHeroReel className="w-full lg:w-[380px]" />
      </div>
    </section>
  )
}
