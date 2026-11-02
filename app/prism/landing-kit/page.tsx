import type { Metadata } from 'next'
import Link from 'next/link'
import { findImageSlotViolations, violationKey } from '@/src/components/landing/image-slot-guard'
import {
  AppPreviewDemo,
  GalleryRail,
  GateCardDemo,
  PaperPreviewDemo,
  ProblemSequenceDemo,
  ProductFrameDemo,
  ProofMetricDemo,
  ReelStageDemo,
} from './demos'

export const metadata: Metadata = {
  title: 'Landing kit | Vibrana component gallery',
  robots: { index: false, follow: false },
}

const CHAPTERS = [
  { id: 'type', number: '0', title: 'Three voices' },
  { id: 'reel-stage', number: '1', title: 'ReelStage' },
  { id: 'deliverable-preview', number: '2', title: 'DeliverablePreview' },
  { id: 'proof-metric', number: '3', title: 'ProofMetric' },
  { id: 'product-frame', number: '4', title: 'DistinctProductFrame' },
  { id: 'problem-sequence', number: '5', title: 'ProblemSequence' },
  { id: 'chapter-rail', number: '6', title: 'ChapterRail' },
  { id: 'gate-card', number: '7', title: 'GateCard' },
  { id: 'image-slots', number: '8', title: 'ImageSlot guard' },
] as const

const GUARD_SAMPLE =
  '<img src="/assets/imagery/sprint/sprint-whiteboard-team.webp"><img src="/assets/imagery/sprint/sprint-whiteboard-team.webp"><img src="/assets/imagery/homepage/prism-grid-solar.webp"><img src="public-demo:logo">'

/**
 * /prism/landing-kit: the landing kit, live, with synthetic demos. `?theme=dark` renders the same
 * gallery on the dark tokens (scoped with data-theme, so the site theme cookie is untouched).
 */
export default async function LandingKitGallery({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const dark = (await searchParams).theme === 'dark'
  const violations = findImageSlotViolations(GUARD_SAMPLE).map(violationKey)

  return (
    <div className="prism-light min-h-screen bg-surface-base" data-theme={dark ? 'dark' : undefined} style={dark ? { colorScheme: 'dark' } : undefined}>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-5 pb-10 pt-16 sm:px-8">
          <div>
            <p className="label-mono text-ink-tertiary">src/components/landing</p>
            <h1 className="mt-3 font-display font-semibold text-ink" style={{ fontSize: 'clamp(2.25rem, 1.8rem + 2vw, 3.5rem)', lineHeight: 1.04, letterSpacing: '-0.03em' }}>
              Landing <span className="font-serif-accent">kit</span>
            </h1>
            <p className="mt-4 max-w-[56ch] text-ink-secondary">
              Shared parts for the offer pages. Every demo runs on synthetic fixtures. Nothing on this page is client data.
            </p>
          </div>
          <nav aria-label="Theme" className="flex rounded-full border border-line p-1 text-sm">
            <Link href="/prism/landing-kit" aria-current={!dark ? 'page' : undefined} className={`rounded-full px-4 py-1.5 ${!dark ? 'bg-surface-overlay text-ink' : 'text-ink-tertiary'}`}>
              Light
            </Link>
            <Link href="/prism/landing-kit?theme=dark" aria-current={dark ? 'page' : undefined} className={`rounded-full px-4 py-1.5 ${dark ? 'bg-surface-overlay text-ink' : 'text-ink-tertiary'}`}>
              Dark
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 sm:px-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-14">
        <aside className="pt-12 max-md:contents">
          <GalleryRail chapters={CHAPTERS} />
        </aside>

        <main className="min-w-0 pb-40">
          <Block id="type" name="Three voices" note="Grotesk display, one serif italic word, and JetBrains Mono for labels, figure numbers, counters and table headers. Use `font-label` or `.label-mono`; add `.tabular` to display numerals.">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="label-mono text-ink-tertiary">Display, Bricolage Grotesque</p>
                <p className="mt-3 font-display font-semibold text-ink" style={{ fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.03em' }}>Built in ten days</p>
              </div>
              <div>
                <p className="label-mono text-ink-tertiary">Accent, Playfair Display italic</p>
                <p className="mt-3 text-ink" style={{ fontSize: 36, lineHeight: 1.1 }}>
                  <span className="font-serif-accent">working</span>
                </p>
              </div>
              <div>
                <p className="label-mono text-ink-tertiary">Label, JetBrains Mono</p>
                <div className="mt-3 space-y-1.5 text-ink">
                  <p className="label-mono">FIG 2.1 / Lisbon, day 4</p>
                  <p className="label-mono tabular">01 / 03</p>
                  <p className="label-mono tabular">Gate 02 / Week 6</p>
                </div>
              </div>
            </div>
          </Block>

          <Block id="reel-stage" name="ReelStage" note="9:16 reel in a framed card over a blurred copy of itself. Poster first, muted autoplay only in view, click for sound, film strip to switch clips. Reduced motion keeps the poster with a Play button.">
            <ReelStageDemo />
          </Block>

          <Block id="deliverable-preview" name="DeliverablePreview" note="Real report and app components at preview scale, stepped through three beats with callouts. Paper variant with the EU AI Act report components (Northwind fixture); app variant with the assessment radar and quadrant.">
            <div className="flex flex-col gap-24">
              <PaperPreviewDemo />
              <AppPreviewDemo />
            </div>
          </Block>

          <Block id="proof-metric" name="ProofMetric" note="Each stat in its own cell, never under 160px. The row drops columns before any figure shrinks. Units smaller, tabular figures, a source line.">
            <ProofMetricDemo />
          </Block>

          <Block id="product-frame" name="DistinctProductFrame" note="Four silhouettes, two accents, two densities. ProductToggle shows one product at a time at full size: labeled tabs, not a carousel.">
            <ProductFrameDemo />
          </Block>

          <Block id="problem-sequence" name="ProblemSequence" note="Pinned on desktop: lines arrive with a counter, earlier lines take a gradient strike, the strikes resolve into the close. Flow on mobile. A static ledger under reduced motion.">
            <ProblemSequenceDemo />
          </Block>

          <Block id="chapter-rail" name="ChapterRail" note="The rail on the left of this page is the component: sticky, the chapter in view marked with a sliding gradient rule. Below md it becomes a sticky bar with a progress hairline.">
            <p className="label-mono text-ink-tertiary">Scroll this page and watch the rail.</p>
          </Block>

          <Block id="gate-card" name="GateCard" note="An acceptance gate: what must be true, who signs. The boxes tick 120 ms apart as the card comes into view.">
            <GateCardDemo />
          </Block>

          <Block id="image-slots" name="ImageSlot guard" note="Test helper. Renders a page on the server and fails on an asset in two slots, the public placeholder, or a public-demo stand-in. Pages opt in through tests/landing/image-slots.test.tsx.">
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="border-b border-line bg-surface-raised px-4 py-2">
                <p className="label-mono text-ink-tertiary">findImageSlotViolations(sample)</p>
              </div>
              <ul className="divide-y divide-line-subtle">
                {violations.map((v) => (
                  <li key={v} className="label-mono px-4 py-2.5 text-ink">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </Block>
        </main>
      </div>
    </div>
  )
}

function Block({ id, name, note, children }: { id: string; name: string; note: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line-subtle py-16 last:border-b-0">
      <h2 className="font-display font-semibold text-ink" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>{name}</h2>
      <p className="type-sm mt-2 max-w-[70ch] text-ink-secondary">{note}</p>
      <div className="mt-10">{children}</div>
    </section>
  )
}
