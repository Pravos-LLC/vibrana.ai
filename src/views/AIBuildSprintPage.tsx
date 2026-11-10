import { Suspense } from 'react'
import { Check, X } from 'lucide-react'
import Image from '@/src/components/PublicDemoImage'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { PolaroidPhoto } from '@/src/components/prism'
import { LoopPlate } from '@/src/components/sprint/LoopPlate'
import { SprintApplicationForm } from '@/src/components/sprint/SprintApplicationForm'
import { SprintCtaPair } from '@/src/components/sprint/SprintCta'
import { GuaranteeStamp } from '@/src/components/sprint/GuaranteeStamp'
import { ProblemZ } from '@/src/components/sprint/problem/ProblemZ'
import { Reveal, RevealStack } from '@/src/components/sprint/motion'
import { SprintWaysIn } from '@/src/components/sprint/SprintWaysIn'
import { TrackMedia } from '@/src/components/sprint/TrackMedia'
import { SPRINT_HERO_ID, SprintHero } from '@/src/components/sprint/SprintHero'
import { SprintLogoStrip } from '@/src/components/sprint/SprintLogoStrip'
import { SprintOutcomePlates } from '@/src/components/sprint/SprintOutcomePlates'
import { SprintStyles } from '@/src/components/sprint/SprintStyles'
import { SprintTimeline } from '@/src/components/sprint/SprintTimeline'
import { SprintWorkShowcase } from '@/src/components/sprint/SprintWorkShowcase'
import { StickyCtaBar } from '@/src/components/sprint/StickyCtaBar'
import { AccentedHeading, MonoLabel, SprintHeading, textLink } from '@/src/components/sprint/ui'
import {
  SPRINT_DAYS,
  SPRINT_FAQ,
  SPRINT_FINAL,
  SPRINT_FIT,
  SPRINT_GUARANTEE,
  SPRINT_OUTCOMES,
  SPRINT_PRICING,
  SPRINT_PROBLEM,
  SPRINT_TEAM,
  SPRINT_TRACKS,
  SPRINT_TRACKS_SECTION,
  SPRINT_WORK,
} from '@/src/ai-build-sprint-content'

const FIT_CALL_ID = 'fit-call'
const PRICING_ID = 'pricing'

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

      {/* 1. Hero: headline beside the Build Sprint film */}
      <SprintHero />

      {/* 2. Proof row, directly under the hero */}
      <Reveal>
        <SprintLogoStrip />
      </Reveal>

      {/* 3. Why AI stalls: a Z path that leads the eye across the page and back down */}
      <ProblemZ heading={<AccentedHeading heading={SPRINT_PROBLEM.heading} accent={SPRINT_PROBLEM.accent} />} />

      {/* 4. What you get: three plates */}
      <section aria-labelledby="sprint-outcomes-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SprintHeading id="sprint-outcomes-heading" label={SPRINT_OUTCOMES.eyebrow} heading={SPRINT_OUTCOMES.heading} accent={SPRINT_OUTCOMES.accent}>
              <p className="mt-5 max-w-xl text-ink-secondary">{SPRINT_OUTCOMES.trackNote}</p>
            </SprintHeading>
          </Reveal>
          <div className="mt-14">
            <SprintOutcomePlates />
          </div>
        </div>
      </section>

      {/* 5. The 10 days: four phases, each with its own loop; click any day */}
      <section aria-labelledby="sprint-days-heading" className="border-y border-line-subtle bg-surface-raised">
        <SprintTimeline
          after={
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <SprintCtaPair location="days" />
              <a href={`#${PRICING_ID}`} className={textLink}>
                {SPRINT_DAYS.pricingLink}
              </a>
            </div>
          }
        />
      </section>

      {/* 6. Four tracks, led by the people who deliver them */}
      <section aria-labelledby="sprint-tracks-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SprintHeading id="sprint-tracks-heading" label={SPRINT_TRACKS_SECTION.eyebrow} heading={SPRINT_TRACKS_SECTION.heading} accent={SPRINT_TRACKS_SECTION.accent} />
          </Reveal>
          <RevealStack className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-4" stagger={0.14}>
            {SPRINT_TRACKS.map((track) => (
              <Reveal variant="item" key={track.id}>
                <article className="flex h-full flex-col">
                  <TrackMedia track={track} />
                  <h3 className="mt-6 text-ink" style={{ fontSize: '1.375rem', lineHeight: 1.25 }}>
                    {track.name}
                  </h3>
                  <p className="mt-2 text-ink-secondary xl:min-h-[4.5rem]" style={{ lineHeight: 1.5 }}>
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
              </Reveal>
            ))}
          </RevealStack>
        </div>
      </section>

      {/* 7. Work and outcomes: one product at a time */}
      <section aria-labelledby="sprint-work-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12">
            <SprintHeading id="sprint-work-heading" label={SPRINT_WORK.eyebrow} heading={SPRINT_WORK.heading} accent={SPRINT_WORK.accent} />
          </Reveal>
          <Reveal delay={0.1}>
            <SprintWorkShowcase />
          </Reveal>
        </div>
      </section>

      {/* 8. Who it's for / not for */}
      <section aria-labelledby="sprint-fit-heading" className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <Reveal>
            <SprintHeading id="sprint-fit-heading" heading={SPRINT_FIT.heading} accent={SPRINT_FIT.accent} />
          </Reveal>
          <RevealStack className="grid gap-10 border-t border-line pt-8 md:grid-cols-2 md:gap-12" stagger={0.18} delay={0.15}>
            {[
              { label: SPRINT_FIT.forLabel, items: SPRINT_FIT.forYou, yes: true },
              { label: SPRINT_FIT.notForLabel, items: SPRINT_FIT.notForYou, yes: false },
            ].map((col) => (
              <Reveal variant="item" key={col.label}>
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
              </Reveal>
            ))}
          </RevealStack>
        </div>
      </section>

      {/* 9. The people who build with you: a contact sheet */}
      <section aria-labelledby="sprint-team-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SprintHeading id="sprint-team-heading" label={SPRINT_TEAM.eyebrow} heading={SPRINT_TEAM.heading} accent={SPRINT_TEAM.accent} />
          </Reveal>
          <RevealStack as="ul" className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5" stagger={0.12}>
            {SPRINT_TEAM.members.map((member) => (
              <Reveal as="li" variant="item" key={member.name} className="flex flex-col items-center text-center">
                <PolaroidPhoto src={member.photo} alt={member.name} name={member.name} role={member.role} angle={member.angle} className="w-full max-w-[200px]" />
                <p className="type-sm mt-5 max-w-60 text-ink-secondary">{member.line}</p>
              </Reveal>
            ))}
          </RevealStack>
        </div>
      </section>

      {/* 10. Pricing: the only place prices appear */}
      <section id={PRICING_ID} aria-labelledby="sprint-pricing-heading" className="scroll-mt-20 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <Reveal>
              <SprintHeading id="sprint-pricing-heading" label={SPRINT_PRICING.eyebrow} heading={SPRINT_PRICING.heading} accent={SPRINT_PRICING.accent} />
            </Reveal>
            <Reveal delay={0.12}>
              <div className="border-t border-line">
                <div className="grid gap-6 border-b border-line py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div>
                    <div className="tabular font-display font-semibold text-ink" style={{ fontSize: 'clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem)', lineHeight: 1.02, letterSpacing: '-0.03em' }}>
                      {SPRINT_PRICING.price}
                    </div>
                    <p className="mt-3 text-ink-secondary">{SPRINT_PRICING.fixed}</p>
                  </div>
                  <SprintCtaPair location="pricing" className="sm:justify-end" />
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
            </Reveal>
          </div>

          {/* The guarantee: a stamp, not another text box */}
          <Reveal className="mt-16">
            <aside aria-labelledby="sprint-guarantee-heading" className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface-raised">
              <div aria-hidden className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side, #22c55e, #3b82f6 70%, transparent)' }} />
              <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center lg:gap-12">
                <GuaranteeStamp className="mx-auto h-40 w-40 shrink-0 sm:h-48 sm:w-48" />
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
          </Reveal>
        </div>
      </section>

      {/* 11. FAQ (native details: answers stay in the HTML, no JS needed) */}
      <section aria-labelledby="sprint-faq-heading" className="border-y border-line-subtle bg-surface-raised px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <div>
            <Reveal className="lg:sticky lg:top-28">
              <SprintHeading id="sprint-faq-heading" heading={SPRINT_FAQ.heading} accent={SPRINT_FAQ.accent} />
            </Reveal>
          </div>
          <RevealStack as="ol" className="border-t border-line" stagger={0.08}>
            {SPRINT_FAQ.items.map((item, i) => (
              <Reveal as="li" variant="item" key={item.question} className="border-b border-line">
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
              </Reveal>
            ))}
          </RevealStack>
        </div>
      </section>

      {/* 12. Ways in before a call: the sprint brief leads */}
      <section aria-label="Ways to start" className="px-6 pt-20 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <SprintWaysIn />
        </div>
      </section>

      {/* 13. Final CTA + the fit-call form */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-start gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <Reveal>
            <LoopPlate stem={SPRINT_FINAL.brollStem} aspect="16 / 9" />
            <blockquote className="mt-8 max-w-lg">
              <p className="font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                {SPRINT_FINAL.quote}
              </p>
              <footer className="mt-4 text-sm text-ink-secondary">
                {SPRINT_FINAL.name}, {SPRINT_FINAL.role}
              </footer>
            </blockquote>
          </Reveal>
          <Reveal delay={0.12}>
            <div id={FIT_CALL_ID} className="scroll-mt-24">
              <Suspense fallback={null}>
                <SprintApplicationForm />
              </Suspense>
            </div>
          </Reveal>
        </div>
      </section>

      <StickyCtaBar heroId={SPRINT_HERO_ID} formId={FIT_CALL_ID} />
    </EnterprisePageShell>
  )
}
