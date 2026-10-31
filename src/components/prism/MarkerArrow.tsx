import React from 'react';
import { cn } from './utils/cn';
import { MarkerDrawPath } from './markerDrawPath';

/**
 * MarkerArrow — a hand-drawn Sharpie arrow pointing from one element toward
 * another (e.g. from a caption toward the thing it explains). Draws itself in
 * on scroll (shaft first, then the two barbs, see markerDrawPath.tsx). Drawn
 * the way a designer draws an arrow — nice, balanced, symmetric geometry —
 * with the hand-drawn character living only in stroke texture, not in the
 * shape: one clean, gently bowed shaft (never a wavy/S-curve) plus a second,
 * thinner texture pass over its middle third, then a balanced symmetric head
 * (two barbs mirrored about the shaft's end tangent, same length and angle).
 *
 * `prefers-reduced-motion` renders the stroke fully drawn, static.
 *
 * Positioning is the consumer's job: place it in a `relative` wrapper with
 * `className="absolute ..."` between the two elements it connects.
 *
 * RESTRAINT: one of a small marker-accent family (see MarkerNote,
 * MarkerCaption, MarkerUnderline, MarkerCircle). Max 1-2 marker moments per
 * viewport. NEVER pointing at or from a section heading or eyebrow.
 */
export interface MarkerArrowProps {
  /** Compass direction the arrow points. Default 'right'. */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Rendered width along its long axis, in px. Default 72. */
  length?: number;
  accent?: boolean;
  className?: string;
}

const ROTATE: Record<NonNullable<MarkerArrowProps['direction']>, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export function MarkerArrow({ direction = 'right', length = 72, accent = false, className }: MarkerArrowProps) {
  const ink = accent ? 'var(--violet-strong)' : 'var(--text-primary)';

  return (
    <svg
      aria-hidden
      width={length}
      height={length * 0.4}
      viewBox="0 0 100 40"
      className={cn('pointer-events-none', className)}
      style={{ transform: `rotate(${ROTATE[direction]}deg)`, overflow: 'visible' }}
    >
      {/* shaft: a single gentle bow, monotonic left-to-right — no wave reversal */}
      <MarkerDrawPath d="M4 20 C 32 14, 62 14, 90 20" stroke={ink} strokeWidth={2.8} />
      {/* texture pass: shorter, thinner second stroke over the middle third,
          simulating uneven marker pressure on an otherwise clean line */}
      <MarkerDrawPath
        d="M30 15.6 C 46 13.4, 60 13.4, 68 15"
        stroke={ink}
        strokeWidth={1.3}
        opacity={0.5}
        delay={0.12}
        duration={0.3}
      />
      {/* head: two barbs mirrored about the shaft's end tangent — same length,
          same angle, balanced and symmetric */}
      <MarkerDrawPath d="M90 20 C 84 14, 80 10, 75 6" stroke={ink} strokeWidth={2.6} delay={0.5} duration={0.16} />
      <MarkerDrawPath d="M90 20 C 84 26, 80 30, 75 34" stroke={ink} strokeWidth={2.6} delay={0.52} duration={0.16} />
    </svg>
  );
}
