'use client'

import { useMemo } from 'react'
import { Section, SectionHeader } from '@/src/components/prism'
import { simulate } from '@/src/lib/simulator/engine'
import { LANDING_SERVICES } from '@/src/simulator-landing-services-content'
import { SAMPLE_INPUTS } from '../SamplePreview'
import { assessmentHref } from '../SimulatorActions'
import { OfferGallery } from '../OfferGallery'
import { WhyOutsideHelp } from '../WhyOutsideHelp'
import { ProblemSection } from './ProblemSection'
import { LessonsSection } from './LessonsSection'
import { WalkthroughSection } from './WalkthroughSection'
import { StepsSection } from './StepsSection'
import { ProofSection } from './ProofSection'
import { TeamFaqSection } from './TeamFaqSection'
import { FinalCta, focusSimulatorUrl } from './FinalCta'
import { StickyCtaBar } from './StickyCtaBar'

/** Everything below the hero while the visitor is still on the company step. */
export function SimulatorLanding() {
  const sample = useMemo(() => simulate(SAMPLE_INPUTS), [])
  return (
    <div className="mt-24 space-y-24 md:mt-32 md:space-y-32">
      <ProblemSection />
      <LessonsSection />
      <WalkthroughSection />
      <StepsSection onStart={focusSimulatorUrl} />
      <ProofSection />
      <section id="landing-services" className="scroll-mt-28 space-y-10">
        <SectionHeader eyebrow={LANDING_SERVICES.eyebrow} title={LANDING_SERVICES.title} subtitle={LANDING_SERVICES.sub} />
        <WhyOutsideHelp />
        <OfferGallery offers={sample.offers} currency="USD" assessmentHref={assessmentHref(sample)} />
      </section>
      <TeamFaqSection />
      <FinalCta />
      <StickyCtaBar />
    </div>
  )
}
