import { Suspense } from 'react'
import { Check, X } from 'lucide-react'
import { SPRINT_FLOW } from '@/src/sprint-fit-content'
import Image from '@/src/components/PublicDemoImage'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { VibranaImage } from '@/src/components/imagery/VibranaImage'
import { ProblemSequence } from '@/src/components/landing'
import { PolaroidPhoto } from '@/src/components/prism'
import { landingMedia } from '@/src/landing-media'
import { LoopPlate } from '@/src/components/sprint/LoopPlate'
import { SprintApplicationForm } from '@/src/components/sprint/SprintApplicationForm'
import { SprintCta } from '@/src/components/sprint/SprintCta'
import { SPRINT_HERO_ID, SprintHero } from '@/src/components/sprint/SprintHero'
import { SprintLogoStrip } from '@/src/components/sprint/SprintLogoStrip'
import { SprintOutcomePlates } from '@/src/components/sprint/SprintOutcomePlates'
import { DeckScene, PilotScene, ShippedScene, VendorScene } from '@/src/components/sprint/SprintProblemScenes'
import { SprintStyles } from '@/src/components/sprint/SprintStyles'
import { SprintTimeline } from '@/src/components/sprint/SprintTimeline'
import { SprintWorkShowcase } from '@/src/components/sprint/SprintWorkShowcase'
import { StickyCtaBar } from '@/src/components/sprint/StickyCtaBar'
import { TrackedLink } from '@/src/components/sprint/TrackedLink'
import { MonoLabel, SprintHeading, textLink } from '@/src/components/sprint/ui'
import {
  SPRINT_DAYS,
  SPRINT_FAQ,
  SPRINT_FINAL,
  SPRINT_FIT,
  SPRINT_GUARANTEE,
  SPRINT_OUTCOMES,
  SPRINT_PRICING,
  SPRINT_PROBLEM,
  SPRINT_SCORECARD_URL,
  SPRINT_TEAM,
  SPRINT_TRACKS,
  SPRINT_TRACKS_SECTION,
  SPRINT_WORK,
  type SprintTrackCard,
} from '@/src/ai-build-sprint-content'

const FIT_CALL_ID = 'fit-call'
const PRICING_ID = 'pricing'

const SCENES = [<PilotScene key="pilot" />, <DeckScene key="deck" />, <VendorScene key="vendor" />]

function TrackImage({ track }: { track: SprintTrackCard }) {
  const sizes = '(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 22vw'
  if ('landing' in track.image) {
    const asset = landingMedia(track.image.landing)
    return <VibranaImage src={asset.path} alt={asset.alt} aspect="4 / 3" motion={false} sizes={sizes} />
  }
  return <VibranaImage id={track.image.imagery} aspect="4 / 3" motion={false} sizes={sizes} />
}

/** "On day 10:" set in ink, the rest in secondary. The string itself is unchanged. */
function DayTen({ text }: { text: string }) {
  const at = text.indexOf(':')
  return (
    <p className="type-sm text-ink-secondary" style={{ lineHeight: 1.5 }}>
      <span className="font-medium text-ink">{text.slice(0, at + 1)}</span>
      {text.slice(at + 1)}
    </p>
  )
}

export default function AIBuildSprintPage() {
  return (
    <EnterprisePageShell>
      <SprintStyles />
      <FunnelEvent name="sprint_landing_view" entry="sprint" />

      {/* 1. Hero: headline beside the factory reel (B1, B2) */}
      <SprintHero />

      {/* 2. Proof row, directly under the hero */}
      <SprintLogoStrip />

      {/* 3. Why AI stalls: the problem sequence (B5) */}
      <section aria-labelledby="sprint-problem-heading" className="border-y border-line-subtle bg-surface-raised px-6 pt-20 md:px-0 md:pt-28" data-testid="sprint-problem">
        {/* max-w-6xl with px-6 lines the heading up with the kit's pinned column. */}
        <div className="mx-auto max-w-6xl">
          <SprintHeading id="sprint-problem-heading" label={SPRINT_PROBLEM.eyebrow} heading={SPRINT_PROBLEM.heading} className="md:px-6" />
          <p className="sr-only">{SPRINT_PROBLEM.ariaSummary}</p>
          <div aria-hidden className="pb-20 pt-12 md:pb-10 md:pt-4">
            <ProblemSequence
              label={SPRINT_PROBLEM.heading}
              lines={SPRINT_PROBLEM.lines.map((text, i) => ({ text, visual: SCENES[i] }))}
              close={{ text: SPRINT_PROBLEM.close, visual: <ShippedScene /> }}
            />
          </div>
        </div>
      </section>

      {/* 4. What you get: three captioned plates (B6) */}
      <section aria-labelledby="sprint-outcomes-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <SprintHeading id="sprint-outcomes-heading" label={SPRINT_OUTCOMES.eyebrow} heading={SPRINT_OUTCOMES.heading}>
            <p className="mt-5 max-w-xl text-ink-secondary">{SPRINT_OUTCOMES.trackNote}</p>
          </SprintHeading>
          <div className="mt-12">
            <SprintOutcomePlates />
          </div>
          <MonoLabel className="mt-2">{SPRINT_WORK.recreatedNote}</MonoLabel>
        </div>
      </section>

      {/* 5. The 10 days: a pinned build log (B7) */}
      <section aria-label={SPRINT_DAYS.heading} className="border-y border-line-subtle bg-surface-raised">
        <SprintTimeline
          after={
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <SprintCta location="days" />
              <a href={`#${PRICING_ID}`} className={textLink}>
                {SPRINT_DAYS.pricingLink}
              </a>
            </div>
          }
        />
      </section>

      {/* 6. Four tracks (no prices) (B4) */}
      <section aria-labelledby="sprint-tracks-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <SprintHeading id="sprint-tracks-heading" label={SPRINT_TRACKS_SECTION.eyebrow} heading={SPRINT_TRACKS_SECTION.heading} />
          <div className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-4">
            {SPRINT_TRACKS.map((track) => (
              <article key={track.id} className="flex flex-col">
                <figure className="m-0">
                  <TrackImage track={track} />
                  <figcaption className="label-mono mt-3 text-ink-tertiary">{track.figCaption}</figcaption>
                </figure>
                <h3 className="mt-6 text-ink" style={{ fontSize: '1.375rem', lineHeight: 1.25 }}>
                  {track.name}
                </h3>
                <p className="mt-2 text-ink-secondary" style={{ lineHeight: 1.5 }}>
                  {track.outcome}
                </p>
                <div className="mt-4 border-t border-line pt-4">
                  <DayTen text={track.dayTen} />
                </div>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  <div className="flex flex-none -space-x-2">
                    {track.leads.map((lead) => (
                      <Image key={lead.name} src={lead.photo} alt="" width={40} height={40} className="h-10 w-10 rounded-full border-2 border-surface-base object-cover" />
                    ))}
                  </div>
                  <p className="type-sm text-ink" style={{ lineHeight: 1.35 }}>
                    {track.ledBy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Work and results: one product at a time (B3) */}
      <section aria-labelledby="sprint-work-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <SprintHeading id="sprint-work-heading" label={SPRINT_WORK.eyebrow} heading={SPRINT_WORK.heading} className="mb-12" />
          <SprintWorkShowcase />
        </div>
      </section>

      {/* 8. Who it's for / not for */}
      <section aria-labelledby="sprint-fit-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SprintHeading id="sprint-fit-heading" heading={SPRINT_FIT.heading} />
          <div className="grid gap-10 border-t border-line pt-8 md:grid-cols-2 md:gap-12">
            {[
              { label: SPRINT_FIT.forLabel, items: SPRINT_FIT.forYou, yes: true },
              { label: SPRINT_FIT.notForLabel, items: SPRINT_FIT.notForYou, yes: false },
            ].map((col) => (
              <div key={col.label}>
                <h3 className="text-ink" style={{ fontSize: '1.125rem', lineHeight: 1.3 }}>
                  {col.label}
                </h3>
                <ul className="mt-5 space-y-4">
                  {col.items.map((item) => (
                    <li key={item} className={col.yes ? 'flex items-start gap-3 leading-7 text-ink' : 'flex items-start gap-3 leading-7 text-ink-secondary'}>
                      {col.yes ? (
                        <Check className="mt-1.5 h-4 w-4 flex-none text-brand-emerald-strong" aria-hidden />
                      ) : (
                        <X className="mt-1.5 h-4 w-4 flex-none text-ink-tertiary" aria-hidden />
                      )}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. The people who build with you: a contact sheet */}
      <section aria-labelledby="sprint-team-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <SprintHeading id="sprint-team-heading" label={SPRINT_TEAM.eyebrow} heading={SPRINT_TEAM.heading} />
          <figure className="m-0 mt-12">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
              {SPRINT_TEAM.members.map((member) => (
                <li key={member.name} className="flex flex-col items-center text-center">
                  <PolaroidPhoto src={member.photo} alt={member.name} name={member.name} role={member.role} angle={member.angle} className="w-full max-w-[200px]" />
                  <p className="type-sm mt-5 max-w-60 text-ink-secondary">{member.line}</p>
                </li>
              ))}
            </ul>
            <figcaption className="label-mono mt-12 text-ink-tertiary">{SPRINT_TEAM.figCaption}</figcaption>
          </figure>
        </div>
      </section>

      {/* 10. Pricing: the only place prices appear (B8) */}
      <section id={PRICING_ID} aria-labelledby="sprint-pricing-heading" className="scroll-mt-20 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div>
              <SprintHeading id="sprint-pricing-heading" label={SPRINT_PRICING.eyebrow} heading={SPRINT_PRICING.heading} />
            </div>
            <div className="border-t border-line">
              <div className="grid gap-6 border-b border-line py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <div className="tabular font-display font-semibold text-ink" style={{ fontSize: 'clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem)', lineHeight: 1.02, letterSpacing: '-0.03em' }}>
                    {SPRINT_PRICING.price}
                  </div>
                  <p className="mt-3 text-ink-secondary">{SPRINT_PRICING.fixed}</p>
                </div>
                <SprintCta location="pricing" />
              </div>
              <dl className="grid sm:grid-cols-2">
                <div className="border-b border-line py-6 sm:border-r sm:pr-8">
                  <dt className="font-medium text-ink">{SPRINT_PRICING.triage.lead}</dt>
                  <dd className="type-sm mt-2 text-ink-secondary" style={{ lineHeight: 1.5 }}>
                    {SPRINT_PRICING.triage.body}
                  </dd>
                </div>
                <div className="border-b border-line py-6 sm:pl-8">
                  <dt className="font-medium text-ink">{SPRINT_PRICING.after.lead}</dt>
                  <dd className="type-sm mt-2 text-ink-secondary" style={{ lineHeight: 1.5 }}>
                    {SPRINT_PRICING.after.body}
                  </dd>
                </div>
              </dl>
              <MonoLabel className="mt-4">{SPRINT_PRICING.currency}</MonoLabel>
            </div>
          </div>

          {/* The guarantee: a signed-off certificate, not another text box */}
          <aside aria-labelledby="sprint-guarantee-heading" className="relative mt-16 overflow-hidden rounded-2xl border border-line-strong bg-surface-raised">
            <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-12">
              <span
                aria-hidden="true"
                className="tabular flex h-24 w-24 shrink-0 -rotate-12 items-center justify-center rounded-full border-2 border-ink font-display text-2xl font-semibold text-ink outline outline-1 outline-offset-4 outline-line-strong sm:h-28 sm:w-28 sm:text-3xl"
              >
                100%
              </span>
              <div>
                <MonoLabel className="mb-3">{SPRINT_GUARANTEE.eyebrow}</MonoLabel>
                <h3 id="sprint-guarantee-heading" className="text-balance text-ink" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)', lineHeight: 1.15 }}>
                  {SPRINT_GUARANTEE.heading}
                </h3>
              </div>
              <div className="space-y-4 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="type-sm text-ink-secondary" style={{ lineHeight: 1.55 }}>
                  {SPRINT_GUARANTEE.timeline}
                </p>
                <p className="type-sm font-medium text-ink" style={{ lineHeight: 1.55 }}>
                  {SPRINT_GUARANTEE.offer}
                </p>
                <p className="type-sm text-ink-secondary" style={{ lineHeight: 1.55 }}>
                  {SPRINT_GUARANTEE.conditions}
                </p>
              </div>
            </div>
          </aside>

          {/* Quieter ways in, each in its own cell */}
          <ul className="mt-10 grid border-t border-line md:grid-cols-3">
            <li className="border-b border-line py-6 md:border-r md:pr-8">
              <p className="type-sm text-ink-secondary">{SPRINT_PRICING.roi.prompt}</p>
              <TrackedLink href={SPRINT_PRICING.roi.href} event="sprint_roi_click" className={`${textLink} mt-1 inline-block`}>
                {SPRINT_PRICING.roi.link}
              </TrackedLink>
            </li>
            <li className="border-b border-line py-6 md:border-r md:px-8">
              <TrackedLink href="/ai-build-sprint/readiness" event="sprint_brief_click" className={`${textLink} inline-block`}>
                {SPRINT_FLOW.title}
              </TrackedLink>
            </li>
            <li className="border-b border-line py-6 md:pl-8">
              <p className="type-sm text-ink-secondary">{SPRINT_PRICING.scorecard.prompt}</p>
              <TrackedLink href={SPRINT_SCORECARD_URL} event="sprint_scorecard_click" className={`${textLink} mt-1 inline-block`}>
                {SPRINT_PRICING.scorecard.link}
              </TrackedLink>
            </li>
          </ul>
        </div>
      </section>

      {/* 11. FAQ (native details: answers stay in the HTML, no JS needed) */}
      <section aria-labelledby="sprint-faq-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div>
            <div className="lg:sticky lg:top-28">
              <SprintHeading id="sprint-faq-heading" heading={SPRINT_FAQ.heading} />
            </div>
          </div>
          <ol className="border-t border-line">
            {SPRINT_FAQ.items.map((item, i) => (
              <li key={item.question} className="border-b border-line">
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 rounded py-5 [&::-webkit-details-marker]:hidden">
                    <span className="label-mono tabular text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display font-semibold text-ink" style={{ fontSize: '1.125rem', lineHeight: 1.35 }}>
                      {item.question}
                    </span>
                    <span aria-hidden className="relative top-[-2px] h-4 w-4 self-center">
                      <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded-full bg-ink" />
                      <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-200 group-open:scale-y-0 motion-reduce:transition-none" />
                    </span>
                  </summary>
                  <div className="grid grid-cols-[2.5rem_1fr] gap-4 pb-6 pr-8">
                    <span aria-hidden />
                    <div className="leading-7 text-ink-secondary">
                      <p>{item.answer}</p>
                      {'source' in item && item.source && (
                        <a
                          href={item.source.href}
                          {...(item.source.href.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                          className={`${textLink} mt-3 inline-block`}
                        >
                          {item.source.label}
                        </a>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 12. Final CTA + the fit-call form */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <LoopPlate stem={SPRINT_FINAL.brollStem} aspect="16 / 9" />
            <blockquote className="mt-8 max-w-lg">
              <p className="font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {SPRINT_FINAL.quote}
              </p>
              <footer className="mt-4 text-sm text-ink-secondary">
                {SPRINT_FINAL.name}, {SPRINT_FINAL.role}
              </footer>
            </blockquote>
          </div>
          <div id={FIT_CALL_ID} className="scroll-mt-24">
            <Suspense fallback={null}>
              <SprintApplicationForm />
            </Suspense>
          </div>
        </div>
      </section>

      <StickyCtaBar heroId={SPRINT_HERO_ID} formId={FIT_CALL_ID} />
    </EnterprisePageShell>
  )
}
