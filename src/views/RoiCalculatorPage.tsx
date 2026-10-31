import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow, GradientText, Reveal, Section } from '@/src/components/prism'
import { RoiCalculator } from '@/src/components/roi/RoiCalculator'
import { CallButton } from '@/src/components/analytics/CallButton'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'
import { withEntry } from '@/src/lib/funnel/entry'
import { EVIDENCE_SYNCED_FROM } from '@/src/lib/roi/evidence'
import { ROI_CTA, ROI_HERO, ROI_METHOD, ROI_PROOF } from '@/src/roi-calculator-content'

const h2 = 'type-3xl text-balance font-display font-semibold leading-[1.1] tracking-tight text-ink'

export default function RoiCalculatorPage() {
  return (
    <EnterprisePageShell>
      <FunnelEvent name="roi_landing_view" entry="roi" />
      {/* Hero: left-aligned, short; the calculator is the visual */}
      <Section container="full" rhythm="none" className="pb-10 pt-28 md:pb-12 md:pt-32">
        <Link href="/ai-build-sprint" className="type-sm inline-flex items-center gap-1.5 text-ink-secondary hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {ROI_HERO.back}
        </Link>
        <Eyebrow className="mb-4 mt-8">{ROI_HERO.eyebrow}</Eyebrow>
        <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
          {ROI_HERO.headline.lead} <GradientText>{ROI_HERO.headline.accent}</GradientText> {ROI_HERO.headline.trail}
        </h1>
        <p className="type-lg mt-5 max-w-2xl text-ink-secondary">{ROI_HERO.subhead}</p>
      </Section>

      <Section container="full" rhythm="none" className="pb-20 md:pb-28">
        <RoiCalculator />
      </Section>

      {/* Our own builds: estimates and projections, labeled as such */}
      <Section container="full" surface="raised" rhythm="none" className="py-20 md:py-28">
        <Reveal y={24} className="max-w-3xl">
          <h2 className={h2}>{ROI_PROOF.heading}</h2>
          <p className="type-sm mt-4 max-w-2xl text-ink-secondary">{ROI_PROOF.note}</p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ROI_PROOF.cards.map((card, i) => (
            <Reveal key={card.href} y={20} delay={i * 0.06} className="flex flex-col rounded-2xl border border-line-subtle bg-surface-base p-6">
              <p className="type-xs font-medium text-ink-secondary">{card.tag}</p>
              <p className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {card.metric}
              </p>
              <p className="type-sm mt-2 flex-1 text-ink-secondary">{card.body}</p>
              <Link href={card.href} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-violet-strong hover:text-ink">
                {ROI_PROOF.linkLabel}
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Method and rules: two columns on desktop, stacked on mobile */}
      <Section container="full" rhythm="none" className="py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal y={20}>
            <h2 className={h2}>{ROI_METHOD.heading}</h2>
            <ol className="mt-8 space-y-4">
              {ROI_METHOD.steps.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-default font-display text-sm font-semibold text-ink">{i + 1}</span>
                  <span className="pt-0.5 text-ink-secondary">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal y={20} delay={0.08} className="md:pt-16">
            <ul className="space-y-4 border-l-2 border-[rgba(124,58,237,0.35)] pl-5">
              {ROI_METHOD.rules.map((rule) => (
                <li key={rule} className="text-ink">{rule}</li>
              ))}
            </ul>
            <p className="type-xs mt-6 text-ink-secondary">
              {ROI_METHOD.synced} {EVIDENCE_SYNCED_FROM}.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Close: the one next step */}
      <Section container="prose" surface="raised" rhythm="none" className="py-20 md:py-28">
        <Reveal y={24} className="mx-auto max-w-2xl text-center">
          <h2 className={h2}>{ROI_CTA.heading}</h2>
          <p className="type-lg mt-5 text-ink-secondary">{ROI_CTA.body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={withEntry(ROI_CTA.primaryHref, 'roi')} showArrow>
              {ROI_CTA.primary}
            </Button>
            <CallButton location="roi-close" href={ROI_CTA.secondaryHref} variant="secondary" target="_blank" rel="noopener noreferrer">
              {ROI_CTA.secondary}
            </CallButton>
          </div>
          <p className="type-xs mt-4 text-ink-secondary">{ROI_CTA.primaryNote}</p>
          <p className="type-xs mt-1 text-ink-secondary">{ROI_CTA.currency}</p>
        </Reveal>
      </Section>
    </EnterprisePageShell>
  )
}
