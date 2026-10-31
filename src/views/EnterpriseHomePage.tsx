'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, AlertTriangle, Workflow, TrendingDown, ClipboardCheck, Network, GraduationCap, Cpu } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import {
  AIOS_ECOSYSTEM,
  ENTERPRISE_AFTER_TWELVE_WEEKS,
  ENTERPRISE_ENGAGEMENTS,
  ENTERPRISE_HERO,
  ENTERPRISE_HOME_SECTIONS,
  ENTERPRISE_METHODOLOGY,
  ENTERPRISE_PROBLEM,
  ENTERPRISE_PROOF,
  IDEAL_CLIENT_PROFILE,
  TRANSFORMATION_PHASES,
} from '@/src/enterprise-content'
import {
  AIOS_SCREENSHOTS,
  CLOSING_MOCK,
  ENGAGEMENT_CTA,
  ENGAGEMENT_MEDIA,
  FEATURED_CASE_STUDY_IMAGE,
  HOMEPAGE_ROLE_ORDER,
  METHODOLOGY_LINKS,
  PHASE_MEDIA,
} from '@/src/enterprise-home-content'
import { AsciiField, Button, Card, CountUp, Eyebrow, FloatingCards, GradientText, IconBox, MarkerCircle, RevealBlock, RevealGroup, RevealItem, SectionHeader, Section, WaveField, type FloatingCardsTile } from '@/src/components/prism'
import { getImagery } from '@/src/imagery-manifest'
import { LogoRow } from '@/src/components/proof/LogoRow'
import { FeaturedCaseStudyCard } from '@/src/components/enterprise/home/FeaturedCaseStudyCard'
import { EngagementsSection, type Engagement } from '@/src/components/enterprise/home/EngagementsSection'
import { PhasesScrollSequence } from '@/src/components/enterprise/home/PhasesScrollSequence'
import { FromToSection } from '@/src/components/enterprise/home/FromToSection'
import { SectionWhisper } from '@/src/components/prism/VerticalWaveField'
import { CurriculumGrid } from '@/src/components/enterprise/home/CurriculumGrid'
import { AiosShowcase } from '@/src/components/enterprise/home/AiosShowcase'
import { ClosingAssessment } from '@/src/components/enterprise/home/ClosingAssessment'
// Type-only: erased at compile time, safe in a client component. The runtime
// module (src/lib/case-studies.ts) uses `fs` and must never be imported here.
import type { CaseStudy } from '@/src/lib/case-studies'

const panel =
  'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

/** Resolve a manifest image id to src + alt. */
function img(id: string, alt: string) {
  return { src: getImagery(id)?.file ?? '', alt }
}

// Hero lines resolve from blur to sharp, one whole line at a time (never per
// letter), staggered. Borrowed from mariwaze.com's text reveals. Under reduced
// motion the transition collapses to zero: MotionConfig only strips transforms,
// so the blur and fade are switched off here. Only the transition varies (never
// `initial`), so server and client markup stay identical.
const HERO_EASE = [0.23, 1, 0.32, 1] as const
function heroReveal(step: number, reduce: boolean | null) {
  return {
    initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: reduce ? { duration: 0 } : { duration: 1.1, delay: step * 0.12, ease: HERO_EASE },
  }
}

const problemIcons = [Workflow, AlertTriangle, TrendingDown] as const
const methodologyIcons = [ClipboardCheck, Network, GraduationCap, Cpu] as const
const methodologyTints = ['violet', 'blue', 'emerald', 'cyan'] as const

// Orchid-language homepage imagery from the catalog (public/assets/imagery/homepage).
// Round 2 (JE, 2026-10-03): four tiles, not six, two of them people, and they move
// only with scroll, each at its own depth.
const HERO_FLOATING_TILES: FloatingCardsTile[] = [
  // Mixed orientation and scale, after the /ai-build-sprint collage: a tall portrait,
  // a wide frame, a landscape and two small circles, so the sides read as composed.
  { src: '/assets/imagery/sprint/sprint-whiteboard-team.webp', width: 'w-[12%] 2xl:w-[15%]', aspect: 'aspect-4/5', top: '4%', left: '3%', rotate: -3, depth: 70, index: 0 },
  { src: '/assets/imagery/homepage/prism-grid-solar.webp', width: 'w-[13%] 2xl:w-[16%]', aspect: 'aspect-video', top: '64%', left: '6%', rotate: 2.5, depth: 150, index: 1 },
  { src: '/assets/imagery/homepage/teams-call-diptych.webp', width: 'w-[15%] 2xl:w-[18%]', aspect: 'aspect-16/10', top: '8%', right: '3%', rotate: 3, depth: 110, index: 3 },
  { src: '/assets/imagery/homepage/ppl-cafe-laptop.webp', width: 'w-[11%] 2xl:w-[14%]', aspect: 'aspect-3/2', top: '60%', right: '6%', rotate: -2.5, depth: 170, index: 4 },
]

export interface EnterpriseHomePageProps {
  featuredCaseStudy?: CaseStudy
  /** A second featured study, shown directly below the first with its image on the right. */
  secondCaseStudy?: CaseStudy
}

// Local copy of src/lib/case-studies.ts's caseStudyName. Duplicated, not
// imported: that module uses `fs` and must never reach a client bundle.
function caseStudyDisplayName(cs: Pick<CaseStudy, 'client' | 'anonymizedName'>) {
  return cs.client ?? cs.anonymizedName
}

const S = ENTERPRISE_HOME_SECTIONS

// Sampleca6cf3fe07ce's card image: the company-wide call the six-week season ran on.
const SECOND_CASE_STUDY_IMAGE = {
  src: '/assets/imagery/homepage/prism-grid-solar.webp',
  alt: 'Over the shoulder of someone on a company-wide video call, a gallery of colleagues from several offices on the laptop screen',
}

// Engagements with their scene and CTA, matched by title (not array order).
function toEngagement(e: (typeof ENTERPRISE_ENGAGEMENTS)[number]): Engagement {
  const media = ENGAGEMENT_MEDIA[e.title]
  return {
    ...e,
    image: img(media?.id ?? '', media?.alt ?? ''),
    cta: media?.ctaHref ? { text: ENGAGEMENT_CTA[e.title] ?? e.title, href: media.ctaHref } : undefined,
  }
}

const SPRINT_TITLE = 'AI Build Sprint'
const engagements = {
  lead: toEngagement(ENTERPRISE_ENGAGEMENTS.find((e) => e.title === SPRINT_TITLE) ?? ENTERPRISE_ENGAGEMENTS[0]),
  pair: ENTERPRISE_ENGAGEMENTS.filter((e) => e.title !== SPRINT_TITLE).map(toEngagement),
}

export default function EnterpriseHomePage({ featuredCaseStudy, secondCaseStudy }: EnterpriseHomePageProps) {
  const reduce = useReducedMotion()
  return (
    <EnterprisePageShell>
      {/* ── HERO ── */}
      <section className="relative flex flex-col px-6 md:min-h-svh">
        <WaveField preset="hero" />
        {/* Tiles live above the logo rows, never behind them. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-60 top-24 hidden xl:block">
          <FloatingCards tiles={HERO_FLOATING_TILES} />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center pb-10 pt-36 text-center md:pt-44">
          <motion.div {...heroReveal(0, reduce)}>
            <Eyebrow gradient="prism">{ENTERPRISE_HERO.eyebrow}</Eyebrow>
          </motion.div>
          <motion.h1
            {...heroReveal(1, reduce)}
            className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl"
          >
            {ENTERPRISE_HERO.headlinePrefix}
            <GradientText className="font-serif-accent">{ENTERPRISE_HERO.headlineGradientWord}</GradientText>
            {ENTERPRISE_HERO.headlineSuffix}
          </motion.h1>
          <motion.p
            {...heroReveal(2, reduce)}
            className="mx-auto mt-6 max-w-4xl text-lg leading-7 text-ink-secondary md:text-2xl md:leading-9"
          >
            {ENTERPRISE_HERO.subhead}
          </motion.p>

          <motion.div
            {...heroReveal(3, reduce)}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <span className="hero-cta-ripple">
              <Button href={ENTERPRISE_HERO.primaryCta.href} showArrow>{ENTERPRISE_HERO.primaryCta.text}</Button>
            </span>
            <Button href={ENTERPRISE_HERO.secondaryCta.href} variant="secondary">{ENTERPRISE_HERO.secondaryCta.text}</Button>
          </motion.div>

        </div>

        {/* Full-bleed so the marquee runs edge to edge of the page. */}
        <motion.div {...heroReveal(4, reduce)} className="relative z-10 -mx-6 pb-14 pt-2 md:pb-20">
          <LogoRow />
        </motion.div>
      </section>

      {/* ── PROBLEM STATEMENT ── */}
      <Section container="full" rhythm="large" className="pt-16">
        <SectionHeader
          eyebrow={ENTERPRISE_PROBLEM.eyebrow}
          title={ENTERPRISE_PROBLEM.title}
          gradientWord="results"
          gradientClassName="font-serif-accent"
          subtitle={ENTERPRISE_PROBLEM.subtitle}
        />
        <RevealGroup delay={0.6} className="grid gap-5 md:grid-cols-3">
          {ENTERPRISE_PROBLEM.points.map((point, index) => {
            const Icon = problemIcons[index]
            return (
              <RevealItem key={point.title} className="h-full">
                <Card className="h-full p-7">
                  <IconBox icon={Icon} tint="violet" />
                  <h3 className="mt-5 text-lg font-semibold text-ink">{point.title}</h3>
                  <p className="mt-3 text-base leading-7 text-ink-secondary">{point.description}</p>
                </Card>
              </RevealItem>
            )
          })}
        </RevealGroup>
        <RevealBlock>
          <p className="mx-auto mt-10 max-w-3xl text-center text-lg font-medium leading-8 text-ink md:text-xl">
            {ENTERPRISE_PROBLEM.close}
          </p>
        </RevealBlock>
      </Section>

      <SectionWhisper />

      {/* ── METHODOLOGY (HAT) ── */}
      <Section container="full" rhythm="large" className="pb-6">
        <SectionHeader
          eyebrow={ENTERPRISE_METHODOLOGY.eyebrow}
          title={ENTERPRISE_METHODOLOGY.title}
          subtitle={ENTERPRISE_METHODOLOGY.subtitle}
        />
        <RevealGroup delay={0.6} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {ENTERPRISE_METHODOLOGY.pillars.map((pillar, index) => {
            const Icon = methodologyIcons[index]
            const link = METHODOLOGY_LINKS[pillar.title]
            const card = (
              <Card
                className="h-full p-7 transition-transform duration-300 ease-out group-hover:-translate-y-1"
                tint={index === 0 ? 'prism' : undefined}
              >
                <div className="flex items-start justify-between">
                  <IconBox icon={Icon} tint={methodologyTints[index]} />
                  {link && (
                    <ArrowUpRight
                      aria-hidden
                      className="h-5 w-5 text-ink-tertiary transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-violet"
                    />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-3 text-base leading-7 text-ink-secondary">{pillar.description}</p>
              </Card>
            )
            return (
              <RevealItem key={pillar.title} className="h-full">
                {!link ? (
                  card
                ) : link.external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="group block h-full rounded-2xl">
                    {card}
                  </a>
                ) : (
                  <Link href={link.href} className="group block h-full rounded-2xl">
                    {card}
                  </Link>
                )}
              </RevealItem>
            )
          })}
        </RevealGroup>
      </Section>

      {/* ── PROOF STRIP ── */}
      <section className="px-6 pb-16 pt-2">
        <div className="mx-auto max-w-7xl">
          <RevealGroup className="grid gap-0 md:grid-cols-[1.1fr_1fr_0.9fr] md:between:border-l md:between:border-line-subtle">
            {ENTERPRISE_PROOF.map((item) => (
              <RevealItem key={item.label} className="px-6 py-5 first:pl-0 last:pr-0">
                <div className="text-4xl font-semibold tracking-tight text-ink md:text-5xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {item.caseStudyHref ? <MarkerCircle accent><CountUp value={item.value} /></MarkerCircle> : <CountUp value={item.value} />}
                </div>
                <Eyebrow className="mt-2">{item.label}</Eyebrow>
                <p className="mt-3 max-w-xs text-base leading-7 text-ink-secondary">{item.description}</p>
                {item.caseStudyHref && (
                  <Link href={item.caseStudyHref} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-violet-strong hover:underline">
                    {item.caseStudyLink}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── FEATURED CASE STUDY ── */}
      {featuredCaseStudy && (
        <Section container="full" rhythm="large">
          <FeaturedCaseStudyCard
            eyebrow={S.featuredCaseStudy.eyebrow}
            statement={featuredCaseStudy.homepageStatement ?? featuredCaseStudy.oneLineOutcome}
            metrics={featuredCaseStudy.metrics.map((m) => ({ value: String(m.value), label: String(m.label) }))}
            attribution={{ name: caseStudyDisplayName(featuredCaseStudy), role: featuredCaseStudy.vertical, anonymized: featuredCaseStudy.client === null }}
            cta={{ text: S.featuredCaseStudy.cta, href: `/case-studies/${featuredCaseStudy.slug}` }}
            image={img(FEATURED_CASE_STUDY_IMAGE.id, FEATURED_CASE_STUDY_IMAGE.alt)}
          />
        </Section>
      )}

      {/* ── SECOND CASE STUDY (image on the right) ── */}
      {secondCaseStudy && (
        <Section container="full" rhythm="none" className="pb-24">
          <FeaturedCaseStudyCard
            eyebrow={S.secondCaseStudy.eyebrow}
            statement={secondCaseStudy.homepageStatement ?? secondCaseStudy.oneLineOutcome}
            metrics={secondCaseStudy.metrics.map((m) => ({ value: String(m.value), label: String(m.label) }))}
            attribution={{ name: caseStudyDisplayName(secondCaseStudy), role: secondCaseStudy.vertical, anonymized: secondCaseStudy.client === null }}
            cta={{ text: S.secondCaseStudy.cta, href: `/case-studies/${secondCaseStudy.slug}` }}
            image={{ src: SECOND_CASE_STUDY_IMAGE.src, alt: SECOND_CASE_STUDY_IMAGE.alt }}
            imageSide="right"
          />
        </Section>
      )}

      {/* ── ICP ── */}
      <section className="px-6 py-16">
        <FromToSection
          from={{ eyebrow: S.idealClient.eyebrow, items: IDEAL_CLIENT_PROFILE, image: { src: '/assets/imagery/homepage/fit-from-office.webp', alt: 'Colleagues walking past a wall dashboard of a stalled AI pilot in a large open-plan office' } }}
          to={{ eyebrow: S.afterTwelveWeeks.eyebrow, items: ENTERPRISE_AFTER_TWELVE_WEEKS, image: { src: '/assets/imagery/homepage/fit-to-office.webp', alt: 'Operations colleagues maintaining an agentic workflow they built, in the same office in warm light' } }}
        />
      </section>

      {/* ── ENGAGEMENTS ── */}
      <Section container="full" rhythm="large">
        <SectionHeader
          eyebrow={S.engagements.eyebrow}
          title={S.engagements.title}
          gradientWord={S.engagements.gradientWord}
          gradient="prism"
          gradientClassName="font-serif-accent"
          subtitle={S.engagements.subtitle}
        />
        <EngagementsSection lead={engagements.lead} pair={engagements.pair} />
      </Section>

      {/* ── PHASES (the 12-week arc, scroll sequence) ── */}
      <Section container="full" rhythm="large">
        <SectionHeader
          eyebrow={S.phases.eyebrow}
          title={S.phases.title}
          subtitle={S.phases.subtitle}
        />
        <PhasesScrollSequence
          phases={TRANSFORMATION_PHASES.map((phase, i) => ({
            ...phase,
            image: img(PHASE_MEDIA[i]?.id ?? '', PHASE_MEDIA[i]?.alt ?? ''),
          }))}
        />
      </Section>

      <SectionWhisper />

      {/* ── CURRICULUM (by role) ── */}
      <Section container="full" rhythm="large">
        <CurriculumGrid
          eyebrow={S.curriculum.eyebrow}
          title={S.curriculum.title}
          body={S.curriculum.body}
          cta={{ text: S.curriculum.cta, href: '/learn' }}
          roles={HOMEPAGE_ROLE_ORDER}
        />
      </Section>

      {/* ── AIOS / OPEN-SOURCE ECOSYSTEM ── */}
      <Section container="full" rhythm="large">
        <AiosShowcase
          eyebrow={AIOS_ECOSYSTEM.eyebrow}
          title={AIOS_ECOSYSTEM.title}
          subtitle={AIOS_ECOSYSTEM.subtitle}
          points={AIOS_ECOSYSTEM.points.slice(0, 2).map((point, i) => ({ ...point, screenshot: AIOS_SCREENSHOTS[i] }))}
          openSource={AIOS_ECOSYSTEM.points[2]}
          cta={AIOS_ECOSYSTEM.cta}
          note={AIOS_ECOSYSTEM.note}
        />
      </Section>

      {/* ── ASCII FIELD (decorative) ── */}
      <Section container="wide" rhythm="large" className="py-26">
        <RevealBlock>
          <AsciiField />
        </RevealBlock>
      </Section>

      {/* ── CLOSING: company-wide transformation ── */}
      <Section container="wide" rhythm="large">
        <WaveField preset="section" />
        <ClosingAssessment
          eyebrow={S.transformation.eyebrow}
          title={S.transformation.title}
          body={S.transformation.body}
          primaryCta={CLOSING_MOCK.primaryCta}
          secondaryCta={{ text: S.transformation.cta, href: '/ai-transformation' }}
          scene={img(CLOSING_MOCK.sceneId, '')}
          screenshot={CLOSING_MOCK.screenshot}
        />
      </Section>
    </EnterprisePageShell>
  )
}
