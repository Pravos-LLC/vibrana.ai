'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { ClosingAssessment } from '@/src/components/enterprise/home/ClosingAssessment'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { trackCallClick } from '@/src/lib/funnel/client'
import { Button } from '@/src/components/prism'
import { ChapterRail, ProofMetric, ProofMetricRow } from '@/src/components/landing'
import { cn } from '@/src/components/prism/utils/cn'
import { Cite } from '@/src/components/readiness/Cite'
import { ChallengeSplit } from '@/src/components/readiness/ChallengeSplit'
import { GapChart } from '@/src/components/readiness/GapChart'
import { PreparednessChart } from '@/src/components/readiness/PreparednessChart'
import { ReportSheet } from '@/src/components/readiness/ReportSheet'
import { ScreenLoop } from '@/src/components/readiness/ScreenLoop'
import type { SampleReport } from '@/src/components/readiness/report-fixture'
import { getImagery } from '@/src/imagery-manifest'
import { landingMedia, landingVideo } from '@/src/landing-media'
import { cite } from '@/src/lib/readiness-page/evidence'
import {
  READINESS_CASES as CASES,
  READINESS_CHAPTERS as CHAPTERS,
  READINESS_CLOSING as CLOSING,
  READINESS_CTA as CTA,
  READINESS_DETAILS as DETAILS,
  READINESS_FACTORS as FACTORS,
  READINESS_HERO as HERO,
  READINESS_METHOD as METHOD,
  READINESS_OWN_CASES as OWN,
  READINESS_PROBLEM as PROBLEM,
  READINESS_QUOTES as QUOTES,
  READINESS_SOURCE_LABELS as LABELS,
} from '@/src/ai-readiness-content'

// Editorial Field Report, Readiness variant ("the mirror"): the page is about the reader's own
// company. The hero shows the report they get; chapters carry the reasons behind the questions.

const QUESTION = landingMedia('readiness/readiness-question.webp')
const PROFILE = landingMedia('readiness/readiness-profile.webp')
const LOOP_WIDE = landingVideo('readiness/readiness-assessment-16x9')
const LOOP_TALL = landingVideo('readiness/readiness-assessment-9x16')

const [DO, GET, DATA] = DETAILS.blocks
const chapterNo = (id: string) => CHAPTERS.chapters.findIndex((c) => c.id === id) + 1

/** Display sizes are inline: `.prism-light` h1 to h6 and p fix their own size. */
const H2 = { fontSize: 'clamp(1.875rem, 1.35rem + 1.7vw, 3rem)', lineHeight: 1.07, letterSpacing: '-0.03em' } as const
const H3 = { fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)', lineHeight: 1.2, letterSpacing: '-0.02em' } as const
const LEAD = { fontSize: 'clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)', lineHeight: 1.6 } as const

export default function AIReadinessPage({ sample }: { sample: SampleReport }) {
  const scene = getImagery(CLOSING.scene.id)

  return (
    <EnterprisePageShell>
      <FunnelEvent name="readiness_landing_view" entry="landing" />

      {/* ── Hero: the headline beside the report the reader will hold ── */}
      <section className="px-5 pb-20 pt-28 sm:px-8 md:pt-32 lg:pb-28">
        {/* Two columns only from xl, where the sheet column holds a legible sheet (about 450px at 1280);
            below that the sheet sits under the headline at its full 520px. */}
        <div className="mx-auto grid max-w-[1360px] items-start gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] xl:gap-6">
          <div className="xl:pt-12">
            <div className="label-mono text-ink-tertiary">{HERO.eyebrow}</div>
            <h1 className="mt-6 max-w-[19ch] font-display font-semibold text-ink" style={{ fontSize: 'clamp(2.375rem, 1.5rem + 1.6vw, 3.125rem)', lineHeight: 1.06, letterSpacing: '-0.035em' }}>
              {HERO.headline.lead}
              <span className="font-serif-accent inline-block pb-1 tracking-normal">{HERO.headline.accent}</span>
              {HERO.headline.trail}
            </h1>
            <p className="mt-6 max-w-[46ch] text-ink-secondary" style={LEAD}>{HERO.subtitle}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Button href={CTA.primary.href} showArrow>{CTA.primary.label}</Button>
              <a
                href={CTA.secondary.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCallClick('readiness-hero')}
                className="inline-flex items-center gap-1.5 text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
              >
                {CTA.secondary.label}
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="min-w-0">
            <ReportSheet sample={sample} />
            <div className="label-mono mt-4 text-center text-ink-tertiary">{HERO.sampleNote}</div>
          </div>
        </div>
      </section>

      {/* ── Chapters, with the rail beside them ── */}
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8 md:grid md:grid-cols-[168px_minmax(0,1fr)] md:gap-10 lg:gap-16">
        <aside className="max-md:contents md:pt-20">
          <ChapterRail chapters={CHAPTERS.chapters} label={CHAPTERS.title} formatProgress={CHAPTERS.progress} top={96} />
        </aside>

        <div className="min-w-0">
          {/* 1. Your report: what you do, what you get */}
          <Chapter id="report">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
              <div>
                <h2 className="font-display font-semibold text-ink" style={H2}>{DO.title}</h2>
                <Steps items={DO.items} />
              </div>
              <Plate caption={CHAPTERS.figures.question} tone>
                {/* On phones the shot crops to the question itself, at a size that can be read. */}
                <div className="relative aspect-[6/5] md:aspect-[16/10]">
                  <Image src={QUESTION.path} alt={QUESTION.alt} fill sizes="(max-width: 768px) 150vw, (max-width: 1024px) 92vw, 560px" className="object-cover object-[92%_0%] md:object-center" />
                </div>
              </Plate>
            </div>
            <div className="mt-20 grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
              <Plate caption={CHAPTERS.figures.loop} className="lg:order-first" bare tone>
                <ScreenLoop wide={LOOP_WIDE} tall={LOOP_TALL} label={LOOP_WIDE.mp4.alt} labels={CHAPTERS.loopControls} />
              </Plate>
              <div>
                <h2 className="font-display font-semibold text-ink" style={H2}>{GET.title}</h2>
                <Steps items={GET.items} />
              </div>
            </div>
          </Chapter>

          {/* 2. Why we ask: two surveys, then the split that shapes the questions */}
          <Chapter id="why" kicker={PROBLEM.eyebrow}>
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{PROBLEM.heading}</h2>
            <p className="mt-5 max-w-[60ch] text-ink-secondary" style={LEAD}>{PROBLEM.intro}</p>
            <ProofMetricRow maxColumns={2} className="mt-12" label={PROBLEM.heading}>
              {PROBLEM.stats.map((s) => (
                <ProofMetric
                  key={s.finding}
                  value={s.value.replace('%', '')}
                  unit="%"
                  label={s.label}
                  source={<Cite inline findings={[s.finding]} sample={s.sample} className="[&_a]:underline [&_a]:decoration-line [&_a]:underline-offset-2 [&_a:hover]:text-ink" />}
                />
              ))}
            </ProofMetricRow>
            <figure className="m-0 mt-16 border-t border-line pt-5">
              <div className="label-mono text-ink-tertiary">{CHAPTERS.figures.split}</div>
              <h3 className="mt-2 font-display font-semibold text-ink" style={H3}>{PROBLEM.split.heading}</h3>
              <p className="mt-2 max-w-[60ch] text-ink-secondary">{PROBLEM.split.caption}</p>
              <div className="mt-7">
                <ChallengeSplit segments={PROBLEM.split.segments} ariaLabel={PROBLEM.split.heading} />
              </div>
              <figcaption className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
                <div>
                  <div className="font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.6vw, 1.625rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{PROBLEM.split.takeaway}</div>
                  <Cite findings={[PROBLEM.split.finding]} sample={PROBLEM.split.sample} className="mt-3" />
                </div>
                <div className="border-l-2 border-brand-violet/60 pl-5 text-ink" style={{ fontSize: 16, lineHeight: 1.6 }}>{PROBLEM.split.bridge}</div>
              </figcaption>
            </figure>
          </Chapter>

          {/* 3. What leaders do */}
          <Chapter id="leaders">
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{FACTORS.heading}</h2>
            <div className="mt-6 max-w-[62ch] font-display text-ink" style={{ fontSize: 'clamp(1.125rem, 1.02rem + 0.45vw, 1.375rem)', lineHeight: 1.55 }}>{FACTORS.lead.text}</div>
            <Cite findings={FACTORS.lead.findings} className="mt-3 max-w-[62ch]" />
            <div className="mt-14">
              <GapChart {...FACTORS.chart} figure={CHAPTERS.figures.gap} />
            </div>
            <div className="mt-14 grid gap-x-12 gap-y-9 md:grid-cols-2">
              {FACTORS.practices.map((p) => (
                <div key={p.title}>
                  <h3 className="font-display font-semibold text-ink" style={{ fontSize: 18, lineHeight: 1.3 }}>{p.title}</h3>
                  <p className="mt-2 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>{p.body}</p>
                  <Cite findings={[p.finding]} className="mt-2" />
                </div>
              ))}
            </div>
            <aside className="mt-14 border-l-2 border-brand-amber pl-6">
              <h3 className="font-display font-semibold text-ink" style={H3}>{FACTORS.caveat.heading}</h3>
              <p className="mt-3 max-w-[64ch] text-ink-secondary" style={{ fontSize: 16, lineHeight: 1.65 }}>{FACTORS.caveat.body}</p>
              <Cite findings={FACTORS.caveat.findings} className="mt-3" />
            </aside>
          </Chapter>

          {/* 4. The famous cases, as a ledger; then the research in its own words */}
          <Chapter id="cases">
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{CASES.heading}</h2>
            <p className="mt-5 max-w-[62ch] text-ink-secondary" style={LEAD}>{CASES.intro}</p>
            <div className="mt-12 border-b border-line">
              {CASES.cases.map((c) => {
                const counter = 'counterCase' in c && c.counterCase
                return (
                  <article key={c.company} className={cn('grid gap-5 border-t py-8 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10', counter ? 'border-brand-amber' : 'border-line')}>
                    <div>
                      <h3 className="font-display font-semibold text-ink" style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{c.company}</h3>
                      {counter && <div className="label-mono mt-2 text-brand-amber-strong">{CASES.labels.counterCase}</div>}
                    </div>
                    <div>
                      <Label>{CASES.labels.reported}</Label>
                      <p className="mt-1.5 text-ink" style={{ fontSize: 15.5, lineHeight: 1.6 }}>{c.reported}</p>
                      <Label className="mt-4">{CASES.labels.evidence}</Label>
                      <p className="mt-1.5 text-ink-secondary" style={{ fontSize: 14, lineHeight: 1.55 }}>{c.evidence}</p>
                    </div>
                    <div>
                      <Label>{CASES.labels.caveat}</Label>
                      <p className="mt-1.5 text-ink-secondary" style={{ fontSize: 14, lineHeight: 1.55 }}>{c.caveat}</p>
                      <Label className="mt-4">{CASES.labels.lesson}</Label>
                      <p className="mt-1.5 text-ink" style={{ fontSize: 15, lineHeight: 1.55 }}>{c.lesson}</p>
                    </div>
                    <Cite findings={c.findings} className="lg:col-start-2 lg:col-end-4" />
                  </article>
                )
              })}
            </div>

            <h3 className="mt-20 font-display font-semibold text-ink" style={H3}>{QUOTES.heading}</h3>
            <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              {QUOTES.research.map((q, i) => (
                <blockquote key={q.text} className={cn('m-0', i === 0 && 'md:row-span-2')}>
                  <p className="font-display text-ink" style={i === 0 ? { fontSize: 'clamp(1.75rem, 1.3rem + 1.5vw, 2.5rem)', lineHeight: 1.15, letterSpacing: '-0.025em' } : { fontSize: 21, lineHeight: 1.35, letterSpacing: '-0.015em' }}>
                    “{q.text}”
                  </p>
                  <footer className="label-mono mt-4 text-ink-tertiary">
                    <a href={cite(q.finding).url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
                      {q.attribution}
                    </a>
                  </footer>
                </blockquote>
              ))}
            </div>
          </Chapter>

          {/* 5. Our own work */}
          <Chapter id="own-work">
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{OWN.heading}</h2>
            <p className="mt-5 max-w-[62ch] text-ink-secondary" style={LEAD}>{OWN.intro}</p>
            <div className="mt-12 flex flex-col gap-16">
              {OWN.cases.map((c) => (
                <article key={c.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                    <h3 className="font-display font-semibold text-ink" style={{ fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{c.name}</h3>
                    <Link href={c.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-violet-strong hover:underline">
                      {OWN.readCase}
                      <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="label-mono mt-1 text-ink-tertiary">{c.profile}</div>
                  <p className="mt-3 max-w-[62ch] text-ink-secondary" style={{ fontSize: 15.5, lineHeight: 1.6 }}>{c.summary}</p>
                  <ProofMetricRow maxColumns={c.stats.length > 3 ? 4 : c.stats.length === 3 ? 3 : 2} className="mt-6" label={c.name}>
                    {c.stats.map((s) => (
                      <ProofMetric key={s.label} {...splitFigure(s.value)} label={s.label} />
                    ))}
                  </ProofMetricRow>
                </article>
              ))}
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {QUOTES.clients.map((q) => (
                <blockquote key={q.text} className="m-0 border-t border-line pt-5">
                  <p className="text-ink" style={{ fontSize: 19, lineHeight: 1.5 }}>“{q.text}”</p>
                  <footer className="mt-3 text-sm text-ink-secondary">{q.attribution}</footer>
                </blockquote>
              ))}
            </div>
            <p className="mt-8 max-w-[70ch] text-ink-tertiary" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{OWN.pseudonymNote}</p>
          </Chapter>

          {/* 6. The method */}
          <Chapter id="method">
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{METHOD.heading}</h2>
            <p className="mt-5 max-w-[64ch] text-ink-secondary" style={LEAD}>{METHOD.intro}</p>
            <ol className="mt-12 grid gap-x-10 border-t border-line md:grid-cols-2">
              {METHOD.areas.map((a, i) => (
                <li key={a.name} className="border-b border-line-subtle py-6">
                  <div className="flex items-baseline gap-3">
                    <span className="label-mono tabular text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="flex-1 font-display font-semibold text-ink" style={{ fontSize: 18, lineHeight: 1.3 }}>{a.name}</h3>
                    <span className="label-mono tabular whitespace-nowrap text-ink-tertiary">{METHOD.questionsLabel(a.questions)}</span>
                  </div>
                  <p className="mt-2 pl-[2.1rem] text-ink-secondary" style={{ fontSize: 14.5, lineHeight: 1.6 }}>{a.asks}</p>
                  <div className="mt-3 pl-[2.1rem] text-xs text-ink-tertiary">
                    {METHOD.strengthLabel}: <span className="font-medium text-ink">{a.strength}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-16 grid items-start gap-10 lg:grid-cols-3 lg:gap-12">
              <div className="contents">
                {METHOD.principles.map((p) => (
                  <div key={p.title}>
                    <h3 className="font-display font-semibold text-ink" style={H3}>{p.title}</h3>
                    <p className="mt-2 text-ink-secondary" style={{ fontSize: 15.5, lineHeight: 1.6 }}>{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-16">
              <PreparednessChart {...METHOD.benchmark} figure={CHAPTERS.figures.benchmark} />
            </div>
          </Chapter>

          {/* 7. Your data */}
          <Chapter id="your-data">
            <h2 className="max-w-[24ch] font-display font-semibold text-ink" style={H2}>{DATA.title}</h2>
            <ol className="mt-10 max-w-[72ch] border-b border-line-subtle">
              {DATA.items.map((item, i) => (
                <li key={item} className="flex gap-4 border-t border-line-subtle py-5">
                  <span className="label-mono tabular pt-0.5 text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-ink" style={{ fontSize: 15.5, lineHeight: 1.6 }}>
              {DETAILS.noObligation}{' '}
              <Link href={DETAILS.privacyLink.href} className="font-medium text-brand-violet-strong underline-offset-2 hover:underline">
                {DETAILS.privacyLink.label}
              </Link>
            </p>
          </Chapter>

          {/* 8. Start */}
          <Chapter id="start" last>
            <ClosingAssessment
              eyebrow={CLOSING.eyebrow}
              title={CLOSING.title}
              body={CLOSING.body}
              primaryCta={{ text: CTA.primary.label, href: CTA.primary.href }}
              secondaryCta={{ text: CTA.secondary.label, href: CTA.secondary.href }}
              onSecondaryClick={() => trackCallClick('readiness-closing')}
              scene={{ src: scene?.file ?? '', alt: CLOSING.scene.alt }}
              screenshot={{ src: PROFILE.path, alt: PROFILE.alt }}
            />
            {/* The tablet is a recorded sample of the real report, not the hero's sample company. */}
            <div className="label-mono mt-4 text-right text-ink-tertiary">{CHAPTERS.figures.closing}</div>
            <p className="mx-auto mt-8 max-w-3xl text-center text-ink-tertiary" style={{ fontSize: 12.5, lineHeight: 1.6 }}>{LABELS.ledgerNote}</p>
          </Chapter>
        </div>
      </div>
    </EnterprisePageShell>
  )
}

/** One chapter: id for the rail, a mono chapter line, then its content. */
function Chapter({ id, kicker, last, children }: { id: string; kicker?: string; last?: boolean; children: React.ReactNode }) {
  const n = chapterNo(id)
  return (
    <section id={id} className={cn('scroll-mt-28 border-t border-line pt-14 md:pt-20', last ? 'pb-24 md:pb-32' : 'pb-20 md:pb-28')}>
      <div className="label-mono mb-6 text-ink-tertiary">
        <span className="tabular">{CHAPTERS.progress(n)}</span>
        {kicker ? <> / {kicker}</> : null}
      </div>
      {children}
    </section>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('label-mono text-ink-tertiary', className)}>{children}</div>
}

/** The steps of one block, numbered: they happen in this order. */
function Steps({ items }: { items: readonly string[] }) {
  return (
    <ol className="mt-7 border-t border-line">
      {items.map((item, i) => (
        <li key={item} className="flex gap-4 border-b border-line-subtle py-4">
          <span className="label-mono tabular pt-0.5 text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-ink-secondary" style={{ fontSize: 15.5, lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * A product figure on a neutral mat, with its mono caption under it. `tone` quiets the capture's
 * own gradient wash (the page keeps one gradient per viewport) and dims it a little in dark mode,
 * where no dark capture of the assessment exists yet.
 */
function Plate({ caption, className, bare, tone, children }: { caption: string; className?: string; bare?: boolean; tone?: boolean; children: React.ReactNode }) {
  return (
    <figure className={cn('m-0 min-w-0', className)}>
      <div className={cn('rounded-2xl border border-line bg-surface-raised p-2 sm:p-2.5', bare && 'max-md:mx-auto max-md:max-w-[380px] max-md:rounded-[30px]')}>
        <div className={cn('overflow-hidden', bare ? 'rounded-xl max-md:rounded-[22px]' : 'rounded-xl', tone && 'saturate-[.55] dark:brightness-[.82]')}>
          {children}
        </div>
      </div>
      <figcaption className="label-mono mt-3 text-ink-tertiary">{caption}</figcaption>
    </figure>
  )
}

/** Split an approved figure into prefix, value and unit for ProofMetric, words unchanged. */
function splitFigure(raw: string): { prefix?: string; value: string; unit?: string } {
  // A range keeps its start as the small lead-in ("5% to" 100%), so the cell never clips it.
  const pre = raw.match(/^(About|Up to)\s+(.+)$/) ?? raw.match(/^(.+? to)\s+(.+)$/)
  const prefix = pre?.[1]
  const rest = pre ? pre[2] : raw
  const unit = rest.match(/^(.+?)\s*(hrs|\/ 5)$/)
  return unit ? { prefix, value: unit[1], unit: unit[2] } : { prefix, value: rest }
}
