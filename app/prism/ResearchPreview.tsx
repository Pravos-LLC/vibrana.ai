'use client';
import { siteContent } from '@/src/site-content'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import { CLIENT_LOGOS } from '@/src/logo-rows-content';
import { RedactedLogo } from '@/src/components/proof/AnonymizedMark';
import React, { useState } from 'react';
import { useMotionValue } from 'framer-motion';
import { BriefcaseBusiness, Layers3, Sparkles } from 'lucide-react';
import {
  Background,
  AsciiField,
  WORDS_METHOD,
  WORDS_QUESTIONS,
  WORDS_MOMENTS,
  Card,
  Text,
  Heading,
  Stat,
  MarkerNote,
  MarkerCaption,
  MarkerUnderline,
  MarkerCircle,
  MarkerArrow,
  Eyebrow,
  GradientText,
  ResolutionLadder,
  ShaderField,
  WaveField,
  RevealGroup,
  RevealItem,
  ParallaxMedia,
  CountUp,
  ScrollLine,
  ScrollFillText,
  MarkerHover,
  NewsletterFooter,
  MetricProof,
  PunkThumbnail,
  Button,
  Section,
  SectionHeader,
  FilmRoll,
  AsciiDialogue,
  type BackgroundVariant,
  type ResolutionLadderTrigger,
} from '@/src/components/prism';
import { ENTERPRISE_ENGAGEMENTS } from '@/src/enterprise-content';

/**
 * Per-component demos for the /prism board, exported individually so page.tsx
 * can place each under the right PURPOSE category (not the order it was built
 * in). Each export renders one component with its name, a short note, and a
 * live demo, wrapped in an anchor id the sidebar links to. Demo copy is
 * structural placeholder — the page-copy-is-data gate applies to real pages,
 * not this throwaway showcase.
 */

// --- shared demo copy / helpers -------------------------------------------

const MARKER_DEMO_COPY = {
  statValue: '4.2x',
  statLabel: 'baseline throughput after week one',
  statNote: 'the number that actually moved',
  underlinePrefix: 'The team kept the ',
  underlineWord: 'weekly build cadence',
  underlineSuffix: ' even after the pilot ended.',
  circleLabel: 'Retention',
  circleValue: '91%',
  captionLabel: 'Working session, week 3',
  captionSub: 'Screenshot, internal review',
  arrowFromTitle: 'Draft outline',
  arrowFromBody: 'First pass, five bullet points.',
  arrowToTitle: 'Shipped page',
  arrowToBody: 'Same structure, real content.',
} as const;

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md';

const LADDER_IMG = {
  workshop: '/assets/imagery/homepage/ppl-workshop.webp',
  manmachine: '/assets/imagery/homepage/prism-manmachine.webp',
  hands: '/assets/imagery/homepage/prism-hands-diverse.webp',
  forest: '/assets/imagery/homepage/prism-forest-solar.webp',
} as const;

/** Small heading for a single component inside a category group. */
function CompHeading({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <>
      <Heading level={3} className="mb-1">
        {name}
      </Heading>
      <Text size="sm" tone="tertiary" className="mb-6 max-w-3xl">
        {children}
      </Text>
    </>
  );
}

// ===========================================================================
// TEXT & TEXT REVEALS
// ===========================================================================

export function ScrollFillTextDemo() {
  return (
    <div id="scroll-fill" className="scroll-mt-24">
      <CompHeading name="ScrollFillText">
        Kinetic type — faint copy fills to full contrast as it crosses the middle of the viewport. Pure typographic
        contrast, no letter motion (survives the restraint ceiling). Scroll it through center to see the fill.
      </CompHeading>
      <div className="space-y-6 py-[36vh] text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
        <div>
          <ScrollFillText as="h3" fill="ink">
            We start where others stop.
          </ScrollFillText>
        </div>
        <div>
          <ScrollFillText as="h3" fill="prism">
            Precision, implemented.
          </ScrollFillText>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// BACKGROUNDS & AMBIENT
// ===========================================================================

const WORD_SET_OPTIONS = [
  { key: 'method', label: 'Method', words: WORDS_METHOD },
  { key: 'questions', label: 'Questions', words: WORDS_QUESTIONS },
  { key: 'moments', label: 'Moments', words: WORDS_MOMENTS },
] as const;

function AsciiFieldWordSetDemo() {
  const [active, setActive] = useState<(typeof WORD_SET_OPTIONS)[number]['key']>('questions');
  const current = WORD_SET_OPTIONS.find((o) => o.key === active)!;
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {WORD_SET_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setActive(opt.key)}
            className="rounded-full border px-4 py-1.5 text-sm"
            style={{
              borderColor: 'var(--border-subtle)',
              background: active === opt.key ? 'var(--surface-raised)' : 'transparent',
              fontWeight: active === opt.key ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <AsciiField key={current.key} words={current.words} />
    </div>
  );
}

export function ShaderFieldDemo() {
  return (
    <div id="shader-field" className="scroll-mt-24">
      <CompHeading name="ShaderField">
        One modular animated gradient-grain surface (dependency-free canvas, no three.js). Presets{' '}
        <code>ambient</code> / <code>card-fill</code> (light) and <code>monopo</code> (dark glow) — for section
        backgrounds behind copy and Koto-style card fills.
      </CompHeading>
      <div className="grid gap-6 md:grid-cols-3">
        {(['ambient', 'card-fill', 'monopo'] as const).map((preset) => (
          <div key={preset}>
            <div
              className="relative flex aspect-4/3 items-end overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <ShaderField preset={preset} />
              <div className="relative z-10 p-5">
                <Text size="sm" className={preset === 'monopo' ? 'text-white' : undefined}>
                  <code>preset=&quot;{preset}&quot;</code>
                </Text>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Text size="sm" tone="tertiary" className="mb-3">
          As a section background behind copy (<code>ambient</code>).
        </Text>
        <div className="relative overflow-hidden rounded-2xl border p-10" style={{ borderColor: 'var(--border-subtle)' }}>
          <ShaderField preset="ambient" intensity={0.9} />
          <div className="relative z-10 max-w-xl">
            <Heading level={3} className="mb-2">
              Color as light, not decoration.
            </Heading>
            <Text tone="secondary">
              A slow gradient drift with a faint grain — present enough to feel alive, quiet enough to sit under body
              copy.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WaveFieldDemo() {
  return (
    <div id="wave-field" className="scroll-mt-24">
      <CompHeading name="WaveField">
        Hairline violet → blue → cyan waves with a few drifting motes, distilled from mariwaze.com. One coherent
        bundle that breathes every ~6s and relaxes as its host scrolls away. No cursor. Presets <code>hero</code>{' '}
        (live on the homepage hero) and <code>section</code>.
      </CompHeading>
      <div className="grid gap-6 md:grid-cols-2">
        {(['hero', 'section'] as const).map((preset) => (
          <div
            key={preset}
            className="relative flex aspect-video items-start overflow-hidden rounded-2xl border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <WaveField preset={preset} />
            <div className="relative z-10 p-5">
              <Text size="sm">
                <code>preset=&quot;{preset}&quot;</code>
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScrollMotionDemo() {
  return (
    <div id="scroll-motion" className="scroll-mt-24">
      <CompHeading name="Scroll motion system">
        The homepage scroll primitives (2026-10): <code>RevealGroup</code>/<code>RevealItem</code> (staggered rise,
        scale and blur-resolve), <code>ParallaxMedia</code> (clip opens, image drifts with scroll),{' '}
        <code>CountUp</code> (counts from zero once in view; server renders the real value) and{' '}
        <code>ScrollLine</code> (a Prism line drawn by scroll). Nothing moves while the page is still; reduced motion
        gets plain fades.
      </CompHeading>
      <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
        <ParallaxMedia src={siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6NA", "/assets/imagery/homepage/prism-grid-solar.webp")} alt="" aspect="3 / 2" />
        <div className="flex gap-6">
          <ScrollLine className="h-auto" />
          <RevealGroup className="space-y-6">
            {['20 yrs', '7', 'Up to 528 hrs'].map((v) => (
              <RevealItem key={v}>
                <div className="font-display text-4xl tracking-tight">
                  <CountUp value={v} textClassName="text-gradient-prism" prefixClassName="text-xl" />
                </div>
                <Text size="sm" tone="tertiary">
                  <code>{`<CountUp value="${v}" />`}</code>
                </Text>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </div>
  );
}

export function AsciiFieldDemo() {
  return (
    <div id="ascii-field" className="scroll-mt-24">
      <CompHeading name="AsciiField">
        Faint monospace noise field resolving into a word cycle, canvas-rendered (no headline/CTA overlay — bare field
        only). Move the cursor over it for the proximity magnify lens. Three switchable word sets: Method, Questions,
        Moments.
      </CompHeading>
      <AsciiFieldWordSetDemo />
      <div className="mt-8">
        <Text size="sm" tone="tertiary" className="mb-3">
          Wide variant (full-width, min-h-screen) — for surfaces that want the full-bleed field.
        </Text>
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
          <AsciiField words={WORDS_METHOD} variant="wide" />
        </div>
      </div>
    </div>
  );
}

/**
 * Context A — full-page scale. Reproduces the real homepage hero with the
 * mycelium `Background` mounted the way `PageShell` mounts it in production.
 */
function FullPageHeroDemo({ variant, label }: { variant: BackgroundVariant; label: string }) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  return (
    <div>
      <Text size="sm" tone="tertiary" className="mb-3">
        {label}
      </Text>
      <div
        className="relative isolate w-full overflow-hidden rounded-xl border"
        style={{ transform: 'translateZ(0)', borderColor: 'var(--border-subtle)' }}
      >
        <Background mouseX={mouseX} mouseY={mouseY} scrollProgress={0.2} variant={variant} coverage="page" />
        <div className="relative z-10 px-6 pb-16 pt-32 md:pb-24 md:pt-44">
          <div className="mx-auto max-w-5xl text-center">
            <Eyebrow gradient="prism">AI-Native Transformation Studio</Eyebrow>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
              We turn enterprises into <GradientText className="font-serif-accent">AI-native</GradientText>{' '}
              organizations.
            </h1>
            <p className="mx-auto mt-6 max-w-4xl text-lg leading-7 text-ink-secondary md:text-2xl md:leading-9">
              The companies that survive the AI transition aren&apos;t the ones running pilots. They&apos;re the ones
              that integrate AI into every workflow, every day.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href="/ai-transformation" showArrow>
                Take Assessment
              </Button>
              <Button href="/contact" variant="secondary">
                Contact us
              </Button>
            </div>
            <div className="mt-16">
              <Eyebrow>Our clients</Eyebrow>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-10">
                {CLIENT_LOGOS.map(({ name, src, anonymized }) => anonymized ? (
                  <RedactedLogo key={name} descriptor={anonymized} />
                ) : (
                  <PublicDemoImg
                    key={name}
                    src={src}
                    alt={name}
                    className="opacity-50"
                    style={{ height: '28px', width: 'auto', maxWidth: '144px', filter: 'brightness(0)' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Context B — the mycelium field scoped to a single bounded section. */
function BoundedSectionDemo({ variant, label }: { variant: BackgroundVariant; label: string }) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const icons = [BriefcaseBusiness, Layers3, Sparkles];
  return (
    <div>
      <Text size="sm" tone="tertiary" className="mb-3">
        {label}
      </Text>
      <div
        className="relative isolate w-full overflow-hidden rounded-xl border"
        style={{ transform: 'translateZ(0)', borderColor: 'var(--border-subtle)' }}
      >
        <Background mouseX={mouseX} mouseY={mouseY} scrollProgress={0.3} variant={variant} coverage="section" />
        <Section container="full" rhythm="large" className="relative z-10">
          <SectionHeader
            eyebrow="How we work"
            title="Three ways in. One outcome: AI that transforms."
            gradientWord="AI that transforms"
            gradient="prism"
            gradientClassName="font-serif-accent"
            subtitle="Start with a full transformation, a team curriculum rollout, or a focused builder sprint. Most clients start with one and expand."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {ENTERPRISE_ENGAGEMENTS.map((engagement, index) => {
              const Icon = icons[index];
              return (
                <div key={engagement.title} className={`${panel} p-7`}>
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.10)' }}>
                      <Icon className="h-5 w-5 text-brand-violet" />
                    </span>
                    <h3 className="text-xl font-semibold text-ink">{engagement.title}</h3>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-ink-secondary">{engagement.description}</p>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

export function BackgroundDemo() {
  return (
    <div id="background-field" className="scroll-mt-24">
      <CompHeading name="Background (mycelium field)">
        The recolored mycelium field. Mounted once by <code>PageShell</code> as a <code>fixed inset-0</code> layer
        (page coverage), or scoped to a single section. The more space it occupies, the less intense the coloration —{' '}
        <code>coverage=&quot;page&quot;</code> attenuates every preset&apos;s alpha down (~0.65×).
      </CompHeading>
      <div className="mb-10">
        <Eyebrow className="mb-4">Context A — full-page background (today&apos;s real pattern)</Eyebrow>
        <div className="space-y-10">
          <FullPageHeroDemo variant="quiet" label="quiet — full-page hero" />
          <FullPageHeroDemo variant="rich" label="rich — full-page hero" />
        </div>
      </div>
      <div>
        <Eyebrow className="mb-4">Context B — section-scoped background (alternative pattern)</Eyebrow>
        <div className="space-y-10">
          <BoundedSectionDemo variant="quiet" label="quiet — engagements section" />
          <BoundedSectionDemo variant="rich" label="rich — engagements section" />
        </div>
      </div>

      {/* ============================================================
          ASCII DIALOGUE (08b) - Track B, wave-2, round 2. Canvas-rendered;
          source code disassembles character-by-character and flies into
          the resolved human sentence, syntax colour draining to flat ink.
          Font stays JetBrains Mono end to end (no serif swap, JE round-2
          revision) - the payoff word carries the prism gradient once
          resolved. Sentence is a PLACEHOLDER lifted from the study, not
          persona-reviewed copy (see src/ascii-dialogue-content.ts).
          ============================================================ */}
      <div className="space-y-6 border-t pt-16" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <Heading level={3} className="mb-2">
            Code becomes language (demo)
          </Heading>
          <Text size="sm" tone="tertiary">
            AsciiDialogue - the &quot;08b&quot; study, canvas rewrite. Syntax-highlighted source code
            disassembles and flies, mid-scramble, into the exact letters of a plain sentence, staying
            in JetBrains Mono on the same monospace grid throughout; colour drains from multi-hue
            syntax tokens to a single ink tone, with the final payoff word rendered in the prism
            gradient once the sentence resolves. Sentence below is a placeholder pulled from the
            study, not persona-reviewed marketing copy.
          </Text>
        </div>
        <AsciiDialogue />
      </div>
    </div>
  );
}

// ===========================================================================
// MEDIA & IMAGERY
// ===========================================================================

function LadderTriggerDemo() {
  const [replayKey, setReplayKey] = useState(0);
  const triggers: { t: ResolutionLadderTrigger; label: string; note: string }[] = [
    { t: 'inview', label: 'inview', note: 'resolves once when scrolled into view (hero / section image)' },
    { t: 'scroll', label: 'scroll', note: 'resolution linked to travel through viewport — chunky at edges, sharp at center' },
    { t: 'hover', label: 'hover', note: 'resolves on hover/focus, degrades back on leave (case-study thumbnail)' },
  ];
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          className="rounded-full border px-4 py-1.5 text-sm"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-raised)' }}
        >
          ↻ Replay
        </button>
        <Text size="sm" tone="tertiary">
          8 → 16 → 32 → 64 → 128 → full, with Orchid grain + a violet→cyan duotone bleeding out of the lower rungs.
        </Text>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {triggers.map(({ t, label, note }) => (
          <div key={t}>
            <ResolutionLadder
              key={`${t}-${replayKey}`}
              src={t === 'hover' ? LADDER_IMG.hands : t === 'scroll' ? LADDER_IMG.manmachine : LADDER_IMG.workshop}
              alt={`ResolutionLadder ${label} demo`}
              trigger={t}
            />
            <Text size="sm" tone="tertiary" className="mt-2">
              <code>trigger=&quot;{label}&quot;</code> — {note}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResolutionLadderDemo() {
  return (
    <div id="resolution-ladder" className="scroll-mt-24">
      <CompHeading name="ResolutionLadder">
        An image resolves through a staircase of pixel rungs — 8-bit → full-res — the &quot;digital ⇄ vintage&quot;
        keystone. <code>trigger</code> = inview / scroll / hover / load. Respects <code>prefers-reduced-motion</code>{' '}
        (renders the resolved frame, no loop) and pauses off-screen.
      </CompHeading>
      <LadderTriggerDemo />
      <div className="mt-10">
        <Text size="sm" tone="tertiary" className="mb-3">
          As an atmospheric hero — the resolve is the opening moment, copy over the resolved frame.
        </Text>
        <div className="relative overflow-hidden rounded-2xl">
          <ResolutionLadder
            src={LADDER_IMG.forest}
            alt="Hero resolve demo"
            trigger="inview"
            aspectRatio="21 / 9"
            rounded={false}
            duration={1400}
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end p-8 md:p-12">
            <h3
              className="max-w-2xl text-3xl font-semibold leading-tight text-white md:text-5xl"
              style={{ textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}
            >
              From the raw signal to the resolved system.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilmRollDemo() {
  return (
    <div id="film-roll" className="scroll-mt-24">
      <CompHeading name="FilmRoll">
        A continuously-scrolling 35mm film roll: sprocket rails, warm sepia grade, no name labels. Hover/focus pauses;
        reduced motion swaps to a static strip. (The broader &quot;Life on Film&quot; visual-language concept was retired,
        but FilmRoll the component stands — kept, and live on <code>/about</code>.)
      </CompHeading>
      <FilmRoll
        frames={[
          { src: siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6NQ", 'public-demo:portrait'), alt: 'John Ellison, founder' },
          { src: siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6Ng", 'public-demo:portrait'), alt: 'Fatma Ghedira' },
          { src: siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6Nw", 'public-demo:portrait'), alt: 'Chetan Nanda Kumar' },
          { src: siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6OA", 'public-demo:portrait'), alt: 'Abe Isleem' },
          { src: siteContent("media.YXBwL3ByaXNtL1Jlc2VhcmNoUHJldmlldy50c3g6OQ", 'public-demo:portrait'), alt: 'Stephan Ledain' },
        ]}
      />
    </div>
  );
}

// ===========================================================================
// ANNOTATIONS & MARKS
// ===========================================================================

export function MarkerAccentsDemo() {
  return (
    <div id="marker-accents" className="scroll-mt-24">
      <CompHeading name="Marker accents">
        The Permanent Marker face as a small family of hand-touched annotations (margin note, underline, circle,
        caption, arrow), each drawing itself in on scroll. Max 1–2 marker moments per composition; never in headers or
        eyebrows.
      </CompHeading>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-8">
          <div className="flex items-start justify-between gap-3">
            <Stat value={MARKER_DEMO_COPY.statValue} label={MARKER_DEMO_COPY.statLabel} gradientValue />
            <MarkerNote side="right" rotation={-1.5} leader={false} className="max-w-26 shrink-0 pt-1">
              {MARKER_DEMO_COPY.statNote}
            </MarkerNote>
          </div>
        </Card>

        <Card className="p-8">
          <Text size="lg" tone="secondary">
            {MARKER_DEMO_COPY.underlinePrefix}
            <MarkerUnderline accent>{MARKER_DEMO_COPY.underlineWord}</MarkerUnderline>
            {MARKER_DEMO_COPY.underlineSuffix}
          </Text>
          <div className="mt-6 flex items-baseline gap-2">
            <Text size="sm" tone="tertiary">
              {MARKER_DEMO_COPY.circleLabel}
            </Text>
            <MarkerCircle className="px-2 py-1">
              <Heading level={4} className="m-0!">
                {MARKER_DEMO_COPY.circleValue}
              </Heading>
            </MarkerCircle>
          </div>
        </Card>

        <Card className="p-4">
          <div
            className="aspect-video w-full rounded-lg"
            style={{ background: 'linear-gradient(135deg, #e8e6de 0%, #d8d6cc 100%)' }}
            aria-hidden
          />
          <MarkerCaption
            className="mt-3"
            label={MARKER_DEMO_COPY.captionLabel}
            sublabel={MARKER_DEMO_COPY.captionSub}
            size="md"
            align="left"
          />
        </Card>

        <div className="relative flex items-center gap-10 pl-2">
          <Card className="flex-1 p-6">
            <Text size="sm" tone="tertiary" className="mb-1">
              {MARKER_DEMO_COPY.arrowFromTitle}
            </Text>
            <Text size="sm">{MARKER_DEMO_COPY.arrowFromBody}</Text>
          </Card>
          <MarkerArrow direction="right" length={56} className="shrink-0" />
          <Card className="flex-1 p-6">
            <Text size="sm" tone="tertiary" className="mb-1">
              {MARKER_DEMO_COPY.arrowToTitle}
            </Text>
            <Text size="sm">{MARKER_DEMO_COPY.arrowToBody}</Text>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function MarkerHoverDemo() {
  return (
    <div id="marker-hover" className="scroll-mt-24">
      <CompHeading name="MarkerHover">
        A hand-drawn mark that draws itself in on hover/focus and retracts on leave — the workshop accent. Circle,
        underline, arrow, squiggle, and hockey-stick, each contained within the word&apos;s band. Reduced motion → the
        mark appears instantly, no draw.
      </CompHeading>
      <div className="space-y-4 text-2xl leading-relaxed text-ink md:text-3xl">
        <p>
          We start with the <MarkerHover shape="circle">whole org</MarkerHover>,{' '}not a pilot.
        </p>
        <p>
          The work is <MarkerHover shape="underline" accent>hand-made</MarkerHover>{' '}before it&apos;s automated.
        </p>
        <p>
          From draft <MarkerHover shape="arrow">to shipped</MarkerHover>{' '}in one sprint.
        </p>
        <p>
          Imperfect, human, <MarkerHover shape="squiggle">alive</MarkerHover>{' '}— then precise.
        </p>
        <p>
          The number that actually <MarkerHover shape="hockeystick">moved</MarkerHover>.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// FOOTERS & CTAs
// ===========================================================================

export function NewsletterFooterDemo() {
  return (
    <div id="newsletter-footer" className="scroll-mt-24">
      <CompHeading name="NewsletterFooter">
        A warm newsletter opt-in + contact footer on a subtle <code>ShaderField</code> wash. Underline inputs, small
        inline socials, quiet contact block, pill CTA. All copy is a prop (structural placeholder here).
      </CompHeading>
      <NewsletterFooter
        eyebrow="Stay close to the work"
        heading={
          <>
            Let&apos;s build something <em className="font-serif-accent italic">worth building</em>.
          </>
        }
        blurb="Occasional notes on what we're learning building AI-native teams. No spam, unsubscribe anytime."
        socials={[
          { label: 'LinkedIn', href: '#' },
          { label: 'YouTube', href: '#' },
          { label: 'Substack', href: '#' },
        ]}
        contact={{ location: 'Remote · international team', email: 'hello@vibrana.ai', note: 'One honest inbox. A person reads it.' }}
        cta={{ label: 'Have a project? Let’s talk', href: '#' }}
      />
    </div>
  );
}

// ===========================================================================
// PROOF
// ===========================================================================

export function MetricProofDemo() {
  return (
    <div id="metric-proof" className="scroll-mt-24">
      <CompHeading name="MetricProof">
        Metric-led customer proof — lead with the numbers, then one honest line and its attribution (Stripe&apos;s
        stat-before-story fused with Notion&apos;s single true sentence). Composes <code>Stat</code>. All copy is a
        prop.
      </CompHeading>
      <Card className="p-8 md:p-10">
        <MetricProof
          eyebrow="Proof"
          statement={
            <>
              The number that moved wasn&apos;t a pilot metric — it was the{' '}
              <span className="font-serif-accent italic">whole team&apos;s</span> throughput.
            </>
          }
          metrics={[
            { value: '4.2×', label: 'baseline throughput, week one' },
            { value: '12 wks', label: 'to a client-owned AI OS' },
            { value: '91%', label: 'of the team still shipping at 90 days' },
          ]}
          attribution={{ name: 'Head of Operations', role: 'Series B fintech (anonymized)' }}
        />
      </Card>
    </div>
  );
}

// ===========================================================================
// MEDIA & IMAGERY — punk thumbnail
// ===========================================================================

export function PunkThumbnailDemo() {
  return (
    <div id="punk-thumbnail" className="scroll-mt-24">
      <CompHeading name="PunkThumbnail">
        Vintage-punk blog / newsletter thumbnail — a single-hue saturated ground with a halftone screen, a faint
        xerox-noise pass, an oversized bold title, and a mono edge label. Recolored off Koto&apos;s yellow into the
        Vibrana tones; ties to the sticker vibe. Copy-as-props; optional duotone image.
      </CompHeading>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PunkThumbnail
          tone="violet"
          kicker="Field notes"
          index="No. 13"
          category="Notes"
          date="Mon 15 Jun"
          title="Why most AI pilots quietly drop off the radar"
          href="#"
        />
        <PunkThumbnail
          tone="cyan"
          kicker="Playbook"
          index="No. 12"
          category="Playbook"
          date="Wed 18 Mar"
          title="The whole org is the unit of change, not the pilot"
          href="#"
        />
        <PunkThumbnail
          tone="amber"
          kicker="Dispatch"
          index="No. 11"
          category="Dispatch"
          date="Thu 23 Oct"
          title="You still need judgment in the age of the machine"
          image="/assets/imagery/homepage/prism-manmachine.webp"
          href="#"
        />
      </div>
    </div>
  );
}
