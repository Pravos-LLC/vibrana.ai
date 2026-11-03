'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { EnterpriseInquiryForm } from '@/src/components/enterprise/EnterpriseInquiryForm'
import { Button } from '@/src/components/prism'
import { ChapterRail } from '@/src/components/landing'
import { TRANSFORMATION_PAGE as T } from '@/src/ai-transformation-content'
import { OperatingMap } from '@/src/components/transformation/OperatingMap'
import { PathwayFilm } from '@/src/components/transformation/PathwayFilm'
import { accent } from '@/src/components/transformation/accent'
import {
  Chapter,
  Differentiators,
  FitCriteria,
  Landscape,
  OutcomesBridge,
  PhaseBody,
  ProofSpread,
  SafeguardClauses,
} from '@/src/components/transformation/chapters'

const SHELL = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8'
const PHASE_IDS = ['map', 'build', 'learn', 'transfer'] as const

/**
 * /ai-transformation, Editorial Field Report: a masthead over the operating map, then the program as a
 * report in eight numbered chapters (ChapterRail), each phase chapter closing on its GateCard.
 * Copy: src/ai-transformation-content.ts (hub copy deck transformation.md).
 */
export default function AITransformationPage() {
  return (
    <EnterprisePageShell>
      {/* Masthead */}
      <header className={`${SHELL} pt-24 md:pt-28`}>
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
          <p className="label-mono text-ink-secondary">{T.hero.eyebrow}</p>
        </div>
        <h1
          className="mt-8 max-w-[19ch] font-display font-semibold text-ink md:mt-10"
          style={{
            fontSize: 'clamp(2.5rem, 1.35rem + 4.1vw, 5.1rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.035em',
          }}
        >
          {accent(T.hero.title)}
        </h1>
        <div className="mt-8 grid gap-8 md:mt-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <div className="max-w-[58ch]">
            <p
              className="text-ink-secondary"
              style={{
                fontSize: 'clamp(1.05rem, 0.98rem + 0.35vw, 1.25rem)',
                lineHeight: 1.55,
              }}
            >
              {T.hero.subtitle}
            </p>
            <p className="label-mono tabular mt-4 text-ink">{T.hero.priceLine}</p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <Button href="/ai-readiness" showArrow>
              {T.hero.primaryCta}
            </Button>
            <Link
              href="#discuss"
              className="group inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current"
            >
              {T.hero.secondaryCta}
              <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className={`${SHELL} mt-12 md:mt-6`}>
        <OperatingMap />
      </div>

      {/* The report */}
      <div
        className={`${SHELL} mt-16 md:mt-24 md:grid md:grid-cols-[168px_minmax(0,1fr)] md:gap-x-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-x-16`}
      >
        <aside className="max-md:contents md:pt-14">
          {/* Heading and rail stick together; below md the wrapper dissolves so the rail's own bar sticks. */}
          <div className="max-md:contents md:sticky md:top-[88px]">
            <p className="label-mono hidden pb-3 pl-4 text-ink-tertiary md:block">{T.rail.heading}</p>
            <ChapterRail
              chapters={T.rail.chapters}
              label={T.rail.label}
              skipLabel={T.rail.skipLabel}
              formatProgress={(_n, _total, chapter) => T.rail.formatProgress(chapter.number ?? String(_n))}
              top={109}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <Chapter id="problem" title={T.chapters.problem.title} lede={T.chapters.problem.lede} aside={<FitCriteria />}>
            <div className="flex flex-col gap-20 md:gap-28">
              <Landscape />
              <Differentiators />
              <OutcomesBridge />
            </div>
          </Chapter>

          {PHASE_IDS.map((id) => (
            <Chapter key={id} id={id} title={T.chapters[id].title} lede={T.chapters[id].lede} strip={id}>
              <PhaseBody phase={id} />
            </Chapter>
          ))}

          <Chapter id="proof" title={T.chapters.proof.title} eyebrow={T.proof.eyebrow}>
            <ProofSpread />
          </Chapter>

          <Chapter id="safeguards" title={T.chapters.safeguards.title} eyebrow={T.safeguards.eyebrow} lede={T.safeguards.description}>
            <SafeguardClauses />
          </Chapter>

          <Chapter id="start" title={T.chapters.start.title}>
            <div className="flex flex-col gap-16">
              <DiagnosticBand />
              <SimulatorLine />
            </div>
          </Chapter>
        </div>
      </div>

      <section id="discuss" className="scroll-mt-24 border-t border-line bg-surface-raised">
        <div className={`${SHELL} py-20 md:py-28`}>
          <div className="mx-auto max-w-5xl">
            <EnterpriseInquiryForm {...T.inquiry} />
          </div>
        </div>
      </section>
    </EnterprisePageShell>
  )
}

/**
 * The page's one dark band (the Field Report's film moment): the diagnostic offer beside the
 * pathway loop of a sample readiness report. Pinned to the dark tokens whatever the page theme.
 */
function DiagnosticBand() {
  const A = T.assessment
  return (
    <div
      id="assessment"
      data-theme="dark"
      className="scroll-mt-28 rounded-[28px] bg-surface-raised p-6 text-ink ring-1 ring-white/10 sm:p-10 lg:p-12"
      style={{ colorScheme: 'dark' }}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="flex flex-col">
          <p className="label-mono text-ink-tertiary">{A.eyebrow}</p>
          <h3
            className="mt-4 font-display font-semibold text-ink"
            style={{
              fontSize: 'clamp(1.4rem, 1.2rem + 0.6vw, 1.8rem)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {A.title}
          </h3>
          <p className="mt-5 text-ink-secondary" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
            {A.description}
          </p>
          <ul className="mt-7 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {A.details.map((d) => (
              <li key={d} className="border-t border-line py-3 text-sm font-medium text-ink">
                {d}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            {/* The dark-mode button tokens key off a dark ancestor of .prism-light, which this band is not. */}
            <Button href="/ai-readiness" showArrow className="![--g-text:#f1eaff] ![--g-edge:rgba(167,139,250,0.45)]">
              {A.cta}
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-8">
          <PathwayFilm caption={A.figCaption} />
          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <p className="text-ink-secondary" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              {A.method}
            </p>
            <p className="text-ink-tertiary" style={{ fontSize: '0.75rem', lineHeight: 1.55 }}>
              {A.privacy}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The simulator offer (kept copy), set as one ruled line rather than a second panel. */
function SimulatorLine() {
  const S = T.simulator
  return (
    <div id="simulator" className="grid scroll-mt-28 gap-6 border-y border-line py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
      <div className="max-w-[62ch]">
        <p className="label-mono text-ink-tertiary">{S.eyebrow}</p>
        <h3
          className="mt-3 font-display font-semibold text-ink"
          style={{
            fontSize: 'clamp(1.35rem, 1.15rem + 0.7vw, 1.75rem)',
            lineHeight: 1.2,
            letterSpacing: '-0.015em',
          }}
        >
          {accent(S.title)}
        </h3>
        <p className="mt-3 text-ink-secondary" style={{ fontSize: '0.975rem', lineHeight: 1.6 }}>
          {S.description}
        </p>
      </div>
      <Button href={S.href} variant="secondary" showArrow>
        {S.cta}
      </Button>
    </div>
  )
}
