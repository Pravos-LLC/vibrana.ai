'use client'

import React from 'react'
import { productionSite } from '@/src/site-content'
import Image from '@/src/components/PublicDemoImage'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow, GradientText, Reveal, Section } from '@/src/components/prism'
import {
  SWAG_HERO,
  SWAG_STICKER_SECTION,
  STICKER_THEMES,
  SWAG_STICKER_DOWNLOAD,
  SWAG_SHIRT_SECTION,
  SWAG_SHIRTS,
  SWAG_CLOSING,
} from '@/src/swag-content'

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

// Prism Light's token set has no near-black/inverse surface (see DESIGN.md
// "Semantic surfaces": surface-base/raised/overlay/card/nav/inset are all light).
// The sticker/shirt art plates below are a deliberate literal, not a token gap:
// stickers render on transparent webp, so the plate is the retro-arcade backdrop
// behind the artwork; the shirt mockups are already opaque near-#111111 photos,
// so matching that value removes any visible seam around the object-contain
// padding. Documented and allowlisted in scripts/prism-guardrail.sh.

export default function SwagPage() {
  return (
    <EnterprisePageShell>
      {/* HERO */}
      <section className="px-6 pb-12 pt-32 md:pt-44">
        <div className="mx-auto max-w-4xl text-center">
          <Eyebrow gradient="prism">{SWAG_HERO.eyebrow}</Eyebrow>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl">
            {SWAG_HERO.titleLead}
            <GradientText gradient="prism" className="font-serif-accent">
              {SWAG_HERO.titleAccent}
            </GradientText>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-ink-secondary md:text-xl">
            {SWAG_HERO.subhead}
          </p>
          <div className="mt-8 flex justify-center">
            <Button href={SWAG_STICKER_DOWNLOAD.href} download showArrow>
              {SWAG_STICKER_DOWNLOAD.label}
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-tertiary">{SWAG_STICKER_DOWNLOAD.note}</p>
        </div>
      </section>

      {/* STICKER PACK */}
      <Section container="full" rhythm="large">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow gradient="prism">{SWAG_STICKER_SECTION.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-ink md:text-3xl">
            {SWAG_STICKER_SECTION.heading}
            <GradientText gradient={SWAG_STICKER_SECTION.gradient} className="font-serif-accent">
              {SWAG_STICKER_SECTION.gradientWord}
            </GradientText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-secondary">
            {SWAG_STICKER_SECTION.intro}
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {STICKER_THEMES.map((group) => (
            <div key={group.theme}>
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-[0.12em] text-ink-secondary">
                {group.theme}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {group.stickers.map((sticker) => (
                  <Reveal key={sticker.slug}>
                    <div className={`${panel} group flex h-full flex-col overflow-hidden p-3`}>
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#111111]/90">
                        <Image
                          src={`/assets/swag/stickers/${sticker.slug}.webp`}
                          alt={sticker.title}
                          fill
                          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                          className="object-contain p-2 transition-transform group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-snug text-ink-tertiary">
                        {sticker.title}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {productionSite && <>
      <Section container="wide" rhythm="large" surface="raised">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow gradient={SWAG_SHIRT_SECTION.gradient}>{SWAG_SHIRT_SECTION.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold leading-tight text-ink md:text-3xl">
            {SWAG_SHIRT_SECTION.heading}
            <GradientText gradient={SWAG_SHIRT_SECTION.gradient} className="font-serif-accent">
              {SWAG_SHIRT_SECTION.gradientWord}
            </GradientText>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-secondary">
            {SWAG_SHIRT_SECTION.intro}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {SWAG_SHIRTS.map((shirt) => (
            <Reveal key={shirt.slug}>
              <div className={`${panel} overflow-hidden p-4`}>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#111111]">
                  <Image
                    src={shirt.image}
                    alt={shirt.imageAlt}
                    fill
                    sizes="(min-width: 640px) 40vw, 90vw"
                    className="object-contain p-2"
                  />
                </div>
                <p className="mt-4 text-center text-sm leading-snug text-ink-secondary">{shirt.caption}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      </>}

      {/* CLOSING */}
      <Section container="prose" rhythm="large">
        <div className={`${panel} mx-auto max-w-2xl p-10 text-center`}>
          <Eyebrow gradient="prism">{SWAG_CLOSING.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-xl font-semibold text-ink md:text-2xl">{SWAG_CLOSING.heading}</h2>
          <p className="mt-4 text-base leading-7 text-ink-secondary">{SWAG_CLOSING.body}</p>
          <div className="mt-8 flex justify-center">
            <Button href={SWAG_CLOSING.primaryCta.href} variant="secondary">
              {SWAG_CLOSING.primaryCta.label}
            </Button>
          </div>
        </div>
      </Section>
    </EnterprisePageShell>
  )
}
