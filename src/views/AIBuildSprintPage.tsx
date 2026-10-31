import { Suspense } from 'react'
import { SPRINT_FLOW } from '@/src/sprint-fit-content'
import Image from '@/src/components/PublicDemoImage'
import { Check, X } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { VibranaImage } from '@/src/components/imagery/VibranaImage'
import { InsurtechLiveCallQa, InsurtechUnifiedInbox, ProptechKnowledgeStudio, ProptechUnifiedInbox } from '@/src/components/product-mocks'
import { Eyebrow, PolaroidPhoto, Reveal, Section } from '@/src/components/prism'
import { LogoRow } from '@/src/components/proof/LogoRow'
import { FittedMock } from '@/src/components/sprint/FittedMock'
import { RepoMock } from '@/src/components/sprint/RepoMock'
import { SprintApplicationForm } from '@/src/components/sprint/SprintApplicationForm'
import { SprintCta } from '@/src/components/sprint/SprintCta'
import { SPRINT_HERO_ID, SprintHero } from '@/src/components/sprint/SprintHero'
import { SprintTimeline } from '@/src/components/sprint/SprintTimeline'
import { StickyCtaBar } from '@/src/components/sprint/StickyCtaBar'
import { TrackedLink } from '@/src/components/sprint/TrackedLink'
import {
  SPRINT_CREDITS,
  SPRINT_DAYS,
  SPRINT_FAQ,
  SPRINT_FINAL,
  SPRINT_FIT,
  SPRINT_OUTCOMES,
  SPRINT_PRICING,
  SPRINT_PROBLEM,
  SPRINT_REPO_MOCK,
  SPRINT_SCORECARD_URL,
  SPRINT_TEAM,
  SPRINT_TRACKS,
  SPRINT_TRACKS_SECTION,
  SPRINT_WORK,
  type SprintOutcomeVisual,
  type SprintWorkMock,
} from '@/src/ai-build-sprint-content'

const FIT_CALL_ID = 'fit-call'
const PRICING_ID = 'pricing'

const h2 = 'text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink md:text-5xl'
const textLink =
  'rounded text-sm font-medium text-ink-secondary underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink'

function OutcomeVisual({ visual }: { visual: SprintOutcomeVisual }) {
  if (visual === 'product') return <FittedMock url={SPRINT_OUTCOMES.mockUrls.product}><InsurtechUnifiedInbox /></FittedMock>
  if (visual === 'team') return <FittedMock url={SPRINT_OUTCOMES.mockUrls.team}><ProptechKnowledgeStudio /></FittedMock>
  return <FittedMock url={SPRINT_REPO_MOCK.url}><RepoMock /></FittedMock>
}

function WorkVisual({ mock, url }: { mock: SprintWorkMock; url: string }) {
  return <FittedMock url={url}>{mock === 'insurtech-call-qa' ? <InsurtechLiveCallQa /> : <ProptechUnifiedInbox />}</FittedMock>
}

function SectionIntro({ eyebrow, heading, lead, className }: { eyebrow?: string; heading: string; lead?: string; className?: string }) {
  return (
    <Reveal y={24} className={className ?? 'mx-auto mb-14 max-w-3xl text-center md:mb-16'}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className={h2}>{heading}</h2>
      {lead && <p className="type-sm mx-auto mt-5 max-w-xl text-ink-secondary">{lead}</p>}
    </Reveal>
  )
}

export default function AIBuildSprintPage() {
  return (
    <EnterprisePageShell>
      <FunnelEvent name="sprint_landing_view" entry="sprint" />

      {/* 1. Hero */}
      <SprintHero />

      {/* 2. Proof row, directly under the hero */}
      <section className="pb-20 pt-6 text-center md:pb-24 md:pt-4">
        <LogoRow />
      </section>

      {/* 3. Problem */}
      <Section container="prose" surface="raised" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_PROBLEM.eyebrow} heading={SPRINT_PROBLEM.heading} className="mx-auto mb-12 max-w-3xl text-center" />
        <ul className="mx-auto max-w-2xl space-y-5 text-center">
          {SPRINT_PROBLEM.lines.map((line, i) => (
            <Reveal key={line} as="li" y={16} delay={i * 0.08} className="font-display text-xl leading-snug tracking-tight text-ink-secondary md:text-2xl">
              {line}
            </Reveal>
          ))}
        </ul>
        <Reveal y={16} delay={0.3}>
          <p className="type-xl mx-auto mt-12 max-w-2xl text-center font-display font-semibold leading-snug! tracking-tight text-ink">
            {SPRINT_PROBLEM.close}
          </p>
        </Reveal>
      </Section>

      {/* 4. What you walk away with */}
      <Section container="full" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_OUTCOMES.eyebrow} heading={SPRINT_OUTCOMES.heading} lead={SPRINT_OUTCOMES.trackNote} />
        <div className="grid gap-14 md:grid-cols-3 md:gap-8">
          {SPRINT_OUTCOMES.cards.map((card, i) => (
            <Reveal key={card.title} y={24} delay={i * 0.08}>
              <OutcomeVisual visual={card.visual} />
              <h3 className="mt-8 font-display text-xl font-semibold leading-snug tracking-tight text-ink">{card.title}</h3>
              <p className="mt-2 max-w-sm text-ink-secondary">{card.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 5. The 10 days */}
      <Section container="full" surface="raised" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_DAYS.eyebrow} heading={SPRINT_DAYS.heading} />
        <SprintTimeline />
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <SprintCta location="days" />
          <a href={`#${PRICING_ID}`} className={textLink}>
            {SPRINT_DAYS.pricingLink}
          </a>
        </div>
      </Section>

      {/* 6. Four tracks (no prices) */}
      <Section container="full" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_TRACKS_SECTION.eyebrow} heading={SPRINT_TRACKS_SECTION.heading} />
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {SPRINT_TRACKS.map((track, i) => (
            <Reveal key={track.id} y={24} delay={i * 0.06} className="flex flex-col">
              <VibranaImage id={track.imageId} aspect="4 / 3" motion={false} sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw" />
              <h3 className="mt-6 font-display text-xl font-semibold leading-snug tracking-tight text-ink">{track.name}</h3>
              <p className="mt-2 text-ink-secondary">{track.outcome}</p>
              <div className="mt-auto flex items-center gap-3 pt-5">
                <div className="flex flex-none -space-x-2">
                  {track.leads.map((lead) => (
                    <Image key={lead.name} src={lead.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <p className="type-sm leading-snug! text-ink">{track.ledBy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 7. Work and results */}
      <Section container="full" surface="raised" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_WORK.eyebrow} heading={SPRINT_WORK.heading} />
        <div className="grid gap-16 md:grid-cols-2 md:gap-10">
          {SPRINT_WORK.cards.map((card, i) => (
            <Reveal key={card.href} y={24} delay={i * 0.08}>
              <WorkVisual mock={card.mock} url={card.mockUrl} />
              <Eyebrow className="mt-10">{card.tag}</Eyebrow>
              <div className="type-4xl mt-3 font-display font-semibold leading-tight tracking-tight text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {card.metric}
              </div>
              <p className="mt-1 font-medium text-ink">{card.metricLabel}</p>
              <p className="mt-4 max-w-md text-ink-secondary">{card.body}</p>
              <TrackedLink href={card.href} event="sprint_case_study_click" className="btn-secondary mt-5">
                {SPRINT_WORK.linkLabel}
              </TrackedLink>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 8. Who it's for / not for */}
      <Section container="wide" rhythm="none" className="py-20 md:py-32">
        <SectionIntro heading={SPRINT_FIT.heading} />
        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{SPRINT_FIT.forLabel}</h3>
            <ul className="mt-5 space-y-4">
              {SPRINT_FIT.forYou.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-7 text-ink">
                  <Check className="mt-1.5 h-4 w-4 flex-none text-brand-emerald-strong" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">{SPRINT_FIT.notForLabel}</h3>
            <ul className="mt-5 space-y-4">
              {SPRINT_FIT.notForYou.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-7 text-ink-secondary">
                  <X className="mt-1.5 h-4 w-4 flex-none text-ink-tertiary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* 9. The people who build with you */}
      <Section container="full" surface="raised" rhythm="none" className="py-20 md:py-32">
        <SectionIntro eyebrow={SPRINT_TEAM.eyebrow} heading={SPRINT_TEAM.heading} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
          {SPRINT_TEAM.members.map((member, i) => (
            <Reveal key={member.name} y={20} delay={i * 0.05} className="flex flex-col items-center text-center">
              <PolaroidPhoto src={member.photo} alt={member.name} name={member.name} role={member.role} angle={member.angle} className="w-full max-w-[200px]" />
              <p className="type-sm mt-5 max-w-60 text-ink-secondary">{member.line}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 10. Pricing: the only place prices appear */}
      <Section id={PRICING_ID} container="prose" rhythm="none" className="scroll-mt-20 py-20 md:py-32">
        <Reveal y={24} className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-4">{SPRINT_PRICING.eyebrow}</Eyebrow>
          <h2 className={h2}>{SPRINT_PRICING.heading}</h2>
          <div className="type-4xl mt-10 font-display font-semibold leading-tight tracking-tight text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {SPRINT_PRICING.price}
          </div>
          <p className="type-lg mt-4 text-ink-secondary">{SPRINT_PRICING.fixed}</p>
          <SprintCta location="pricing" className="mt-8" />
        </Reveal>

        <div className="mx-auto mt-14 max-w-xl space-y-4 text-center">
          <div className="rounded-2xl border border-line-subtle bg-surface-raised px-6 py-5">
            <p className="type-sm text-ink">
              <span className="font-semibold">{SPRINT_PRICING.triage.lead}</span> {SPRINT_PRICING.triage.body}
            </p>
          </div>
          <p className="type-sm text-ink-secondary">
            <span className="font-medium text-ink">{SPRINT_PRICING.after.lead}</span> {SPRINT_PRICING.after.body}
          </p>
          <p className="type-xs text-ink-secondary">{SPRINT_PRICING.currency}</p>
          <p className="type-sm pt-4 text-ink-secondary">
            {SPRINT_PRICING.roi.prompt}{' '}
            <TrackedLink href={SPRINT_PRICING.roi.href} event="sprint_roi_click" className={textLink}>
              {SPRINT_PRICING.roi.link}
            </TrackedLink>
          </p>
          <p className="type-sm pt-4 text-ink-secondary">
            <TrackedLink href="/ai-build-sprint/readiness" event="sprint_brief_click" className={textLink}>
              {SPRINT_FLOW.title}
            </TrackedLink>
          </p>
          <p className="type-sm pt-4 text-ink-secondary">
            {SPRINT_PRICING.scorecard.prompt}{' '}
            <TrackedLink href={SPRINT_SCORECARD_URL} event="sprint_scorecard_click" className={textLink}>
              {SPRINT_PRICING.scorecard.link}
            </TrackedLink>
          </p>
        </div>
      </Section>

      {/* 11. FAQ (native details: answers stay in the HTML, no JS needed) */}
      <Section container="prose" surface="raised" rhythm="none" className="py-20 md:py-32">
        <SectionIntro heading={SPRINT_FAQ.heading} />
        <div className="mx-auto max-w-3xl between:border-t between:border-line-subtle border-y border-line-subtle">
          {SPRINT_FAQ.items.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded py-5 font-display text-lg font-semibold leading-snug text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden className="relative h-4 w-4 flex-none">
                  <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded-full bg-ink" />
                  <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-200 group-open:scale-y-0 motion-reduce:transition-none" />
                </span>
              </summary>
              <div className="pb-6 pr-10 text-base leading-7 text-ink-secondary">
                <p>{item.answer}</p>
                {'source' in item && item.source && (
                  <a href={item.source.href} {...(item.source.href.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })} className={`${textLink} mt-3 inline-block`}>
                    {item.source.label}
                  </a>
                )}
              </div>
            </details>
          ))}
        </div>
      </Section>

      {/* 12. Final CTA + the fit-call form */}
      <Section container="full" rhythm="none" className="py-20 md:py-32">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal y={24}>
            <div className="relative pb-16">
              <VibranaImage id="sprint-cta-solar" aspect="16 / 9" motion={false} hover={false} sizes="(max-width: 1024px) 90vw, 45vw" />
              <PolaroidPhoto
                src={SPRINT_FINAL.photo}
                alt={SPRINT_FINAL.name}
                name={SPRINT_FINAL.name}
                role={SPRINT_FINAL.role}
                angle={-4}
                className="absolute -bottom-2 right-3 w-28 sm:right-8 sm:w-44"
              />
            </div>
            <blockquote className="mt-6 max-w-lg">
              <p className="type-2xl font-display font-semibold leading-snug! tracking-tight text-ink">{SPRINT_FINAL.quote}</p>
              <footer className="mt-4 text-sm text-ink-secondary">
                {SPRINT_FINAL.name}, {SPRINT_FINAL.role}
              </footer>
            </blockquote>
          </Reveal>
          <div id={FIT_CALL_ID} className="scroll-mt-24">
            <Suspense fallback={null}>
              <SprintApplicationForm />
            </Suspense>
          </div>
        </div>
      </Section>

      {/* Image credit (the hourglass is CC BY 2.0) */}
      <div className="px-6 pb-10">
        <p className="type-xs mx-auto max-w-7xl text-ink-secondary">
          {SPRINT_CREDITS.prefix}{' '}
          <a href={SPRINT_CREDITS.workHref} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            {SPRINT_CREDITS.work}
          </a>{' '}
          {SPRINT_CREDITS.by} {SPRINT_CREDITS.author},{' '}
          <a href={SPRINT_CREDITS.licenseHref} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            {SPRINT_CREDITS.license}
          </a>
          , {SPRINT_CREDITS.note}.
        </p>
      </div>

      <StickyCtaBar heroId={SPRINT_HERO_ID} formId={FIT_CALL_ID} />
    </EnterprisePageShell>
  )
}
