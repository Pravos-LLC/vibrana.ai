'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';

/**
 * ScrollFillText — Cosmos-style "contrast fill on scroll" headers (JE pick
 * round, 2026-07-20: cosmos.so, "the most restraint-perfect reveal found").
 * The text sits in a low-contrast resting state (faint ink) and *fills* to
 * full contrast as it travels through the middle of the viewport — the reveal
 * is pure typographic contrast, no motion of the letters themselves, which is
 * why it survives the restraint ceiling where a kinetic transform wouldn't.
 *
 * The kinetic-type layer of the "digital ⇄ vintage" spine. Kept separate from
 * `GradientText` (which is a static gradient clip on display type) so that
 * component's shipped API is untouched — this is the scroll-linked sibling.
 *
 * Mechanism: a filled copy of the text is clipped by a vertical wipe whose
 * height tracks the element's viewport progress, layered over a faint base
 * copy. Optionally the fill is a Prism gradient rather than solid ink.
 * Respects prefers-reduced-motion by rendering fully-filled immediately (the
 * destination is the readable state).
 */

export interface ScrollFillTextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  /** Solid ink fill, or a Prism gradient fill. Default 'ink'. */
  fill?: 'ink' | 'prism' | 'warm';
  /** Resting (unfilled) opacity of the base copy. Default 0.16. */
  restOpacity?: number;
  /**
   * Where in the viewport the fill starts and completes, as fractions of
   * viewport height measured from the bottom. Default fills between 75% and
   * 40% up the viewport — i.e. it's done a little above center.
   */
  start?: number;
  end?: number;
  className?: string;
}

const FILL_STYLE: Record<NonNullable<ScrollFillTextProps['fill']>, React.CSSProperties> = {
  ink: { color: 'var(--ink, #141414)' },
  prism: {
    backgroundImage: 'linear-gradient(100deg, #7c3aed, #3b82f6 55%, #2dd4bf)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  warm: {
    backgroundImage: 'linear-gradient(100deg, #b45309, #d97706 55%, #f59e0b)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
};

export function ScrollFillText({
  children,
  as: Tag = 'span',
  fill = 'ink',
  restOpacity = 0.16,
  start = 0.75,
  end = 0.4,
  className,
}: ScrollFillTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setProgress(1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let inView = true;

    const compute = () => {
      raf = 0;
      if (!inView) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = r.top + r.height / 2;
      // startY (lower in viewport) → 0, endY (higher) → 1
      const startY = start * vh;
      const endY = end * vh;
      const p = (startY - center) / (startY - endY);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) onScroll();
    });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion, start, end]);

  return (
    <Tag ref={ref as React.Ref<HTMLElement>} className={cn('relative inline-block', className)}>
      {/* base (faint) copy — accessible text lives here */}
      <span style={{ color: 'var(--ink, #141414)', opacity: restOpacity }}>{children}</span>
      {/* filled copy, clipped by a bottom-up wipe driven by scroll progress */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          ...FILL_STYLE[fill],
          clipPath: `inset(0 0 ${(1 - progress) * 100}% 0)`,
          transition: reducedMotion ? undefined : 'clip-path 120ms linear',
        }}
      >
        {children}
      </span>
    </Tag>
  );
}
