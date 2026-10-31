'use client'

import Link from 'next/link'
import Image from '@/src/components/PublicDemoImage'
import { ArrowRight, Check } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow, GradientText, Heading, Reveal, RoleImage, BrowserFrame, PhoneFrame, cn } from '@/src/components/prism'
import { LearningLoopSection } from '@/src/components/curriculum/LearningLoopSection'
import { RoleRibbon } from '@/src/components/curriculum/RoleRibbon'
import {
  CURRICULUM_HERO,
  CURRICULUM_SECTIONS,
  CURRICULUM_POSITIONING,
  CURRICULUM_COMPARISON,
  CURRICULUM_HOW_IT_WORKS,
  CURRICULUM_PROOF,
  CURRICULUM_PRICING,
  CURRICULUM_PRICING_EXAMPLES,
  CURRICULUM_CLOSING,
} from '@/src/curriculum-content'

const SECTION_H2 =
  'mt-4 max-w-2xl type-xl font-display font-semibold leading-tight tracking-tight text-ink'
const CARD = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

export default function CurriculumPage() {
  return (
    <EnterprisePageShell>
      {/* Hero */}
      <section className="px-6 pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{CURRICULUM_HERO.eyebrow}</Eyebrow>
            <h1 className="mt-6 max-w-2xl type-2xl font-display font-semibold leading-tight tracking-tight text-ink">
              Daily learning for the{' '}
              <br className="hidden lg:block" />
              <GradientText className="font-serif-accent">AI-native</GradientText> organization.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-ink-secondary md:text-xl md:leading-8">
              {CURRICULUM_HERO.subhead}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href={CURRICULUM_HERO.primaryCta.href} showArrow>
                {CURRICULUM_HERO.primaryCta.label}
              </Button>
              <Link
                href={CURRICULUM_HERO.secondaryCta.href}
                className="inline-flex items-center gap-2 type-xs uppercase tracking-[0.12em] text-brand-violet-strong transition-opacity hover:opacity-80"
              >
                {CURRICULUM_HERO.secondaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Live platform preview — tablet (curriculum), laptop (admin dashboard),
              phone (day lesson) screenshots, layered as one hero collage. */}
          <div className="hidden lg:block" aria-hidden>
            <Image
              src="/assets/public-demo/platform-hero.svg"
              alt=""
              width={1200}
              height={760}
              className="mx-auto h-auto w-full max-w-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>{CURRICULUM_SECTIONS.howItWorks.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={CURRICULUM_SECTIONS.howItWorks.gradientWord} gradient={CURRICULUM_SECTIONS.howItWorks.gradient} gradientClassName="font-serif-accent">
            {CURRICULUM_SECTIONS.howItWorks.heading}
          </Heading>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM_HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className={cn('overflow-hidden', CARD)}>
                <RoleImage src={step.image} alt={step.imageAlt} accents={step.accents} seed={i + 1} />
                <div className="p-6">
                  <div className="type-xs uppercase tracking-[0.12em] text-brand-violet-strong">
                    Step {i + 1}
                  </div>
                  <div className="mt-2 heading-card text-ink">{step.title}</div>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inside the platform — real product screenshots (framed), used sparingly:
          one showcase block, learner experience + the org-side dashboard. */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Inside the platform</Eyebrow>
          <Heading level={2} className={SECTION_H2}>
            A real look at the daily experience
          </Heading>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-secondary">
            Not slideware. Learners get a focused daily lesson and a personal
            AI-readiness profile inside a structured journey — and you get the
            dashboard to watch it all move.
          </p>

          {/* Lead: daily lesson (desktop) + the same day on mobile.
              Phone sits in an auto-width column so it hugs the browser
              rather than floating in a wide column. */}
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <figure>
              <BrowserFrame
                src="/assets/public-demo/daily-lesson-desktop.svg"
                alt="A learner's daily curriculum lesson in the Vibrana platform"
                width={1600}
                height={1000}
              />
              <figcaption className="mt-4 text-sm leading-6 text-ink-secondary">
                The daily lesson — one focused, role-specific build each day.
              </figcaption>
            </figure>
            <figure className="mx-auto w-[228px] lg:mx-0">
              <PhoneFrame
                src="/assets/public-demo/daily-lesson-mobile.svg"
                alt="The Vibrana daily lesson on a mobile phone"
                width={600}
                height={1300}
              />
              <figcaption className="mt-4 text-center text-sm leading-6 text-ink-secondary">
                Built for the pocket — the day&apos;s work, on mobile.
              </figcaption>
            </figure>
          </div>

          {/* Supporting: readiness profile + org dashboard */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <figure>
              <BrowserFrame
                src="/assets/public-demo/readiness-profile-desktop.svg"
                alt="A participant's AI-readiness profile with a composite score and category breakdown"
                width={1600}
                height={1000}
              />
              <figcaption className="mt-4 text-sm leading-6 text-ink-secondary">
                A personal AI-readiness profile, scored across capability areas.
              </figcaption>
            </figure>
            <figure>
              <BrowserFrame
                src="/assets/public-demo/admin-dashboard-desktop.svg"
                alt="The Vibrana admin dashboard showing engagement and progress analytics"
                width={1600}
                height={1000}
              />
              <figcaption className="mt-4 text-sm leading-6 text-ink-secondary">
                The org dashboard — engagement, progress and pulse at a glance.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Role curricula — a continuous ribbon of every family (see RoleRibbon) */}
      <section id="roles" className="py-16 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>{CURRICULUM_SECTIONS.roles.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={CURRICULUM_SECTIONS.roles.gradientWord} gradient={CURRICULUM_SECTIONS.roles.gradient} gradientClassName="font-serif-accent">
            {CURRICULUM_SECTIONS.roles.heading}
          </Heading>
        </div>
        <RoleRibbon />
      </section>

      {/* Vs the alternatives — comparison */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>{CURRICULUM_SECTIONS.comparison.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2}>{CURRICULUM_SECTIONS.comparison.heading}</Heading>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-secondary">{CURRICULUM_POSITIONING}</p>
          <div className={cn('mt-10 overflow-x-auto', CARD)}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line-subtle">
                  <th className="px-4 py-3" />
                  {CURRICULUM_COMPARISON.columns.map((c, idx) => (
                    <th
                      key={c}
                      className={cn(
                        'px-4 py-3 type-xs uppercase tracking-widest',
                        idx === 0 ? 'text-brand-violet-strong' : 'text-ink-tertiary',
                      )}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRICULUM_COMPARISON.rows.map((row) => (
                  <tr key={row.dimension} className="border-b border-line-subtle last:border-0">
                    <td className="px-4 py-4 type-xs uppercase tracking-widest text-ink-tertiary">
                      {row.dimension}
                    </td>
                    {row.cells.map((cell, idx) => (
                      <td
                        key={idx}
                        className={cn(
                          'px-4 py-4',
                          idx === 0
                            ? 'font-semibold text-ink'
                            : 'text-ink-secondary',
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* The flywheel — Vibrana × AIOS loop + the daily learning loop deep-dive */}
      <LearningLoopSection />

      {/* Proof */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>{CURRICULUM_SECTIONS.proof.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={CURRICULUM_SECTIONS.proof.gradientWord} gradient={CURRICULUM_SECTIONS.proof.gradient} gradientClassName="font-serif-accent">
            {CURRICULUM_SECTIONS.proof.heading}
          </Heading>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-tertiary">{CURRICULUM_PROOF.context}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CURRICULUM_PROOF.stats.map((s) => (
              <div key={s.label} className={cn(CARD, 'p-6')}>
                <div className="type-2xl font-display font-semibold text-gradient-prism">{s.value}</div>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {CURRICULUM_PROOF.quotes.map((q) => (
              <figure key={q.attribution} className={cn(CARD, 'p-6')}>
                <blockquote className="text-base leading-7 text-ink">
                  &ldquo;{q.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 type-xs uppercase tracking-[0.12em] text-ink-tertiary">
                  {q.attribution}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 scroll-mt-24">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>{CURRICULUM_SECTIONS.pricing.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={CURRICULUM_SECTIONS.pricing.gradientWord} gradient={CURRICULUM_SECTIONS.pricing.gradient} gradientClassName="font-serif-accent">
            {CURRICULUM_SECTIONS.pricing.heading}
          </Heading>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-secondary">
            {CURRICULUM_PRICING.framing}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CURRICULUM_PRICING.modelExplainer.map((m, i) => (
              <div key={m.part} className={cn('overflow-hidden', CARD)}>
                <RoleImage src={m.image} alt={m.imageAlt} accents={m.accents} seed={i + 1} />
                <div className="p-6">
                  <div className="type-xs uppercase tracking-[0.12em] text-brand-violet-strong">{m.part}</div>
                  <div className="mt-2 type-base font-display font-semibold text-ink">{m.plain}</div>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">{m.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={cn('mt-10 overflow-x-auto', CARD)}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line-subtle">
                  {CURRICULUM_PRICING_EXAMPLES.columns.map((c) => (
                    <th key={c} className="px-4 py-3 type-xs uppercase tracking-widest text-ink-tertiary">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CURRICULUM_PRICING_EXAMPLES.rows.map((r) => (
                  <tr key={r.company} className="border-b border-line-subtle last:border-0">
                    <td className="px-4 py-4 font-semibold text-ink">{r.company}</td>
                    <td className="px-4 py-4 text-ink-secondary">{r.cohort}</td>
                    <td className="px-4 py-4 text-ink-secondary">{r.program}</td>
                    <td className="px-4 py-4 text-ink-secondary">{r.setup}</td>
                    <td className="px-4 py-4 text-ink-secondary">{r.learners}</td>
                    <td className="px-4 py-4 text-ink-secondary">{r.live}</td>
                    <td className="px-4 py-4 font-semibold text-ink">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-tertiary">
            {CURRICULUM_PRICING_EXAMPLES.note}
          </p>

          <p className="mt-8 max-w-3xl text-base leading-7 text-ink-secondary">{CURRICULUM_PRICING.note}</p>
        </div>
      </section>

      {/* Closing CTA — the landing point. A full-height, high-contrast handover
          moment: the whole model pays off in "you keep the keys". Built light
          (violet/cyan glow field + frosted panel + gradient headline), never a
          dark block, per the Prism Light guardrail. */}
      <section className="relative isolate overflow-hidden px-6 py-16">
        {/* Bold-but-light backdrop: layered brand-hue radial glows on white. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(60% 55% at 50% 8%, rgba(124,58,237,0.14) 0%, transparent 70%),' +
              'radial-gradient(45% 45% at 12% 88%, rgba(59,130,246,0.12) 0%, transparent 70%),' +
              'radial-gradient(45% 45% at 90% 82%, rgba(45,212,191,0.12) 0%, transparent 70%)',
          }}
        />
        <Reveal className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center text-center">
          <div
            className="w-full rounded-4xl border border-line bg-surface-frost px-6 py-16 backdrop-blur-md sm:px-12 md:py-24"
            style={{ boxShadow: '0 40px 120px -40px rgba(124,58,237,0.35)' }}
          >
            <Eyebrow gradient="prism">{CURRICULUM_CLOSING.eyebrow}</Eyebrow>
            <h2 className="mx-auto mt-6 max-w-4xl type-3xl font-display font-semibold leading-[1.05] tracking-tight text-ink md:type-4xl">
              {CURRICULUM_CLOSING.headlineLead}{' '}
              <GradientText gradient="prism">{CURRICULUM_CLOSING.headlineAccent}</GradientText>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-ink-secondary md:text-xl md:leading-8">
              {CURRICULUM_CLOSING.subhead}
            </p>

            <ul className="mx-auto mt-12 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
              {CURRICULUM_CLOSING.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-line-subtle bg-surface-raised p-5"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full"
                    style={{ background: 'rgba(124,58,237,0.10)' }}
                  >
                    <Check className="h-3.5 w-3.5 text-brand-violet-strong" aria-hidden />
                  </span>
                  <span className="text-sm leading-6 text-ink">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href={CURRICULUM_CLOSING.primaryCta.href} showArrow>
                {CURRICULUM_CLOSING.primaryCta.label}
              </Button>
              <Button href={CURRICULUM_CLOSING.secondaryCta.href} variant="secondary" showArrow>
                {CURRICULUM_CLOSING.secondaryCta.label}
              </Button>
            </div>
            <p className="mx-auto mt-6 max-w-md type-xs uppercase tracking-[0.12em] text-ink-tertiary">
              {CURRICULUM_CLOSING.kicker}
            </p>
          </div>
        </Reveal>
      </section>
    </EnterprisePageShell>
  )
}
