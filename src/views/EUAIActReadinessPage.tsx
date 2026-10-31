'use client'

import Link from 'next/link'
import { BookOpenCheck, Compass, ListChecks } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { ClosingAssessment } from '@/src/components/enterprise/home/ClosingAssessment'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { trackCallClick } from '@/src/lib/funnel/client'
import { BrowserFrame, Button, Eyebrow, RevealGroup, RevealItem, Section } from '@/src/components/prism'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { LegalCite } from '@/src/components/eu-ai-act/LegalCite'
import { ComplianceTimeline, NextDatePanel } from '@/src/components/eu-ai-act/ComplianceTimeline'
import { RoleFlow, ReachPanel } from '@/src/components/eu-ai-act/CoverageVisuals'
import { RiskPyramid } from '@/src/components/eu-ai-act/RiskPyramid'
import { HighRiskBento } from '@/src/components/eu-ai-act/HighRiskBento'
import { PenaltyScale } from '@/src/components/eu-ai-act/PenaltyScale'
import { ClockChart } from '@/src/components/eu-ai-act/ClockChart'
import { ParallaxVideo } from '@/src/components/eu-ai-act/ParallaxVideo'
import { SectionScreens } from '@/src/components/eu-ai-act/SectionScreens'
import { getImagery } from '@/src/imagery-manifest'
import { EU_QUESTIONS, EU_SECTIONS } from '@/src/eu-ai-act-questions-content'
import {
  EU_CLOCK as CLOCK,
  EU_CLOSING as CLOSING,
  EU_COVERAGE as COVERAGE,
  EU_CTA as CTA,
  EU_DETAILS as DETAILS,
  EU_HERO as HERO,
  EU_METHOD as METHOD,
  EU_PENALTIES as PENALTIES,
  EU_SOURCE_LABELS as LABELS,
  EU_TIERS as TIERS,
  EU_TIMELINE as TIMELINE,
} from '@/src/eu-ai-act-readiness-content'

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'
const h2 = 'font-display text-3xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl'
const PRINCIPLE_ICONS = [BookOpenCheck, ListChecks, Compass]

export default function EUAIActReadinessPage() {
  const scene = getImagery(CLOSING.scene.id)
  const watch = getImagery(CLOCK.image.id)

  return (
    <EnterprisePageShell>
      <FunnelEvent name="eu_ai_act_landing_view" entry="eu-ai-act" />
      {/* ── Hero: the copy, and the EU flag against the sun with the next date over it ── */}
      <section className="px-6 pb-16 pt-28 md:pb-24 md:pt-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <RevealGroup>
            <RevealItem>
              <Eyebrow gradient="prism">{HERO.eyebrow}</Eyebrow>
            </RevealItem>
            <RevealItem>
              <h1 className="mt-6 font-display font-semibold leading-[1.04] tracking-tight text-ink" style={{ fontSize: 'clamp(2.25rem, 1.5rem + 2.6vw, 3.5rem)' }}>{HERO.headline}</h1>
            </RevealItem>
            <RevealItem>
              <div className="mt-6 max-w-xl text-lg leading-8 text-ink-secondary">{HERO.subtitle}</div>
            </RevealItem>
            <RevealItem className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button href={CTA.primary.href} showArrow>{CTA.primary.short}</Button>
              <Button href={CTA.secondary.href} variant="secondary" target="_blank" rel="noopener noreferrer" onClick={() => trackCallClick('eu-ai-act-hero')}>{CTA.secondary.label}</Button>
            </RevealItem>
          </RevealGroup>
          <RevealGroup className="relative lg:pl-20">
            <RevealItem>
              <ParallaxVideo
                name={HERO.media.video}
                priority
                sizes="(max-width: 1024px) 92vw, 40vw"
                className="aspect-[4/3] rounded-[28px] shadow-[0_30px_80px_-30px_rgba(0,51,153,0.45)] lg:aspect-[5/6]"
              />
            </RevealItem>
            <RevealItem className="relative -mt-20 px-4 sm:px-10 lg:absolute lg:-bottom-10 lg:-left-4 lg:mt-0 lg:w-[17.5rem] lg:px-0">
              <NextDatePanel
                compact
                milestones={TIMELINE.milestones}
                label={HERO.panel.label}
                daysLabel={HERO.panel.daysLabel}
                footnote={HERO.panel.footnote}
                className="bg-surface-base/92 p-5 shadow-[0_24px_60px_-28px_rgba(0,51,153,0.4)] backdrop-blur-xl md:p-6"
              />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── 1. Who the Act covers: the roles as a flow, then the reach over Brussels ── */}
      <Section container="wide" surface="raised">
        <h2 className={`${h2} max-w-3xl`}>{COVERAGE.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{COVERAGE.intro}</div>
        <div className="mt-12">
          <RoleFlow roles={COVERAGE.roles} flow={COVERAGE.flow} />
        </div>
        <div className="mt-14">
          <ReachPanel reach={COVERAGE.reach} />
        </div>
      </Section>

      {/* ── 1b. The tiers, then the four high-risk areas ── */}
      <Section container="wide">
        <h2 className={`${h2} max-w-3xl`}>{TIERS.heading}</h2>
        <div className="mt-12">
          <RiskPyramid tiers={TIERS.tiers} />
        </div>
        <div className="mt-24">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">{COVERAGE.highRisk.title}</h3>
          <div className="mt-3 max-w-2xl text-base leading-7 text-ink-secondary">{COVERAGE.highRisk.intro}</div>
          <div className="mt-8">
            <HighRiskBento items={COVERAGE.highRisk.items} />
          </div>
          <div className="mt-8 max-w-3xl border-l-2 border-brand-amber pl-5 text-sm leading-6 text-ink-secondary">
            {COVERAGE.highRisk.caveat}
            <LegalCite findings={COVERAGE.highRisk.caveatFindings} className="mt-1" />
          </div>
        </div>
      </Section>

      {/* ── 2. The dates ── */}
      <Section container="wide" surface="raised">
        <h2 className={`${h2} max-w-3xl`}>{TIMELINE.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{TIMELINE.intro}</div>
        <LegalCite findings={TIMELINE.introFindings} className="mt-2" />
        <div className="mt-12">
          <ComplianceTimeline milestones={TIMELINE.milestones} todayLabel={TIMELINE.todayLabel} />
        </div>
      </Section>

      {/* ── 3. Penalties: the Commission's flags beside the caps, drawn to scale ── */}
      <Section container="wide">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <h2 className={h2}>{PENALTIES.heading}</h2>
            <div className="mt-5 max-w-md text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{PENALTIES.intro}</div>
            <ParallaxVideo name={PENALTIES.video} sizes="(max-width: 1024px) 92vw, 30vw" className="mt-10 hidden aspect-[4/5] max-w-sm rounded-2xl lg:block" />
          </div>
          <div className="lg:pt-4">
            <PenaltyScale tiers={PENALTIES.tiers} orLabel={PENALTIES.orLabel} shareLabel={PENALTIES.shareLabel} />
          </div>
        </div>
        <div className={`${panel} mt-16 p-6 md:p-8`}>
          <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{PENALTIES.size.title}</h3>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {PENALTIES.size.items.map((i) => (
              <div key={i.label}>
                <h4 className="font-display text-lg font-semibold text-ink">{i.label}</h4>
                <div className="mt-2 text-sm leading-6 text-ink-secondary">{i.body}</div>
                <LegalCite findings={i.findings} className="mt-2" />
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm leading-6 text-ink">{PENALTIES.size.note}</div>
        </div>
      </Section>

      {/* ── 4. The enforcement clock (draft) ── */}
      <Section container="wide" surface="overlay">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>{CLOCK.eyebrow}</Eyebrow>
            <h2 className={`${h2} mt-5`}>{CLOCK.heading}</h2>
            {watch && <ParallaxMedia src={watch.file} alt={CLOCK.image.alt} aspect="4 / 3" sizes="(max-width: 1024px) 92vw, 36vw" className="mt-10" />}
          </div>
          <div className="space-y-6 lg:pt-2">
            {CLOCK.body.map((p) => (
              <div key={p.text}>
                <div className="text-base leading-7 text-ink md:text-lg md:leading-8">{p.text}</div>
                <LegalCite findings={p.findings} className="mt-1.5" />
              </div>
            ))}
            <div className="border-l-2 border-eu-ink pl-5 font-display text-xl leading-8 text-ink">{CLOCK.takeaway}</div>
          </div>
        </div>
        <div className="mt-14">
          <ClockChart chart={CLOCK.chart} />
        </div>
      </Section>

      {/* ── 5. What the assessment checks: a sticky screen that follows the section in view ── */}
      <Section container="wide">
        <h2 className={`${h2} max-w-3xl`}>{METHOD.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{METHOD.intro}</div>
        <SectionScreens
          {...METHOD.screenshotSize}
          items={METHOD.sections.map((m) => ({
            key: m.key,
            title: EU_SECTIONS.find((s) => s.key === m.key)!.title,
            meta: METHOD.questionsLabel(EU_QUESTIONS[m.key].length),
            body: m.asks,
            screenshot: m.screenshot,
          }))}
        />
        <div className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8">
          {METHOD.principles.map((p, i) => {
            const Icon = PRINCIPLE_ICONS[i] ?? BookOpenCheck
            return (
              <div key={p.title}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-eu-ink/8 text-eu-ink ring-1 ring-eu-ink/15">
                  <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
                <div className="mt-2 text-sm leading-6 text-ink-secondary">{p.body}</div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── 6. What you get: a real completed result ── */}
      <Section container="wide" surface="raised">
        <h2 className={`${h2} max-w-3xl`}>{DETAILS.heading}</h2>
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="space-y-10">
            {DETAILS.blocks.map((b) => (
              <div key={b.title}>
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{b.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-ink-secondary">
                      <span aria-hidden className="mt-2.5 h-1 w-3 flex-none rounded-full bg-eu-ink/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="text-sm text-ink">
              {DETAILS.disclaimer}{' '}
              <Link href={DETAILS.privacyLink.href} className="font-medium text-brand-violet-strong hover:underline">
                {DETAILS.privacyLink.label}
              </Link>
            </div>
          </div>
        <BrowserFrame {...DETAILS.screenshot} aspect="4 / 5" sizes="(max-width: 1024px) 92vw, 55vw" className="order-first lg:order-none lg:sticky lg:top-28" />
        </div>
      </Section>

      {/* ── Closing ── */}
      <Section container="full">
        <ClosingAssessment
          eyebrow={CLOSING.eyebrow}
          title={CLOSING.title}
          body={CLOSING.body}
          primaryCta={{ text: CTA.primary.label, href: CTA.primary.href }}
          secondaryCta={{ text: CTA.secondary.label, href: CTA.secondary.href }}
          onSecondaryClick={() => trackCallClick('eu-ai-act-closing')}
          scene={{ src: scene?.file ?? '', alt: CLOSING.scene.alt }}
          screenshot={CLOSING.screenshot}
        />
        <div className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-ink-tertiary">{LABELS.ledgerNote}</div>
      </Section>
    </EnterprisePageShell>
  )
}
