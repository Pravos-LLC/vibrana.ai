import React from 'react';
import { cn } from './utils/cn';
import { MarkerDrawPath } from './markerDrawPath';

/**
 * MarkerUnderline — wraps inline text with a hand-drawn Sharpie underline
 * that draws itself in on scroll (stroke-dashoffset, see markerDrawPath.tsx).
 * The stroke is two authored passes, not a wobble filter: a full-width base
 * stroke plus a shorter, thinner second pass offset over the middle third,
 * simulating uneven marker pressure and a real double-pass underline. The
 * base pass ends with a small ink overshoot past the last letter, the way a
 * hand-drawn underline actually flicks off the page instead of stopping dead.
 *
 * `prefers-reduced-motion` renders the stroke fully drawn, static.
 *
 * RESTRAINT: one of a small marker-accent family (see MarkerNote,
 * MarkerCaption, MarkerCircle, MarkerArrow). Max 1-2 marker moments per
 * viewport. NEVER under a section heading or eyebrow. This marks emphasis in
 * a sentence, it does not replace bold/italic in running body copy, and it is
 * never used on a headline.
 */
export interface MarkerUnderlineProps {
  children: React.ReactNode;
  /** Single brand accent instead of near-black ink. Rare, one per viewport max. */
  accent?: boolean;
  className?: string;
}

export function MarkerUnderline({ children, accent = false, className }: MarkerUnderlineProps) {
  const ink = accent ? 'var(--violet-strong)' : 'var(--text-primary)';

  return (
    <span className={cn('relative inline-block', className)}>
      {children}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-full"
        style={{ width: '100%', height: '0.38em', marginTop: '-0.42em', overflow: 'visible' }}
        viewBox="0 0 200 24"
        preserveAspectRatio="none"
      >
        <MarkerDrawPath
          d="M4 13 C 42 8, 92 19, 132 11 C 162 6, 182 14, 197 9 C 200 8, 201 7, 202 5"
          stroke={ink}
          strokeWidth={3.2}
        />
        <MarkerDrawPath
          d="M22 11 C 58 6, 104 17, 152 10"
          stroke={ink}
          strokeWidth={1.6}
          opacity={0.55}
          delay={0.08}
          duration={0.35}
        />
      </svg>
    </span>
  );
}
