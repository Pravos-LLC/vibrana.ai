'use client'

import Image from '@/src/components/PublicDemoImage'
import Link from 'next/link'
import { ArrowUpRight, Quote } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { ClosingAssessment } from '@/src/components/enterprise/home/ClosingAssessment'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { trackCallClick } from '@/src/lib/funnel/client'
import { BrowserFrame, Button, Eyebrow, RevealGroup, RevealItem, Section } from '@/src/components/prism'
import { Cite } from '@/src/components/readiness/Cite'
import { ChallengeSplit } from '@/src/components/readiness/ChallengeSplit'
import { GapChart } from '@/src/components/readiness/GapChart'
import { PreparednessChart } from '@/src/components/readiness/PreparednessChart'
import { getImagery } from '@/src/imagery-manifest'
import { cite } from '@/src/lib/readiness-page/evidence'
import {
  READINESS_CASES as CASES,
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

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'
const h2 = 'font-display text-3xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl'

export default function AIReadinessPage() {
  const heroImage = getImagery(HERO.image.id)
  const scene = getImagery(CLOSING.scene.id)

  return (
    <EnterprisePageShell>
      <FunnelEvent name="readiness_landing_view" entry="landing" />
      {/* ── Hero ── */}
      <section className="px-6 pb-16 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
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
              <Button href={CTA.primary.href} showArrow>{CTA.primary.label}</Button>
              <Button href={CTA.secondary.href} variant="secondary" target="_blank" rel="noopener noreferrer" onClick={() => trackCallClick('readiness-hero')}>{CTA.secondary.label}</Button>
            </RevealItem>
          </RevealGroup>
          {heroImage && (
            <div className="relative aspect-3/2 overflow-hidden rounded-2xl ring-1 ring-line-subtle">
              <Image src={heroImage.file} alt={HERO.image.alt} fill priority sizes="(max-width: 1024px) 92vw, 46vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      {/* ── 1. The problem ── */}
      <Section container="wide" surface="raised">
        <h2 className={`${h2} max-w-3xl`}>{PROBLEM.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{PROBLEM.intro}</div>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-0 md:between:border-l md:between:border-line-subtle">
          {PROBLEM.stats.map((s) => (
            <div key={s.finding} className="md:px-8 md:first:pl-0 md:last:pr-0">
              <div className="font-display text-6xl font-semibold tracking-tight text-ink md:text-7xl">{s.value}</div>
              <div className="mt-4 text-base leading-7 text-ink">{s.label}</div>
              <Cite findings={[s.finding]} sample={s.sample} className="mt-3" />
            </div>
          ))}
        </div>
        <div className={`${panel} mt-16 p-6 md:p-8`}>
          <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{PROBLEM.split.heading}</h3>
          <div className="mt-2 text-sm leading-6 text-ink-secondary">{PROBLEM.split.caption}</div>
          <div className="mt-6">
            <ChallengeSplit segments={PROBLEM.split.segments} ariaLabel={PROBLEM.split.heading} />
          </div>
          <div className="mt-6 max-w-2xl text-base leading-7 text-ink">{PROBLEM.split.takeaway}</div>
          <Cite findings={[PROBLEM.split.finding]} sample={PROBLEM.split.sample} className="mt-2" />
        </div>
      </Section>

      {/* ── 2. What separates the companies getting value ── */}
      <Section container="wide">
        <h2 className={`${h2} max-w-3xl`}>{FACTORS.heading}</h2>
        <div className="mt-6 max-w-3xl font-display text-xl leading-8 text-ink md:text-2xl md:leading-9">{FACTORS.lead.text}</div>
        <Cite findings={FACTORS.lead.findings} className="mt-3 max-w-3xl" />
        <div className="mt-12">
          <GapChart {...FACTORS.chart} />
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {FACTORS.practices.map((p) => (
            <div key={p.title} className="border-t border-line-subtle pt-5">
              <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
              <div className="mt-2 text-sm leading-6 text-ink-secondary">{p.body}</div>
              <Cite findings={[p.finding]} className="mt-2" />
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-brand-amber/40 bg-brand-amber/5 p-6 md:p-8">
          <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{FACTORS.caveat.heading}</h3>
          <div className="mt-3 max-w-3xl text-base leading-7 text-ink-secondary">{FACTORS.caveat.body}</div>
          <Cite findings={FACTORS.caveat.findings} className="mt-3" />
        </div>
      </Section>

      {/* ── 3. Enterprise cases ── */}
      <Section container="wide" surface="overlay">
        <h2 className={`${h2} max-w-3xl`}>{CASES.heading}</h2>
        <div className="mt-5 max-w-3xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{CASES.intro}</div>
        <div className="mt-12 space-y-5">
          {CASES.cases.map((c) => {
            const counter = 'counterCase' in c && c.counterCase
            return (
              <article
                key={c.company}
                className={`grid gap-6 rounded-2xl border p-6 md:p-8 lg:grid-cols-[11rem_1fr_1fr] lg:gap-10 ${counter ? 'border-brand-amber/50 bg-surface-base' : 'border-line-subtle bg-surface-frost backdrop-blur-md'}`}
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{c.company}</h3>
                  {counter && <div className="mt-2 text-xs font-semibold text-brand-amber-strong">{CASES.labels.counterCase}</div>}
                </div>
                <div>
                  <div className="text-xs font-medium text-ink-tertiary">{CASES.labels.reported}</div>
                  <div className="mt-2 text-base leading-7 text-ink">{c.reported}</div>
                  <div className="mt-4 text-xs font-medium text-ink-tertiary">{CASES.labels.evidence}</div>
                  <div className="mt-1 text-sm leading-6 text-ink-secondary">{c.evidence}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-ink-tertiary">{CASES.labels.caveat}</div>
                  <div className="mt-2 text-sm leading-6 text-ink-secondary">{c.caveat}</div>
                  <div className="mt-4 text-xs font-medium text-ink-tertiary">{CASES.labels.lesson}</div>
                  <div className="mt-1 text-sm leading-6 text-ink">{c.lesson}</div>
                </div>
                <Cite findings={c.findings} className="lg:col-span-3" />
              </article>
            )
          })}
        </div>
      </Section>

      {/* ── 4. Our own proof ── */}
      <Section container="wide">
        <h2 className={`${h2} max-w-3xl`}>{OWN.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg">{OWN.intro}</div>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {OWN.cases.map((c) => {
            const wide = c.stats.length > 3
            return (
              <article
                key={c.name}
                className={`flex flex-col rounded-2xl border border-line-subtle p-6 md:p-8 ${wide ? 'bg-linear-to-br from-brand-violet/8 to-brand-cyan/5 lg:order-first lg:col-span-2' : 'bg-surface-frost backdrop-blur-md'}`}
              >
                <div className={wide ? 'grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12' : ''}>
                  <div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-ink">{c.name}</h3>
                    <div className="mt-1 text-sm text-ink-tertiary">{c.profile}</div>
                    <div className="mt-4 text-sm leading-6 text-ink-secondary">{c.summary}</div>
                  </div>
                  <dl className={`grid gap-5 ${wide ? 'sm:grid-cols-2' : 'mt-6'}`}>
                    {c.stats.map((s) => (
                      <div key={s.label}>
                        <dt className="font-display text-3xl font-semibold tracking-tight text-ink">{s.value}</dt>
                        <dd className="mt-1 text-sm leading-6 text-ink-secondary">{s.label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <Link href={c.href} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand-violet-strong hover:underline">
                  {OWN.readCase}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </article>
            )
          })}
        </div>
        <div className="mt-6 text-sm text-ink-secondary">{OWN.pseudonymNote}</div>
      </Section>

      {/* ── 5. What the assessment measures ── */}
      <Section container="wide" surface="raised">
        <h2 className={`${h2} max-w-3xl`}>{METHOD.heading}</h2>
        <div className="mt-5 max-w-2xl text-base leading-7 text-ink-secondary md:text-lg md:leading-8">{METHOD.intro}</div>
        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {METHOD.areas.map((a) => (
            <div key={a.name} className="border-t border-line-subtle pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-ink">{a.name}</h3>
                <span className="whitespace-nowrap text-xs tabular-nums text-ink-tertiary">{METHOD.questionsLabel(a.questions)}</span>
              </div>
              <div className="mt-2 text-sm leading-6 text-ink-secondary">{a.asks}</div>
              <div className="mt-3 text-xs text-ink-tertiary">
                {METHOD.strengthLabel}: <span className="font-medium text-ink">{a.strength}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="space-y-8">
            {METHOD.principles.map((p) => (
              <div key={p.title}>
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{p.title}</h3>
                <div className="mt-2 text-sm leading-6 text-ink-secondary">{p.body}</div>
              </div>
            ))}
          </div>
          <PreparednessChart {...METHOD.benchmark} />
        </div>
      </Section>

      {/* ── 6. What you get, what happens to your data ── */}
      <Section container="wide">
        <h2 className={`${h2} max-w-3xl`}>{DETAILS.heading}</h2>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <BrowserFrame {...DETAILS.screenshot} sizes="(max-width: 1024px) 92vw, 50vw" className="lg:sticky lg:top-28" />
          <div className="space-y-9">
            {DETAILS.blocks.map((b) => (
              <div key={b.title}>
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{b.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {b.items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-ink-secondary">
                      <span aria-hidden className="mt-2.5 h-1 w-3 flex-none rounded-full bg-brand-violet/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="text-sm text-ink">
              {DETAILS.noObligation}{' '}
              <Link href={DETAILS.privacyLink.href} className="font-medium text-brand-violet-strong hover:underline">
                {DETAILS.privacyLink.label}
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. Quotes ── */}
      <Section container="wide" surface="overlay">
        <h2 className={h2}>{QUOTES.heading}</h2>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-10">
            {QUOTES.research.map((q) => (
              <blockquote key={q.text}>
                <div className="font-display text-2xl leading-snug tracking-tight text-ink md:text-3xl">“{q.text}”</div>
                <footer className="mt-3 text-sm text-ink-secondary">
                  <a href={cite(q.finding).url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
                    {q.attribution}
                  </a>
                </footer>
              </blockquote>
            ))}
          </div>
          <div className="space-y-5">
            {QUOTES.clients.map((q) => (
              <blockquote key={q.text} className={`${panel} p-6 md:p-8`}>
                <Quote aria-hidden className="h-5 w-5 text-brand-violet-strong" />
                <div className="mt-4 text-lg leading-8 text-ink">“{q.text}”</div>
                <footer className="mt-4 text-sm text-ink-secondary">{q.attribution}</footer>
              </blockquote>
            ))}
            <div className="text-sm text-ink-secondary">{OWN.pseudonymNote}</div>
          </div>
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
          onSecondaryClick={() => trackCallClick('readiness-closing')}
          scene={{ src: scene?.file ?? '', alt: CLOSING.scene.alt }}
          screenshot={{ src: DETAILS.screenshot.src, alt: DETAILS.screenshot.alt }}
        />
        <div className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-ink-tertiary">{LABELS.ledgerNote}</div>
      </Section>
    </EnterprisePageShell>
  )
}
