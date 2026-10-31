import React from 'react';
import { cn } from './utils/cn';

/**
 * MarkerNote — a small handwritten margin annotation for a stat, a diagram,
 * or a screenshot: like someone marked up a printout with a Sharpie ("wait,
 * this is the whole thesis", "+40% here"). One of a small family of marker
 * accents (see also MarkerCaption, MarkerUnderline, MarkerCircle, MarkerArrow)
 * that spread the Permanent Marker face (`--font-marker`, app/layout.tsx)
 * beyond its original Polaroid-caption home, in service of the brand thesis:
 * an AI transformation studio that retained its humanity.
 *
 * RESTRAINT RULES (mirrored in research/design-components/marker-accents.md):
 * - Max 1-2 marker moments per viewport, ever. This is a rare accent, not a
 *   pattern to repeat down every section.
 * - NEVER in section headers or eyebrows. Marker never touches the structural
 *   heading system (explicit JE exclusion).
 * - Annotation, not typography: never body copy, never a headline substitute.
 * - Ink is near-black (default) or ONE brand accent per moment, never both in
 *   the same viewport, and never mixed with a second (warm) accent.
 *
 * Positioning is the consumer's job: this renders as a normal flow element
 * that the caller places with `className` (typically `absolute` inside a
 * `relative` wrapper next to the thing being annotated). `side` only informs
 * text alignment and the direction of the small hand-drawn connector flick.
 */
export interface MarkerNoteProps {
  /** Short handwritten phrase. Keep it to a few words, one line ideally. */
  children: React.ReactNode;
  /** Which side of the annotated content this note sits on. Default 'right'. */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Fixed rotation in degrees, clamped to +/-2deg (the "hand-touched, not chaotic" range). */
  rotation?: number;
  /** Use the single brand accent ink instead of near-black. Rare, one per viewport max. */
  accent?: boolean;
  /** Render the small hand-drawn connector flick pointing toward `side`. Default true. */
  leader?: boolean;
  className?: string;
}

const SIDE_ALIGN: Record<NonNullable<MarkerNoteProps['side']>, string> = {
  left: 'text-right',
  right: 'text-left',
  top: 'text-center',
  bottom: 'text-center',
};

const LEADER_ROTATE: Record<NonNullable<MarkerNoteProps['side']>, number> = {
  right: 0,
  left: 180,
  bottom: 90,
  top: 270,
};

export function MarkerNote({
  children,
  side = 'right',
  rotation = -1.5,
  accent = false,
  leader = true,
  className,
}: MarkerNoteProps) {
  const clampedRotation = Math.max(-2, Math.min(2, rotation));
  const ink = accent ? 'var(--violet-strong)' : 'var(--text-primary)';

  return (
    <span
      aria-hidden
      className={cn('pointer-events-none inline-block select-none leading-snug', SIDE_ALIGN[side], className)}
      style={{ fontFamily: 'var(--font-marker)', color: ink, transform: `rotate(${clampedRotation}deg)` }}
    >
      {leader && (
        <svg
          aria-hidden
          width="26"
          height="14"
          viewBox="0 0 26 14"
          className={cn('mb-1 inline-block', side === 'left' ? 'ml-1' : 'mr-1')}
          style={{ transform: `rotate(${LEADER_ROTATE[side]}deg)`, overflow: 'visible' }}
        >
          {/* Deliberate leader line from the note toward the annotated content,
              base pass. Unrotated (side="right"), it points left-and-down —
              toward content that sits to the note's left — the way a designer
              draws a callout leader in Figma, not a stray flick. */}
          <path
            d="M22 4 C 15 4.5, 9 7, 5 9.2"
            fill="none"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          {/* texture pass: shorter, thinner second stroke over part of the same
              line, simulating a real double-pass marker line */}
          <path
            d="M16 5 C 12 6.2, 8 7.8, 6 8.8"
            fill="none"
            stroke={ink}
            strokeWidth={0.9}
            strokeLinecap="round"
            opacity={0.5}
          />
          {/* anchor dot: the visible, deliberate terminus at the annotated point */}
          <circle cx="4" cy="9.6" r="1.5" fill={ink} />
        </svg>
      )}
      <span className="block text-lg">{children}</span>
    </span>
  );
}
