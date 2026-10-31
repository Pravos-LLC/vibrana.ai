import React from 'react';
import { cn } from './utils/cn';
import { MarkerDrawPath } from './markerDrawPath';

/**
 * MarkerCircle — wraps inline text (a number, a short phrase) with a
 * hand-drawn circle, like someone circled the important figure on a printout.
 * Draws itself in on scroll (stroke-dashoffset, see markerDrawPath.tsx). The
 * loop is a real irregular path, not a `<circle>` with a wobble filter: it
 * authors an imperfect closure (the stroke overlaps a little past its own
 * start point, the way a hand actually finishes a circle) plus a second,
 * shorter inner pass over part of the arc for uneven pressure.
 *
 * `prefers-reduced-motion` renders the stroke fully drawn, static.
 *
 * RESTRAINT: one of a small marker-accent family (see MarkerNote,
 * MarkerCaption, MarkerUnderline, MarkerArrow). Max 1-2 marker moments per
 * viewport. NEVER around a section heading or eyebrow.
 */
export interface MarkerCircleProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function MarkerCircle({ children, accent = false, className }: MarkerCircleProps) {
  const ink = accent ? 'var(--violet-strong)' : 'var(--text-primary)';

  return (
    <span className={cn('relative inline-block', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: '-12%', top: '-22%', width: '124%', height: '144%', overflow: 'visible' }}
        viewBox="0 0 120 56"
        preserveAspectRatio="none"
      >
        <MarkerDrawPath
          d="M62 4 C 92 3, 114 16, 115 28 C 116 41, 90 51, 59 50 C 27 49, 3 40, 4 26 C 5 13, 28 3, 58 5 C 64 5, 70 7, 65 9"
          stroke={ink}
          strokeWidth={2.6}
        />
        <MarkerDrawPath
          d="M20 40 C 12 30, 12 18, 26 9"
          stroke={ink}
          strokeWidth={1.4}
          opacity={0.5}
          delay={0.1}
          duration={0.3}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
