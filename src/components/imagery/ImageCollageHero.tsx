import type { ReactNode } from 'react'
import { CollagePhotoTile } from './CollagePhotoTile'
import { RoleImage } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * ImageCollageHero — the floating film-tile collage hero, extracted from the About
 * page so any page can use it. The component owns the composition mechanics (tile
 * positioning, the three-layer entrance/float/rotate stack, the mobile fallback,
 * the reduced-motion rules). The page owns the tiles and the centred content,
 * which it passes as `children`.
 *
 * Tile-cluster scale: a 3-tier token system (dominant / secondary / tertiary):
 *   dominant  ~52-56% of the panel's width — the one tile that anchors the read
 *   secondary ~24-28% — supporting weight
 *   tertiary  ~18-20% — a small accent
 *
 * Aspect-ratio system: every tile's `aspect` is picked to match (or lightly crop,
 * never stretch) its source photo's real dimensions, so tiles split across
 * horizontal / vertical / square / circle rather than one uniform ratio.
 *
 * Text/imagery overlap is intentional, not avoided. Legibility over the overlap
 * is handled by the page's content itself (the About headline sits on opaque
 * highlight blocks), not by keeping tiles at a polite distance.
 *
 * `panels`: one panel spans the full width; two panels form a diptych split by a
 * hairline seam (the About layout).
 */
export interface CollageImage {
  /** Path under /public. */
  src: string
  alt: string
  /** Drives which tile component renders it — RoleImage (illustration) vs CollagePhotoTile (photo). */
  kind: 'illustration' | 'photo'
  /** [c1, c2] rgb triples — the accent wash on photos, the bokeh on illustrations. */
  accents?: [string, string]
  /** Only meaningful for kind: 'illustration' (RoleImage's bokeh seed). */
  seed?: number
}

export interface CollageTile {
  image: CollageImage
  /** Tailwind top/left/right/bottom classes, relative to the panel. */
  position: string
  /** Tailwind width class. */
  size: string
  /** Tailwind aspect-ratio (and optional `rounded-full`) classes, matched to the source photo. */
  aspect: string
  /** Fixed, hand-picked rotation in degrees — same convention as PolaroidPhoto's `angle`. */
  angle: number
  z: string
  float: 1 | 2 | 3
  /** Entrance + float stagger, e.g. '0.4s'. */
  delay: string
  /** Preload this tile. Use on one tile per page, for LCP. */
  priority?: boolean
}

export interface CollagePanel {
  tiles: CollageTile[]
  /** A soft background wash behind the panel's tiles (a CSS background value). */
  wash?: string
}

export interface CollageMobileImage extends CollageImage {
  priority?: boolean
}

export interface ImageCollageHeroProps {
  panels: CollagePanel[]
  /** Hairline divider down the middle. Defaults on for a two-panel diptych. */
  seam?: boolean
  /** Calm, untilted tiles shown above the content on mobile (in document flow). */
  mobileImages: CollageMobileImage[]
  /** Aspect class for each mobile tile. */
  mobileAspect?: string
  /** Top padding of the mobile tile row (clears the fixed nav). */
  mobileTopClassName?: string
  /**
   * Where the mobile tile row sits: above the content (the About layout) or below
   * it, so the headline and button land higher on a phone.
   */
  mobilePlacement?: 'above' | 'below'
  /** `sizes` for the mobile tiles. Match it to the row (e.g. 34vw for three across). */
  mobileSizes?: string
  /** The centred content (eyebrow, headline, card). Rendered over the collage on desktop. */
  children: ReactNode
  id?: string
  className?: string
}

// The desktop collage is display:none below md, so its tiles declare a 1px slot
// there. That keeps a preloaded (priority) desktop tile from pulling a large
// image on phones, where the mobile row shows its own copy.
const DESKTOP_TILE_SIZES = '(max-width: 767px) 1px, (max-width: 1280px) 40vw, 30vw'

const FLOAT_CLASS = { 1: 'collage-hero-float-1', 2: 'collage-hero-float-2', 3: 'collage-hero-float-3' } as const
const MOBILE_COLS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }

function Tile({ tile }: { tile: CollageTile }) {
  const { image, position, size, aspect, angle, z, float, delay, priority } = tile
  return (
    // Three nested layers, each owning one transform so they never fight:
    // outer = load-in entrance (opacity/scale/translateY, runs once, staggered
    // via each tile's own `delay`), middle = the perpetual float loop, inner =
    // the fixed hand-picked rotate. A single element animating two competing
    // `transform` keyframes would just have the later one win.
    <div className={cn('absolute collage-hero-in', position, size, z)} style={{ animationDelay: delay }}>
      <div className={FLOAT_CLASS[float]} style={{ animationDelay: delay }}>
        <div style={{ transform: `rotate(${angle}deg)` }}>
          {image.kind === 'photo' ? (
            <CollagePhotoTile src={image.src} alt={image.alt} accents={image.accents} priority={priority} sizes={DESKTOP_TILE_SIZES} className={cn(aspect, 'w-full')} />
          ) : (
            <div className={cn(aspect, 'w-full overflow-hidden rounded-2xl shadow-lg shadow-black/10')}>
              <RoleImage src={image.src} alt={image.alt} accents={image.accents!} seed={image.seed!} className="h-full w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ImageCollageHero({
  panels,
  seam = panels.length === 2,
  mobileImages,
  mobileAspect = 'aspect-4/3',
  mobileTopClassName = 'pt-16',
  mobileSizes,
  mobilePlacement = 'above',
  children,
  id,
  className,
}: ImageCollageHeroProps) {
  const below = mobilePlacement === 'below'
  const mobileRow = (
    <div className={cn('grid gap-3 px-4 sm:px-6 md:hidden', below ? 'pb-10' : cn('pb-2', mobileTopClassName), MOBILE_COLS[mobileImages.length] ?? 'grid-cols-2')}>
      {mobileImages.map((image) => (
        <div key={image.src} className={cn(mobileAspect, 'w-full overflow-hidden rounded-2xl shadow-lg shadow-black/10')}>
          <CollagePhotoTile src={image.src} alt={image.alt} accents={image.accents} priority={image.priority} sizes={mobileSizes} className="h-full w-full" />
        </div>
      ))}
    </div>
  )

  return (
    <section id={id} className={cn('relative overflow-hidden md:min-h-dvh', className)}>
      {/*
        Mobile only: the desktop's scattered, tilted, overlapping collage doesn't
        survive a narrow stacked layout, so mobile gets calm, untilted,
        non-overlapping tiles in normal document flow, above or below the content
        (`mobilePlacement`), never behind it.
      */}
      {!below && mobileRow}

      {/* Desktop only: the full scattered/tilted/overlapping composition. */}
      <div className={cn('relative z-0 hidden min-h-dvh grid-cols-1 md:grid', panels.length === 2 && 'md:grid-cols-2')}>
        {panels.map((panel, p) => (
          <div key={p} className="relative overflow-hidden">
            {panel.wash && <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: panel.wash }} />}
            {panel.tiles.map((tile, i) => (
              <Tile key={i} tile={tile} />
            ))}
          </div>
        ))}
      </div>

      {seam && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-line-subtle md:block" />
      )}

      {/*
        Mobile: normal document flow, sized by its own content, right after the
        mobile image row — never overlaid on imagery. Desktop: absolute inset-0,
        centred over the collage. Children opt back in to pointer events.
      */}
      <div className={cn('pointer-events-none relative z-10 flex flex-col items-center justify-center px-6 py-10 md:absolute md:inset-0 md:py-16', below && mobileTopClassName)}>
        {children}
      </div>

      {below && mobileRow}

      <style>{`
        /*
          Load-in entrance: each tile fades up from opacity:0 / translateY(50px) /
          scale(0.92) to settled, once, staggered by the tile's own delay. Runs on
          the OUTER wrapper only; the perpetual float lives one layer in.
        */
        @keyframes collage-hero-in {
          from { opacity: 0; transform: translateY(50px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .collage-hero-in { animation: collage-hero-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes collage-hero-float-1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes collage-hero-float-2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes collage-hero-float-3 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .collage-hero-float-1 { animation: collage-hero-float-1 7s ease-in-out infinite; }
        .collage-hero-float-2 { animation: collage-hero-float-2 8.5s ease-in-out infinite; }
        .collage-hero-float-3 { animation: collage-hero-float-3 6.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .collage-hero-in { animation: none; opacity: 1; }
          .collage-hero-float-1, .collage-hero-float-2, .collage-hero-float-3 { animation: none; }
        }
      `}</style>
    </section>
  )
}
