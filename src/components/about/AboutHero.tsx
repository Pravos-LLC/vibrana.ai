import { ArrowRight } from 'lucide-react'
import { ImageCollageHero, type CollageTile } from '@/src/components/imagery/ImageCollageHero'
import { Eyebrow, GradientText, Reveal } from '@/src/components/prism'
import { ABOUT_HERO, ABOUT_HERO_IMAGES } from '@/src/about-content'

const panel = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

// The About hero is a "Center-Seam Duality": a two-panel ImageCollageHero with
// machine/AI imagery on the left and planetary-crisis imagery on the right.
//
// Signature move: one oversized tile anchors each side from a *different*
// corner (top-left on the left, bottom-left on the right), with the remaining
// weight distributed asymmetrically, so the halves read as siblings, not mirrors.
// The top-left filler tile grazes the leading edge of the headline on purpose;
// the headline's opaque highlight blocks keep it legible.
export function AboutHero() {
  const machine = ABOUT_HERO_IMAGES.machine
  const crisis = ABOUT_HERO_IMAGES.crisis

  // Left / machine — 4 tiles: a horizontal dominant, a vertical filler tucked
  // into the top-left corner, a square counterweight, and a small circular
  // accent near the seam.
  const leftTiles: CollageTile[] = [
    { image: machine[0], position: 'left-[9%] top-[49%]', size: 'w-[50%]', aspect: 'aspect-video', angle: -3.5, z: 'z-6', float: 1, delay: '0s' },
    { image: machine[7], position: 'left-[5%] top-[20%]', size: 'w-[37%]', aspect: 'aspect-9/16', angle: -2.5, z: 'z-4', float: 3, delay: '0.5s' },
    { image: machine[1], position: 'right-[9%] bottom-[8%]', size: 'w-[27%]', aspect: 'aspect-square', angle: 2.5, z: 'z-3', float: 2, delay: '0.8s' },
    { image: machine[4], position: 'right-[7%] top-[calc(2%+100px)]', size: 'w-[16%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-5', float: 2, delay: '0.2s' },
  ]

  // Right / crisis — 5 tiles: dominant (opposite corner from the left's), a
  // vertical secondary, a small square accent, a companion circle, and the NASA
  // Earth photo as a circular backdrop.
  const rightTiles: CollageTile[] = [
    { image: crisis[0], position: 'left-[8%] bottom-[7%]', size: 'w-[52%]', aspect: 'aspect-video', angle: 2, z: 'z-2', float: 1, delay: '0.3s' },
    { image: crisis[6], position: 'right-[12%] top-[6%]', size: 'w-[24%]', aspect: 'aspect-3/4', angle: -4, z: 'z-3', float: 2, delay: '0.9s' },
    { image: crisis[4], position: 'right-[5%] top-[28%]', size: 'w-[19%]', aspect: 'aspect-square', angle: 3, z: 'z-4', float: 3, delay: '1.2s' },
    { image: crisis[5], position: 'left-[9%] top-[11%]', size: 'w-[9%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-5', float: 3, delay: '0.4s' },
    { image: crisis[8], position: 'right-[4%] bottom-[26%]', size: 'w-[30%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-1', float: 1, delay: '0.7s' },
  ]

  return (
    <ImageCollageHero
      panels={[
        { tiles: leftTiles, wash: 'radial-gradient(120% 100% at 28% 22%, rgba(59,130,246,0.08), transparent 62%)' },
        { tiles: rightTiles, wash: 'radial-gradient(120% 100% at 72% 78%, rgba(239,68,68,0.08), transparent 62%)' },
      ]}
      mobileImages={[machine[0], crisis[0]]}
    >
      <Reveal y={16} className="w-full">
        {/* Plainspeak label above the mission-statement headline — says
            outright what Vibrana is, since "we build for the edge of two
            futures" alone doesn't. */}
        <div className="mx-auto mb-4 w-fit bg-surface-base px-2 py-1 text-center">
          <Eyebrow>{ABOUT_HERO.topEyebrow}</Eyebrow>
        </div>
      </Reveal>

      <Reveal y={28} className="w-full">
        {/*
          Magazine-style solid highlight instead of a soft glow: each run of
          text sits on its own opaque white block (box-decoration-break:
          clone keeps that block correctly per-line if it ever wraps), like
          a highlighter pass in an editorial layout — invisible against the
          hero's own white background, a clean cut card wherever a tile
          actually sits behind it. Tight gap-x so the three boxes read as
          one continuous line, not three separate floating cards.
        */}
        <h1 className="mx-auto grid w-full max-w-6xl grid-cols-1 items-baseline justify-items-center gap-x-1 gap-y-2 text-center font-display text-3xl font-semibold leading-[1.2] tracking-tight text-ink sm:text-4xl md:grid-cols-[1fr_auto_1fr] md:justify-items-stretch md:text-left md:text-4xl lg:text-5xl">
          {/*
            justify-self (not justify-items:stretch, the grid default) —
            grid items blockify and stretch to fill their 1fr column by
            default, which balloons the highlight background out to the
            full column width instead of hugging just the text.
          */}
          <span
            className="w-fit whitespace-nowrap bg-surface-base py-1 pl-2 pr-1 md:justify-self-end md:text-right"
            style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
          >
            {ABOUT_HERO.seamLeft}
          </span>
          <span
            className="w-fit whitespace-nowrap bg-surface-base px-1 py-1 md:px-2"
            style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
          >
            <GradientText gradient="prism" className="font-serif-accent text-4xl leading-[1.15] md:text-5xl md:leading-none lg:text-6xl">
              {ABOUT_HERO.seamWord}
            </GradientText>
          </span>
          <span
            className="w-fit whitespace-nowrap bg-surface-base py-1 pl-1 pr-2 md:justify-self-start md:text-left"
            style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
          >
            {ABOUT_HERO.seamRight}
          </span>
        </h1>
      </Reveal>

      <Reveal delay={0.12} y={24} className={`pointer-events-auto mt-10 w-full max-w-xl p-6 text-center sm:p-8 ${panel}`}>
        <Eyebrow className="text-center">{ABOUT_HERO.eyebrow}</Eyebrow>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-secondary sm:text-base sm:leading-7">
          {ABOUT_HERO.subtitle}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={ABOUT_HERO.ctaPrimary.href} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-ink px-7 py-3 text-sm font-medium text-surface-base transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-frost">
            {ABOUT_HERO.ctaPrimary.label}
            <ArrowRight size={16} aria-hidden />
          </a>
          <a href={ABOUT_HERO.ctaSecondary.href} className="rounded text-sm font-medium text-ink-secondary underline decoration-line-subtle underline-offset-4 transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-frost">
            {ABOUT_HERO.ctaSecondary.label}
          </a>
        </div>
      </Reveal>
    </ImageCollageHero>
  )
}
