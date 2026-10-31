import React from 'react'
import { Button, Eyebrow, Section } from '@/src/components/prism'
import { EXECUTIVE_HERO } from '@/src/executive-transformation-content'

export function ExecutiveHero() {
  return (
    <Section container="prose" rhythm="large" className="pt-40 md:pt-48">
      <div className="text-center">
        <Eyebrow className="text-center">{EXECUTIVE_HERO.eyebrow}</Eyebrow>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-6xl">
          {EXECUTIVE_HERO.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">
          {EXECUTIVE_HERO.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href={EXECUTIVE_HERO.ctaPrimary.href} showArrow>
            {EXECUTIVE_HERO.ctaPrimary.label}
          </Button>
          <Button href={EXECUTIVE_HERO.ctaSecondary.href} variant="secondary">
            {EXECUTIVE_HERO.ctaSecondary.label}
          </Button>
        </div>
      </div>
    </Section>
  )
}
