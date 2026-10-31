'use client'

import { Compass, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { EnterpriseInquiryForm } from '@/src/components/enterprise/EnterpriseInquiryForm'
import { AITransformationLandscape } from '@/src/components/enterprise/AITransformationLandscape'
import { AITransformationDifferentiators } from '@/src/components/enterprise/AITransformationDifferentiators'
import { Button, Eyebrow, MetricProof, Section, SectionHeader } from '@/src/components/prism'
import { TRANSFORMATION_PAGE } from '@/src/ai-transformation-content'

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

export default function AITransformationPage() {
  return (
    <EnterprisePageShell>
      <section className="px-6 pb-20 pt-32 md:pb-24 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <Eyebrow gradient="prism">{TRANSFORMATION_PAGE.hero.eyebrow}</Eyebrow>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-tight text-ink md:text-7xl">{TRANSFORMATION_PAGE.hero.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-secondary md:text-xl">{TRANSFORMATION_PAGE.hero.subtitle}</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/ai-readiness" showArrow>{TRANSFORMATION_PAGE.hero.primaryCta}</Button>
            <Button href="#discuss" variant="secondary">{TRANSFORMATION_PAGE.hero.secondaryCta}</Button>
          </div>
        </div>
      </section>

      <Section container="full" surface="raised">
        <MetricProof eyebrow={TRANSFORMATION_PAGE.proof.eyebrow} statement={TRANSFORMATION_PAGE.proof.title} metrics={[...TRANSFORMATION_PAGE.proof.metrics]} attribution={{ name: TRANSFORMATION_PAGE.proof.description }} />
        <div className="mt-5">
          <Link href={TRANSFORMATION_PAGE.proof.caseStudyHref} className="inline-flex items-center gap-2 text-sm font-medium text-brand-violet-strong hover:underline">
            {TRANSFORMATION_PAGE.proof.caseStudyLink}
          </Link>
        </div>
      </Section>

      <Section container="full">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`${panel} p-8`}>
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-brand-violet-strong" />
              <h2 className="text-2xl font-semibold text-ink">{TRANSFORMATION_PAGE.outcomes.title}</h2>
            </div>
            <ul className="mt-6 space-y-4">
              {TRANSFORMATION_PAGE.outcomes.items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 flex-none text-brand-violet-strong" />
                  <span className="text-sm leading-6 text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${panel} p-8`}>
            <Eyebrow>{TRANSFORMATION_PAGE.outcomes.fitEyebrow}</Eyebrow>
            <div className="mt-5 between:border-t between:border-line-subtle">
              {TRANSFORMATION_PAGE.outcomes.fit.map((item) => <p key={item} className="py-4 text-sm leading-6 text-ink-secondary">{item}</p>)}
            </div>
          </div>
        </div>
      </Section>

      <AITransformationLandscape />

      <Section container="full" surface="overlay">
        <SectionHeader {...TRANSFORMATION_PAGE.phases} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {TRANSFORMATION_PAGE.phases.items.map((phase, index) => (
            <div key={phase.title} className={`${panel} p-6`}>
              <Eyebrow>0{index + 1}</Eyebrow>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{phase.title}</h3>
              <p className="mt-4 text-sm leading-6 text-ink-secondary">{phase.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <AITransformationDifferentiators />

      <Section container="wide" surface="raised">
        <SectionHeader eyebrow={TRANSFORMATION_PAGE.safeguards.eyebrow} title={TRANSFORMATION_PAGE.safeguards.title} subtitle={TRANSFORMATION_PAGE.safeguards.description} />
        <div className="grid gap-4 md:grid-cols-2">
          {TRANSFORMATION_PAGE.safeguards.items.map((item) => <div key={item} className="border-t border-line-subtle pt-4 text-sm leading-6 text-ink-secondary">{item}</div>)}
        </div>
      </Section>

      <Section id="simulator" container="wide" rhythm="compact">
        <div className={`${panel} grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center`}>
          <div className="max-w-2xl">
            <Eyebrow gradient="prism">{TRANSFORMATION_PAGE.simulator.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink">{TRANSFORMATION_PAGE.simulator.title}</h2>
            <p className="mt-4 text-base leading-7 text-ink-secondary">{TRANSFORMATION_PAGE.simulator.description}</p>
          </div>
          <Button href={TRANSFORMATION_PAGE.simulator.href} variant="secondary" showArrow>{TRANSFORMATION_PAGE.simulator.cta}</Button>
        </div>
      </Section>

      <Section id="assessment" container="wide">
        <div className="grid gap-10 border-y border-line-strong py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow gradient="regenerative">{TRANSFORMATION_PAGE.assessment.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink md:text-5xl">{TRANSFORMATION_PAGE.assessment.title}</h2>
            <p className="mt-5 text-base leading-7 text-ink-secondary">{TRANSFORMATION_PAGE.assessment.description}</p>
          </div>
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {TRANSFORMATION_PAGE.assessment.details.map((detail) => <div key={detail} className="border-t border-line-subtle pt-4 text-sm font-medium text-ink">{detail}</div>)}
            </div>
            <p className="mt-6 text-sm leading-6 text-ink-secondary">{TRANSFORMATION_PAGE.assessment.method}</p>
            <p className="mt-4 text-xs leading-5 text-ink-tertiary">{TRANSFORMATION_PAGE.assessment.privacy}</p>
            <Button href="/ai-readiness" className="mt-8" showArrow>{TRANSFORMATION_PAGE.assessment.cta}</Button>
          </div>
        </div>
      </Section>

      <Section id="discuss" container="wide" surface="raised">
        <EnterpriseInquiryForm {...TRANSFORMATION_PAGE.inquiry} />
      </Section>
    </EnterprisePageShell>
  )
}
