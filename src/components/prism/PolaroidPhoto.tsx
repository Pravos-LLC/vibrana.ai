'use client';

import React, { useState } from 'react';
import Image from '@/src/components/PublicDemoImage';
import { cn } from './utils/cn';
import { MarkerCaption } from './MarkerCaption';

/**
 * PolaroidPhoto — a real photo framed as a physical instant-print object: cream
 * border (thick at the bottom, like the classic caption strip), a slight fixed
 * rotation, a soft drop shadow, and the person's name + role handwritten across
 * the strip in a Sharpie-style marker face (`--font-marker`, see app/layout.tsx
 * — a scoped accent, not a system-wide third font). Straightens, grows, and
 * deepens its shadow on hover/focus. Click/tap (or Enter/Space) flips the card
 * 3D to reveal a second photo on the back — a small hidden-gift moment. The
 * source images should already carry the light vintage grade (warm cast, fine
 * grain, face fully clear) — this component only handles the physical "photo
 * object" framing and the flip interaction, not the color treatment.
 *
 * The caption strip is rendered via MarkerCaption (src/components/prism/MarkerCaption.tsx),
 * the generalized marker-accent caption component; this is a pixel-stable refactor
 * (same markup shape, same classes/colors), not a visual change.
 */
export interface PolaroidPhotoProps {
  src: string;
  alt: string;
  /** Handwritten on the caption strip. */
  name: string;
  /** Handwritten under the name, smaller and in gray, e.g. "Founder". */
  role: string;
  /** Fixed rotation in degrees, e.g. -3.5. Pick by hand per photo, not randomly. */
  angle: number;
  /**
   * Second photo revealed on flip — a candid, off-duty moment, not another
   * studio shot. Omit until a real photo exists; a placeholder back renders
   * instead (never fabricate a "life" photo of a real person).
   */
  backSrc?: string;
  backAlt?: string;
  className?: string;
}

export function PolaroidPhoto({
  src,
  alt,
  name,
  role,
  angle,
  backSrc,
  backAlt,
  className,
}: PolaroidPhotoProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={`Photo of ${name}. Click to ${flipped ? 'flip back' : 'reveal another photo'}.`}
      className={cn(
        'group/polaroid inline-block cursor-pointer appearance-none rounded-[3px] border-0 bg-transparent p-0 text-left',
        'perspective-[1400px]',
        className,
      )}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <span
        className={cn(
          'relative block transition-transform duration-300 ease-out will-change-transform',
          'group-hover/polaroid:-rotate-1 group-hover/polaroid:scale-[1.04] group-focus-visible/polaroid:-rotate-1 group-focus-visible/polaroid:scale-[1.04]',
        )}
      >
        {/* the 3D flip stage */}
        <span
          className="motion-reduce:transition-none! relative block transition-transform duration-700 transform-3d"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* front face */}
          <span
            className={cn(
              'block rounded-[3px] bg-[#fdfbf5] p-3 pb-6 backface-hidden',
              'shadow-[0_2px_4px_rgba(15,15,17,0.08),0_22px_34px_-16px_rgba(15,15,17,0.35)]',
              'transition-shadow duration-300 group-hover/polaroid:shadow-[0_4px_8px_rgba(15,15,17,0.12),0_30px_44px_-16px_rgba(15,15,17,0.45)] group-focus-visible/polaroid:shadow-[0_4px_8px_rgba(15,15,17,0.12),0_30px_44px_-16px_rgba(15,15,17,0.45)]',
            )}
          >
            <span className="relative block aspect-square w-full overflow-hidden bg-[#e8e6de]">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 240px"
                className="object-cover"
              />
            </span>
            <MarkerCaption className="mt-3" label={name} sublabel={role} size="lg" ink="#2a2a35" />
          </span>

          {/* back face */}
          <span
            className={cn(
              'absolute inset-0 block rounded-[3px] bg-[#fdfbf5] p-3 pb-6 backface-hidden',
              'shadow-[0_2px_4px_rgba(15,15,17,0.08),0_22px_34px_-16px_rgba(15,15,17,0.35)]',
            )}
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="relative block aspect-square w-full overflow-hidden bg-[#e8e6de]">
              {backSrc ? (
                <Image
                  src={backSrc}
                  alt={backAlt ?? `${name}, off duty`}
                  fill
                  sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 240px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#efece2] px-4 text-center text-xs text-ink-tertiary">
                  More of {name.split(' ')[0]}, coming soon
                </span>
              )}
            </span>
            <MarkerCaption className="mt-3" label="tap to flip back" size="sm" ink="var(--text-tertiary)" />
          </span>
        </span>
      </span>
    </button>
  );
}
