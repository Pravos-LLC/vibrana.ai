'use client'

import { useMemo } from 'react'
import { SectionHeader } from '@/src/components/prism'
import { simulate } from '@/src/lib/simulator/engine'
import { LANDING_SERVICES } from '@/src/simulator-landing-services-content'
import { SAMPLE_INPUTS } from '../SamplePreview'
import { assessmentHref } from '../SimulatorActions'
import { OfferGallery } from '../OfferGallery'
import { ProblemSection } from './ProblemSection'
import { LessonsSection } from './LessonsSection'
import { ScrollyRun } from './ScrollyRun'
import { ProofSection } from './ProofSection'
import { TeamFaqSection } from './TeamFaqSection'
import { FinalCta } from './FinalCta'
import { StickyCtaBar } from './StickyCtaBar'
import type { Sandbox } from './sandbox'

/**
 * Everything below the hero sandbox and the form while the visitor is still on the company step:
 * the scroll run, why it stalls with the sizzle reel, lessons, proof, services, team and FAQ.
 * The services block shows the offers only: its old stat cards repeated figures this page no longer
 * owns (BCG 70%, MIT 95%; deck stat ownership, plan S4 and X3). The result dashboard still shows them.
 */
export function SimulatorLanding({ onTakeOver }: { onTakeOver: (s: Sandbox) => void }) {
  const sample = useMemo(() => simulate(SAMPLE_INPUTS), [])
  return (
    <div className="mt-24 flex flex-col gap-24 md:mt-32 md:gap-32">
      <ScrollyRun onTakeOver={onTakeOver} />
      <ProblemSection />
      <LessonsSection />
      <ProofSection />
      <section id="landing-services" className="scroll-mt-28 space-y-10">
        <SectionHeader eyebrow={LANDING_SERVICES.eyebrow} title={LANDING_SERVICES.title} subtitle={LANDING_SERVICES.sub} />
        <OfferGallery offers={sample.offers} currency="USD" assessmentHref={assessmentHref(sample)} media={false} />
      </section>
      <TeamFaqSection />
      <FinalCta />
      <StickyCtaBar />
    </div>
  )
}
