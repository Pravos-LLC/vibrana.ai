import { ImageCollageHero, type CollageImage, type CollageTile } from '@/src/components/imagery/ImageCollageHero'
import { Eyebrow, GradientText } from '@/src/components/prism'
import { getImagery } from '@/src/imagery-manifest'
import { SPRINT_HERO } from '@/src/ai-build-sprint-content'
import { SprintCta } from './SprintCta'

export const SPRINT_HERO_ID = 'sprint-hero'

/** Resolve a hero tile from the imagery manifest (alt text is the manifest description). */
function tile(id: string): CollageImage {
  const asset = getImagery(id)
  if (!asset) throw new Error(`SprintHero: imagery asset "${id}" is missing from the manifest`)
  return { src: asset.file, alt: asset.description ?? asset.title ?? '', kind: 'photo' }
}

// One full-width panel, seven tiles (research/landing-pages/ai-build-sprint-imagery.md).
// The tiles hold the left and right thirds and the top band, leaving the centre
// column for the headline and card. The whiteboard tile is the dominant read and
// the one preloaded tile on desktop. On mobile the tile row sits below the button,
// so nothing there is preloaded and the headline is the first thing to paint.
const TILES: CollageTile[] = [
  { image: tile('sprint-whiteboard-team'), position: 'left-[3%] top-[15%]', size: 'w-[19%]', aspect: 'aspect-4/5', angle: -3, z: 'z-4', float: 1, delay: '0s', priority: true },
  { image: tile('sprint-hourglass'), position: 'left-[21%] top-[10%]', size: 'w-[8%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-5', float: 3, delay: '0.4s' },
  { image: tile('ppl-stickynotes-v2'), position: 'left-[6%] bottom-[6%]', size: 'w-[22%]', aspect: 'aspect-video', angle: 2.5, z: 'z-3', float: 2, delay: '0.7s' },
  { image: tile('sprint-prototype-laptop'), position: 'right-[3%] top-[14%]', size: 'w-[23%]', aspect: 'aspect-3/2', angle: 3, z: 'z-3', float: 2, delay: '0.2s' },
  { image: tile('prism-grid-solar'), position: 'right-[25%] top-[8%]', size: 'w-[6%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-5', float: 1, delay: '0.9s' },
  { image: tile('ppl-cafe-laptop'), position: 'right-[5%] top-[48%]', size: 'w-[17%]', aspect: 'aspect-3/2', angle: -2.5, z: 'z-4', float: 3, delay: '0.5s' },
  { image: tile('sprint-hands-keyboard'), position: 'right-[20%] bottom-[7%]', size: 'w-[9%]', aspect: 'aspect-square rounded-full', angle: 0, z: 'z-2', float: 1, delay: '1.1s' },
]

const MOBILE = [
  tile('sprint-whiteboard-team'),
  tile('sprint-prototype-laptop'),
  tile('sprint-hourglass'),
]

const block = 'bg-surface-base px-2 py-1'
const clone = { boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' } as const

export function SprintHero() {
  const { eyebrow, headline, subhead, microcopy } = SPRINT_HERO
  const fullHeadline = `${headline.lead} ${headline.accent} ${headline.trail} ${headline.second}`

  return (
    <ImageCollageHero
      id={SPRINT_HERO_ID}
      panels={[{ tiles: TILES, wash: 'radial-gradient(55% 50% at 50% 45%, rgba(124,58,237,0.06), transparent 100%)' }]}
      mobileImages={MOBILE}
      mobileAspect="aspect-5/4"
      mobilePlacement="below"
      mobileTopClassName="pt-24"
      mobileSizes="34vw"
    >
      <div className="w-full">
        <div className="mx-auto mb-4 w-fit bg-surface-base px-2 py-1 text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      </div>

      {/*
        No JS entrance on the text: the headline is the LCP element on mobile, so it
        paints with the HTML instead of waiting for hydration. The tiles carry the motion.
      */}
      <div className="w-full">
        {/*
          The About headline treatment: every run of text sits on its own opaque
          white block, so it reads cleanly wherever a tile passes behind it. The
          visual blocks drop the spaces between runs, so screen readers get the
          sentence from an sr-only copy instead.
        */}
        <h1 className="mx-auto max-w-5xl text-center font-display text-[2.15rem] font-semibold leading-[1.2] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          <span className="sr-only">{fullHeadline}</span>
          <span aria-hidden className="flex flex-col items-center gap-y-2">
            <span className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-2">
              <span className={block}>{headline.lead}</span>
              <span className={block}>
                <GradientText gradient="prism" className="font-serif-accent pr-1 text-[2.5rem] leading-[1.15] sm:text-6xl sm:leading-none lg:text-7xl">
                  {headline.accent}
                </GradientText>
              </span>
              <span className={block}>{headline.trail}</span>
            </span>
            <span className={block} style={clone}>
              {headline.second}
            </span>
          </span>
        </h1>
      </div>

      <div
        className="pointer-events-auto mt-6 w-full max-w-xl rounded-2xl border border-line-subtle bg-(--surface-nav) p-6 text-center backdrop-blur-md sm:mt-10 sm:p-8"
      >
        <p className="mx-auto max-w-md leading-relaxed! text-ink-secondary">{subhead}</p>
        <SprintCta location="hero" className="mt-6" />
        <p className="type-sm mx-auto mt-4 max-w-md text-ink-secondary">{microcopy}</p>
      </div>
    </ImageCollageHero>
  )
}
