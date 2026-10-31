import { VibranaImage } from '@/src/components/imagery/VibranaImage'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * CollagePhotoTile — tile treatment for literal photographic content (AI-generated,
 * Unsplash-sourced, or NASA public-domain imagery), distinct from RoleImage (which is
 * purpose-built for abstract particle-art on white via multiply-blend + mask). A thin
 * wrapper over `VibranaImage` (the shared vintage-film frame primitive) — plain
 * object-cover crop, rounded corners, a soft shadow, and an optional low-opacity
 * theme-accent wash for cross-theme cohesion — no mask, no bokeh, no multiply blend.
 *
 * `aspect={false}` on the underlying `VibranaImage`: the `ImageCollageHero` tile
 * composition controls each tile's shape (16:9, 9:16, square, full-circle) via
 * `aspect-*`/`rounded-*` classes passed in through `className`. Those classes are routed
 * to `frameClassName` (the clipping box), not `className` (VibranaImage's outer motion
 * wrapper) — the frame must defer to the caller's shape, not the manifest's, and the
 * `rounded-full` a circular tile needs must land on the element that actually clips.
 *
 * Originally `AboutHeroPhotoTile` (still exported under that name from
 * `src/components/about/AboutHeroPhotoTile`).
 */
export interface CollagePhotoTileProps {
  src: string
  alt: string
  /** [c1, c2] rgb triples for the optional accent wash. */
  accents?: [string, string]
  className?: string
  /** Fixed rotation in degrees, e.g. -3.5. Hand-picked per tile, not randomized — same convention as PolaroidPhoto's `angle`. */
  angle?: number
  /** Preload this tile (next/image `priority`). Use on exactly one hero tile, for LCP. */
  priority?: boolean
  sizes?: string
}

export const COLLAGE_TILE_SIZES = '(max-width: 768px) 60vw, (max-width: 1280px) 40vw, 30vw'

export function CollagePhotoTile({ src, alt, accents, className, angle = 0, priority = false, sizes = COLLAGE_TILE_SIZES }: CollagePhotoTileProps) {
  const [c1] = accents ?? []

  return (
    <VibranaImage
      src={src}
      alt={alt}
      aspect={false}
      angle={angle}
      motion={false}
      hover={false}
      priority={priority}
      frameClassName={cn('rounded-2xl border-0 bg-transparent shadow-lg shadow-black/10', className)}
      overlay={
        c1 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(160deg, rgba(${c1},0.12), transparent 60%)` }}
          />
        ) : undefined
      }
      sizes={sizes}
    />
  )
}
