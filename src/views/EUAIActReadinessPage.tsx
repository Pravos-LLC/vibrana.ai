'use client'

import Link from 'next/link'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { trackCallClick } from '@/src/lib/funnel/client'
import { Button } from '@/src/components/prism'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { ReelStage } from '@/src/components/landing'
import { landingVideo } from '@/src/landing-media'
import { LegalCite } from '@/src/components/eu-ai-act/LegalCite'
import { ComplianceTimeline } from '@/src/components/eu-ai-act/ComplianceTimeline'
import { RoleFlow, ReachPanel } from '@/src/components/eu-ai-act/CoverageVisuals'
import { RiskPyramid } from '@/src/components/eu-ai-act/RiskPyramid'
import { HighRiskBento } from '@/src/components/eu-ai-act/HighRiskBento'
import { PenaltyScale } from '@/src/components/eu-ai-act/PenaltyScale'
import { ClockChart } from '@/src/components/eu-ai-act/ClockChart'
import { SectionScreens } from '@/src/components/eu-ai-act/SectionScreens'
import { ColumnGuides, H2_CLASS, H2_STYLE, InstrumentColumn, InstrumentSection, LEAD_CLASS, LEAD_STYLE } from '@/src/components/eu-ai-act/instrument/Grid'
import { CountdownNotice, useLiveToday } from '@/src/components/eu-ai-act/instrument/CountdownNotice'
import { ReportHero } from '@/src/components/eu-ai-act/instrument/ReportHero'
import { ReportInstruments } from '@/src/components/eu-ai-act/instrument/ReportInstruments'
import { LandingLoop } from '@/src/components/eu-ai-act/instrument/LandingLoop'
import { useSampleReport } from '@/src/components/eu-ai-act/instrument/sample'
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
  EU_TABS as TABS,
  EU_TIERS as TIERS,
  EU_TIMELINE as TIMELINE,
} from '@/src/eu-ai-act-readiness-content'

/** m:ss from the encoded file's own duration, never typed. */
const runningTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** The headline with its closing words in the serif italic accent; the text is unchanged. */
function Headline() {
  const cut = HERO.headline.lastIndexOf(HERO.headlineAccent)
  return (
    <h1
      className="max-w-[24ch] font-display font-semibold text-ink"
      style={{ fontSize: 'clamp(2.25rem, 1.35rem + 3vw, 4.25rem)', lineHeight: 1.08, letterSpacing: '-0.035em' }}
    >
      {HERO.headline.slice(0, cut)}
      <span className="font-serif-accent pr-[0.06em]">{HERO.headlineAccent}</span>
    </h1>
  )
}

/**
 * /eu-ai-act-readiness in the Regulatory Instrument style: the page sits in one ruled column,
 * each section opens on a hairline with its mono tab, and the instrument leads: the countdown to
 * the next date in the Act and the sample report itself. Motion measures (a gauge settling, bars
 * drawing to today, slabs stacking, digits rolling); nothing performs.
 */
export default function EUAIActReadinessPage({ today: renderDay }: { today: string }) {
  const today = useLiveToday(renderDay)
  const report = useSampleReport(today)
  const watch = getImagery(CLOCK.image.id)
  const loop = landingVideo(HERO.reel.loopStem)
  const full = landingVideo(HERO.reel.fullStem)

  return (
    <EnterprisePageShell>
      <FunnelEvent name="eu_ai_act_landing_view" entry="eu-ai-act" />
      <div className="pt-20 md:pt-24">
        <InstrumentColumn>
          {/* ── Hero: the question, the countdown, and the report as the object ── */}
          <section aria-labelledby="eu-hero-title" className="relative overflow-hidden border-t border-line-subtle bg-surface-base">
            <ColumnGuides />
            <div className="relative px-6 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 2xl:px-14">
              <p className="label-mono text-ink-secondary">{HERO.kicker}</p>
              <div className="mt-8 border-t border-line pt-6">
                <p className="type-sm font-medium text-eu-ink" style={{ fontSize: 15 }}>
                  {HERO.eyebrow}
                </p>
                <div id="eu-hero-title" className="mt-3">
                  <Headline />
                </div>
              </div>

              <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_520px] xl:grid-cols-[minmax(0,1fr)_832px] xl:gap-8">
                <div className="flex min-w-0 flex-col gap-8">
                  <p className={LEAD_CLASS} style={LEAD_STYLE}>
                    {HERO.subtitle}
                  </p>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button href={CTA.primary.href} showArrow>
                      {CTA.primary.short}
                    </Button>
                    <a
                      href={CTA.secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackCallClick('eu-ai-act-hero')}
                      className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
                    >
                      {CTA.secondary.label}
                    </a>
                  </div>
                  <CountdownNotice
                    milestones={TIMELINE.milestones}
                    initialToday={renderDay}
                    label={HERO.panel.label}
                    daysLabel={HERO.panel.daysLabel}
                    dayLabel={HERO.panel.dayLabel}
                    footnote={HERO.panel.footnote}
                    nextTitle={HERO.panel.nextTitle}
                    className="max-w-md"
                  />
                </div>
                <ReportHero report={report} />
              </div>
            </div>
          </section>

          {/* ── FIG 1: the approved explainer reel, framed over its own blurred picture ── */}
          <div className="border-t border-line-subtle px-6 py-12 md:px-10 md:py-16 xl:px-14">
            <ReelStage
              clips={[
                {
                  id: 'eu-explainer',
                  label: HERO.reel.label,
                  mp4: loop.mp4.path,
                  webm: loop.webm.path,
                  poster: loop.poster.path,
                  full: { mp4: full.mp4.path, webm: full.webm.path },
                  duration: full.mp4.duration ? runningTime(full.mp4.duration) : undefined,
                },
              ]}
              title={HERO.reel.title}
              caption={HERO.reel.caption}
              captionNote={HERO.reel.captionNote}
              playLabel={HERO.reel.playLabel}
              playingLabel={HERO.reel.playingLabel}
              labels={HERO.reel.labels}
              cardWidth={320}
            />
          </div>

          {/* ── 01 Who the Act covers ── */}
          <InstrumentSection id="coverage" tab={TABS.coverage} band="raised">
            <h2 className={H2_CLASS} style={H2_STYLE}>
              {COVERAGE.heading}
            </h2>
            <p className={`mt-5 ${LEAD_CLASS}`} style={LEAD_STYLE}>
              {COVERAGE.intro}
            </p>
            <div className="mt-12">
              <RoleFlow roles={COVERAGE.roles} flow={COVERAGE.flow} />
            </div>
            <div className="mt-14">
              <ReachPanel reach={COVERAGE.reach} />
            </div>
          </InstrumentSection>

          {/* ── 02 The tiers, then the four high-risk areas ── */}
          <InstrumentSection id="tiers" tab={TABS.tiers}>
            <h2 className={H2_CLASS} style={H2_STYLE}>
              {TIERS.heading}
            </h2>
            <div className="mt-12">
              <RiskPyramid tiers={TIERS.tiers} />
            </div>
            <div className="mt-20 border-t border-line-subtle pt-12">
              <h3 className="font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 1.875rem)', lineHeight: 1.15 }}>
                {COVERAGE.highRisk.title}
              </h3>
              <p className={`mt-3 ${LEAD_CLASS}`} style={{ fontSize: 16, lineHeight: 1.65 }}>
                {COVERAGE.highRisk.intro}
              </p>
              <div className="mt-8">
                <HighRiskBento items={COVERAGE.highRisk.items} />
              </div>
              <div className="mt-8 max-w-3xl border-l-2 border-brand-amber pl-5 text-sm leading-6 text-ink-secondary">
                {COVERAGE.highRisk.caveat}
                <LegalCite findings={COVERAGE.highRisk.caveatFindings} className="mt-1" />
              </div>
            </div>
          </InstrumentSection>

          {/* ── 03 The dates ── */}
          <InstrumentSection id="timeline" tab={TABS.timeline} band="raised">
            <h2 className={H2_CLASS} style={H2_STYLE}>
              {TIMELINE.heading}
            </h2>
            <p className={`mt-5 ${LEAD_CLASS}`} style={LEAD_STYLE}>
              {TIMELINE.intro}
            </p>
            <LegalCite findings={TIMELINE.introFindings} className="mt-2" />
            <div className="mt-12">
              <ComplianceTimeline milestones={TIMELINE.milestones} todayLabel={TIMELINE.todayLabel} />
            </div>
          </InstrumentSection>

          {/* ── 04 What it can cost: the page's one inversion band, set as a ledger ── */}
          <InstrumentSection id="penalties" tab={TABS.penalties} dark>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <div>
                <h2 className={H2_CLASS} style={H2_STYLE}>
                  {PENALTIES.heading}
                </h2>
                <p className={`mt-5 ${LEAD_CLASS}`} style={LEAD_STYLE}>
                  {PENALTIES.intro}
                </p>
              </div>
              <PenaltyScale tiers={PENALTIES.tiers} orLabel={PENALTIES.orLabel} shareLabel={PENALTIES.shareLabel} />
            </div>
            <div className="mt-16 border border-line">
              <h3 className="border-b border-line px-6 py-4 font-display font-semibold text-ink md:px-8" style={{ fontSize: 20, lineHeight: 1.3 }}>
                {PENALTIES.size.title}
              </h3>
              <div className="grid md:grid-cols-2">
                {PENALTIES.size.items.map((i, k) => (
                  <div key={i.label} className={`px-6 py-6 md:px-8 ${k > 0 ? 'border-t border-line md:border-l md:border-t-0' : ''}`}>
                    <h4 className="font-display font-semibold text-ink" style={{ fontSize: 18 }}>
                      {i.label}
                    </h4>
                    <div className="mt-2 text-sm leading-6 text-ink-secondary">{i.body}</div>
                    <LegalCite findings={i.findings} className="mt-2" />
                  </div>
                ))}
              </div>
              <div className="border-t border-line px-6 py-4 text-sm leading-6 text-ink md:px-8">{PENALTIES.size.note}</div>
            </div>
          </InstrumentSection>

          {/* ── 05 The enforcement clock (draft) ── */}
          <InstrumentSection id="clock" tab={TABS.clock} band="raised">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <p className="label-mono text-brand-amber-strong">{CLOCK.eyebrow}</p>
                <h2 className={`mt-4 ${H2_CLASS}`} style={H2_STYLE}>
                  {CLOCK.heading}
                </h2>
                {watch && <ParallaxMedia src={watch.file} alt={CLOCK.image.alt} aspect="4 / 3" sizes="(max-width: 1024px) 92vw, 36vw" className="mt-10 rounded-[6px]" />}
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
          </InstrumentSection>

          {/* ── 06 What the assessment checks ── */}
          <InstrumentSection id="method" tab={TABS.method}>
            <h2 className={H2_CLASS} style={H2_STYLE}>
              {METHOD.heading}
            </h2>
            <p className={`mt-5 ${LEAD_CLASS}`} style={LEAD_STYLE}>
              {METHOD.intro}
            </p>
            <SectionScreens
              {...METHOD.screenshotSize}
              mobile={
                <div className="mx-auto w-[min(78vw,320px)] overflow-hidden rounded-[6px] border border-line">
                  <LandingLoop stem="eu-ai-act/eu-assessment-9x16" media="(max-width: 1023.98px)" />
                </div>
              }
              items={METHOD.sections.map((m) => ({
                key: m.key,
                title: EU_SECTIONS.find((s) => s.key === m.key)!.title,
                meta: METHOD.questionsLabel(EU_QUESTIONS[m.key].length),
                body: m.asks,
                screenshot: m.screenshot,
              }))}
            />
            <ol className="mt-20 grid border-y border-line-subtle md:grid-cols-3">
              {METHOD.principles.map((p, i) => (
                <li key={p.title} className={`py-6 md:px-6 md:py-8 ${i > 0 ? 'border-t border-line-subtle md:border-l md:border-t-0' : 'md:pl-0'}`}>
                  <h3 className="font-display font-semibold text-ink" style={{ fontSize: 20, lineHeight: 1.25 }}>
                    {p.title}
                  </h3>
                  <div className="mt-2 text-sm leading-6 text-ink-secondary">{p.body}</div>
                </li>
              ))}
            </ol>
          </InstrumentSection>

          {/* ── 07 Your report and your data ── */}
          <InstrumentSection id="details" tab={TABS.details} band="raised">
            <h2 className={H2_CLASS} style={H2_STYLE}>
              {DETAILS.heading}
            </h2>
            <div className="mt-12">
              <ReportInstruments report={report} today={today} />
            </div>
            <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-14">
              {DETAILS.blocks.map((b) => (
                <div key={b.title}>
                  <h3 className="border-b border-line-subtle pb-3 font-display font-semibold text-ink" style={{ fontSize: 20, lineHeight: 1.3 }}>
                    {b.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {b.items.map((item) => (
                      <li key={item} className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3 text-sm leading-6 text-ink-secondary">
                        <span aria-hidden className="mt-[11px] h-px w-3 bg-eu-ink" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-10 text-sm text-ink">
              {DETAILS.disclaimer}{' '}
              <Link href={DETAILS.privacyLink.href} className="font-medium text-brand-violet-strong hover:underline">
                {DETAILS.privacyLink.label}
              </Link>
            </div>
          </InstrumentSection>

          {/* ── Closing: the assessment in use, then its report ── */}
          <section aria-labelledby="eu-closing-title" className="border-t border-line-subtle">
            <div className="grid items-center gap-10 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 xl:px-14">
              <div>
                <p className="label-mono text-eu-ink">{CLOSING.eyebrow}</p>
                <h2 id="eu-closing-title" className={`mt-4 ${H2_CLASS}`} style={H2_STYLE}>
                  {CLOSING.title}
                </h2>
                <p className={`mt-5 ${LEAD_CLASS}`} style={LEAD_STYLE}>
                  {CLOSING.body}
                </p>
                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Button href={CTA.primary.href} showArrow>
                    {CTA.primary.label}
                  </Button>
                  <a
                    href={CTA.secondary.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackCallClick('eu-ai-act-closing')}
                    className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
                  >
                    {CTA.secondary.label}
                  </a>
                </div>
              </div>
              <div className="overflow-hidden rounded-[6px] border border-line shadow-[0_30px_60px_-36px_rgba(24,18,60,0.35)]">
                <LandingLoop stem="eu-ai-act/eu-assessment-16x9" />
              </div>
            </div>
            <div className="border-t border-line-subtle px-6 py-6 text-center text-xs leading-5 text-ink-secondary md:px-10">{LABELS.ledgerNote}</div>
          </section>
        </InstrumentColumn>
      </div>
    </EnterprisePageShell>
  )
}
