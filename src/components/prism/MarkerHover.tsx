'use client';

import React, { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from './utils/cn';

/**
 * MarkerHover — a hand-drawn Sharpie annotation (circle, underline, arrow,
 * scribble, or star) that draws itself in on hover/focus and retracts on
 * leave. The workshop-vibe fast-follow from the "digital ⇄ vintage" spine
 * (JE pick round, 2026-07-20: instead.studio — "subtle on-hover animations on
 * hand-drawn elements … bringing a workshop vibe to some of the web surface").
 *
 * Sibling to the scroll-triggered marker family (MarkerUnderline / MarkerCircle
 * / MarkerArrow — see markerDrawPath.tsx). Same authored-stroke, draw-in
 * technique (pathLength=1 + dashoffset), but the trigger is pointer/focus, not
 * scroll-into-view: the mark is invisible at rest and appears when you hover
 * the wrapped element, so it reads as a live, hand-touched reaction rather than
 * a permanent decoration.
 *
 * `prefers-reduced-motion`: the mark renders fully drawn and static (visible at
 * rest, no draw animation) — the annotation is the meaning, the motion isn't.
 *
 * RESTRAINT: same rules as the marker family — max 1-2 marker moments per
 * viewport, never under a section heading or eyebrow, one accent per viewport.
 */

export type MarkerHoverShape = 'circle' | 'underline' | 'arrow' | 'squiggle' | 'hockeystick';

export interface MarkerHoverProps {
  children: React.ReactNode;
  shape?: MarkerHoverShape;
  /** Single brand accent instead of near-black ink. Rare, one per viewport max. */
  accent?: boolean;
  className?: string;
}

interface ShapeDef {
  viewBox: string;
  /** position/size of the SVG overlay relative to the wrapped content */
  style: React.CSSProperties;
  paths: { d: string; width: number; opacity?: number; delay?: number; duration?: number }[];
}

// Containment rule: every mark stays within a tight band around the word
// (~0.35em beyond the text on any side) so it never bumps the line above or
// below. No mark floats up into the previous line.
const SHAPES: Record<MarkerHoverShape, ShapeDef> = {
  circle: {
    viewBox: '0 0 200 90',
    style: { left: '-7%', top: '-17%', width: '114%', height: '135%' },
    paths: [
      {
        // an oval that overshoots past its start, the way a real circling does
        d: 'M104 8 C 42 4, 8 24, 12 48 C 16 74, 84 86, 138 80 C 186 74, 198 46, 184 26 C 172 9, 120 3, 88 6',
        width: 3,
      },
    ],
  },
  underline: {
    viewBox: '0 0 200 24',
    style: { left: 0, top: '100%', width: '100%', height: '0.36em', marginTop: '-0.42em' },
    paths: [
      { d: 'M4 13 C 42 8, 92 19, 132 11 C 162 6, 182 14, 198 9', width: 3.2 },
      { d: 'M22 11 C 58 6, 104 17, 152 10', width: 1.6, opacity: 0.55, delay: 0.06, duration: 0.3 },
    ],
  },
  arrow: {
    // A line under the word sweeping up to the right, flicking into an
    // arrowhead — contained in the under-band, points forward, never above.
    viewBox: '0 0 210 44',
    style: { left: 0, top: '100%', width: '112%', height: '0.72em', marginTop: '-0.3em' },
    paths: [
      { d: 'M4 26 C 64 18, 132 22, 192 9', width: 3 },
      { d: 'M176 4 L 196 8 L 186 24', width: 3, delay: 0.16, duration: 0.26 },
    ],
  },
  squiggle: {
    // A single thin wavy line UNDER the word (not scribbled over it).
    viewBox: '0 0 200 20',
    style: { left: '-2%', top: '100%', width: '104%', height: '0.42em', marginTop: '-0.26em' },
    paths: [
      {
        d: 'M4 11 C 17 4, 30 18, 44 11 S 71 4, 85 11 S 112 18, 126 11 S 153 4, 167 11 S 194 15, 197 11',
        width: 1.7,
      },
    ],
  },
  hockeystick: {
    // A short arrow flicking up-and-right off the END of the word — the
    // "hockey stick." Slightly upward, stays within the line band.
    viewBox: '0 0 90 56',
    style: { left: '94%', top: '-12%', width: '1.7em', height: '0.95em' },
    paths: [
      { d: 'M4 46 C 24 44, 48 42, 80 14', width: 3 },
      { d: 'M64 12 L 84 12 L 74 30', width: 3, delay: 0.16, duration: 0.24 },
    ],
  },
};

export function MarkerHover({ children, shape = 'circle', accent = false, className }: MarkerHoverProps) {
  const reduce = useReducedMotion();
  const ink = accent ? 'var(--violet-strong)' : 'var(--text-primary)';
  const def = SHAPES[shape];
  // Explicit active state, not framer variant propagation — pointer/focus
  // events drive it directly so the draw fires reliably (whileHover/whileFocus
  // variant inheritance proved flaky through the nested SVG).
  const [active, setActive] = useState(false);

  return (
    <span
      className={cn('relative inline-block outline-hidden', className)}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      tabIndex={0}
    >
      {children}
      <svg
        aria-hidden
        className="pointer-events-none absolute"
        style={{ ...def.style, overflow: 'visible' }}
        viewBox={def.viewBox}
        preserveAspectRatio="none"
      >
        {def.paths.map((p, i) => {
          const shown = active;
          return (
            <path
              key={i}
              d={p.d}
              fill="none"
              stroke={ink}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: shown ? 0 : 1,
                opacity: shown ? p.opacity ?? 1 : 0,
                transition: reduce
                  ? 'none'
                  : `stroke-dashoffset ${p.duration ?? 0.5}s cubic-bezier(0.65,0,0.35,1) ${shown ? p.delay ?? 0 : 0}s, opacity 0.25s ease ${shown ? p.delay ?? 0 : 0}s`,
              }}
            />
          );
        })}
      </svg>
    </span>
  );
}
