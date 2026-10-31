'use client';

import React from 'react';
import Image from '@/src/components/PublicDemoImage';
import { motion } from 'framer-motion';
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion';
import { cn } from '@/src/components/prism/utils/cn';
import { getImagery, type ImageryAsset } from '@/src/imagery-manifest';

/**
 * VibranaImage — the canonical vintage-film image frame.
 *
 * Unifies the two treatments that grew up independently while the imagery
 * engine (Wave 1) was landing assets: `AboutHeroPhotoTile`'s plain rounded
 * photo tile (used inside the About hero's scattered tile collage, where the
 * PARENT controls shape via `aspect-*`/`rounded-*` classes) and the
 * gallery-card treatment (a self-contained card at the image's natural
 * aspect, with an optional Playfair caption underneath and a floating
 * overlay slot for `ImageryOverlay`).
 *
 * Resolve the image EITHER by `id` (looked up in the imagery manifest via
 * `getImagery`) or `asset` (an already-resolved `ImageryAsset`) or a manual
 * `src`/`alt`/`aspect` triple. `aspect` defaults to the resolved asset's
 * declared aspect ("natural aspect" — the gallery-card case); pass an
 * explicit CSS aspect-ratio string to force a different crop, or `false` to
 * skip the inline aspect-ratio entirely and let the parent's own
 * `aspect-*`/`rounded-*` classes (via `className`/`frameClassName`) define
 * the box shape — the About-hero-tile case, where tiles are square, 9:16,
 * 16:9, and full-circle crops of the same source photos.
 */

export type VibranaImageAspect = string | false;

export interface VibranaImageCaption {
  title?: string;
  body?: string;
}

export interface VibranaImageProps {
  /** Resolve the asset from the imagery manifest. Mutually exclusive with `asset`/manual `src`. */
  id?: string;
  /** An already-resolved manifest asset (skip the `getImagery` lookup). */
  asset?: ImageryAsset;
  /** Manual override — required together with `alt` when neither `id` nor `asset` is given. */
  src?: string;
  alt?: string;
  /**
   * CSS `aspect-ratio` value, e.g. "4 / 5". Defaults to the resolved asset's
   * declared aspect (natural aspect — gallery-card default). Pass `false` to
   * omit the inline aspect-ratio entirely and let `className`/`frameClassName`
   * (`aspect-*` Tailwind utilities) define the shape instead.
   */
  aspect?: VibranaImageAspect;
  /**
   * Playfair title + body caption below the image. Off by default.
   * `true` pulls `title`/`description` from the resolved asset; pass an
   * object to override either field (useful with manual `src`/`alt`).
   */
  caption?: boolean | VibranaImageCaption;
  /** Floating content over the image (see `ImageryOverlay`) — positioned by the overlay itself. */
  overlay?: React.ReactNode;
  /** Scroll-triggered fade+rise reveal. Default on; auto-static under `prefers-reduced-motion`. */
  motion?: boolean;
  /** Hover lift (frame) + slow image scale. Default on; auto-static under `prefers-reduced-motion`. */
  hover?: boolean;
  /** Fixed rotation in degrees, e.g. -3.5. Hand-picked per tile, not randomized — same convention as `PolaroidPhoto`/`AboutHeroPhotoTile`'s `angle`. */
  angle?: number;
  priority?: boolean;
  sizes?: string;
  /** Outer wrapper (the motion/reveal element). */
  className?: string;
  /** The frame itself — the rounded, bordered, `overflow-hidden` box. */
  frameClassName?: string;
  imageClassName?: string;
  captionClassName?: string;
}

const DEFAULT_SIZES = '(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 33vw';

export function VibranaImage({
  id,
  asset,
  src,
  alt,
  aspect,
  caption,
  overlay,
  motion: motionEnabled = true,
  hover = true,
  angle = 0,
  priority = false,
  sizes = DEFAULT_SIZES,
  className,
  frameClassName,
  imageClassName,
  captionClassName,
}: VibranaImageProps) {
  const reduce = useHydratedReducedMotion();
  const resolvedAsset = asset ?? (id ? getImagery(id) : undefined);

  const finalSrc = src ?? resolvedAsset?.file;
  const finalAlt = alt ?? resolvedAsset?.description ?? resolvedAsset?.title ?? '';

  if (!finalSrc) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('VibranaImage: provide `id`, `asset`, or `src` (+ `alt`).');
    }
    return null;
  }

  const resolvedAspect: VibranaImageAspect =
    aspect !== undefined ? aspect : (resolvedAsset?.aspect ?? false);

  const captionContent: VibranaImageCaption | null =
    caption === true
      ? { title: resolvedAsset?.title, body: resolvedAsset?.description }
      : caption && typeof caption === 'object'
        ? {
            title: caption.title ?? resolvedAsset?.title,
            body: caption.body ?? resolvedAsset?.description,
          }
        : null;

  const animateMotion = motionEnabled && !reduce;
  const animateHover = hover && !reduce;

  const frame = (
    <div
      className={cn(
        'group/vibrana-image relative overflow-hidden rounded-2xl border border-black/10 bg-ink shadow-lg shadow-black/10',
        animateHover &&
          'transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-black/15',
        frameClassName,
      )}
      style={angle ? { transform: `rotate(${angle}deg)` } : undefined}
    >
      <div
        className="relative w-full overflow-hidden"
        style={resolvedAspect ? { aspectRatio: resolvedAspect } : { height: '100%' }}
      >
        <Image
          src={finalSrc}
          alt={finalAlt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover',
            animateHover && 'transition-transform duration-500 ease-out group-hover/vibrana-image:scale-[1.04]',
            imageClassName,
          )}
        />
        {overlay && (
          <div className="pointer-events-none absolute inset-0" aria-hidden={false}>
            {overlay}
          </div>
        )}
      </div>

      {captionContent && (captionContent.title || captionContent.body) && (
        <div className={cn('space-y-1 px-5 py-4', captionClassName)}>
          {captionContent.title && (
            <h3 className="font-serif-accent text-lg leading-[1.3] text-white">{captionContent.title}</h3>
          )}
          {captionContent.body && (
            <p className="text-sm leading-relaxed text-white/70">{captionContent.body}</p>
          )}
        </div>
      )}
    </div>
  );

  if (!animateMotion) {
    // Skip the wrapper entirely when there's no outer class to apply — keeps
    // the frame as the actual rendered root so percentage sizing (`h-full`,
    // `w-full`) set by a caller-controlled ancestor (e.g. the About hero's
    // tile positioning) resolves correctly, with no anonymous auto-height
    // div sitting in between.
    return className ? <div className={className}>{frame}</div> : frame;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
    >
      {frame}
    </motion.div>
  );
}
