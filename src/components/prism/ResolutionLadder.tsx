'use client';
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';

/**
 * ResolutionLadder — the keystone of the "digital ⇄ vintage" component spine
 * (research/design-components/inspiration/GLOSSARY.md → JE's pick round,
 * 2026-07-20). An image (or any raster) is rendered through a staircase of
 * resolution "rungs": it enters as a chunky 8-bit block field and steps up —
 * 8 → 16 → 32 → 64 → 128 → full — resolving toward a crisp, full-resolution
 * frame. This is the brand thesis rendered as motion: imperfection / the
 * degraded / the 8-bit resolving toward precision, clarity, implementation.
 *
 * Sourced from three converging picks (all the same gesture at different
 * altitudes): Locomotive's per-portfolio load resolve, Hello Monday's
 * on-scroll image transform, and Cuberto's glitch-pixel-on-a-moving-image.
 * Kept as ONE primitive with a `trigger` so the same engine powers a hero
 * reveal, a case-study thumbnail hover, and a scroll-linked section image —
 * rather than three bespoke effects.
 *
 * Architecture mirrors AsciiField (see AsciiClosing.tsx): a single <canvas>,
 * one rAF loop, IntersectionObserver to pause off-screen, and a fully-resolved
 * static frame under prefers-reduced-motion (never a blocky held frame — the
 * degraded state is motion; reduced-motion users get the destination). Each
 * rung is drawn by downsampling the decoded source to a tiny offscreen canvas
 * (smoothing on) then blitting it up to display size with smoothing OFF, which
 * is what gives the hard, square "pixel" edges rather than a blur.
 *
 * Orchid tuning (the default track for this primitive): `grain` lays a faint
 * animated noise wash over every frame (ties to Background's noise overlay and
 * ShaderField), and `colorShift` runs a violet→cyan duotone pass on the lower
 * rungs that bleeds out as the image resolves — the "color overlay on a
 * degraded frame" move from Cuberto, kept subtle.
 */

const PRISM = {
  violet: [124, 58, 237] as const,
  cyan: [45, 212, 191] as const,
};

export type ResolutionLadderTrigger = 'inview' | 'load' | 'hover' | 'scroll';

export interface ResolutionLadderProps {
  src: string;
  alt: string;
  /**
   * What advances the resolve:
   *  - `inview` (default) — resolves once when it scrolls into view.
   *  - `load` — resolves immediately on mount.
   *  - `hover` — resolves on pointer-enter / focus; degrades back on leave
   *    unless `holdOnResolve` is set.
   *  - `scroll` — resolution is linked to the element's travel through the
   *    viewport (chunky at the edges, sharp at center).
   */
  trigger?: ResolutionLadderTrigger;
  /** Time-based rungs (`inview`/`load`) resolve over this many ms. */
  duration?: number;
  /**
   * Sample widths in source px for each rung, ascending. `Infinity` = full
   * resolution. Lower first value = chunkier entry. Default is a 6-rung
   * 8→full staircase.
   */
  levels?: number[];
  /** Faint animated Orchid grain over every frame. Default true. */
  grain?: boolean;
  /** Violet→cyan duotone on the lower rungs, fading out as it resolves. Default true. */
  colorShift?: boolean;
  /** CSS aspect-ratio for the frame (e.g. "3 / 2"). Default "3 / 2". */
  aspectRatio?: string;
  /** Once fully resolved, stay there (don't degrade back). Default true. */
  holdOnResolve?: boolean;
  rounded?: boolean;
  className?: string;
}

const DEFAULT_LEVELS = [8, 16, 32, 64, 128, Infinity];

// easeInOutCubic — smooth the time-based advance so the staircase doesn't
// tick at a constant clip.
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function ResolutionLadder({
  src,
  alt,
  trigger = 'inview',
  duration = 1100,
  levels = DEFAULT_LEVELS,
  grain = true,
  colorShift = true,
  aspectRatio = '3 / 2',
  holdOnResolve = true,
  rounded = true,
  className,
}: ResolutionLadderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const tmpRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  // Live, mutable animation state kept in refs so the rAF loop reads the
  // latest without re-subscribing.
  const progressRef = useRef(0); // 0 = chunkiest rung, 1 = full res
  const targetRef = useRef(0);
  const hoverRef = useRef(false);
  const inViewRef = useRef(false);
  const resolvedRef = useRef(false);
  const startRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // Decode the source once.
  useEffect(() => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    return () => {
      img.onload = null;
    };
  }, [src]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!canvas || !wrap || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!tmpRef.current) tmpRef.current = document.createElement('canvas');
    const tmp = tmpRef.current;
    const tctx = tmp.getContext('2d')!;

    let dispW = 0;
    let dispH = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dispW = Math.max(1, Math.round(r.width));
      dispH = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(dispW * dpr);
      canvas.height = Math.round(dispH * dpr);
      canvas.style.width = `${dispW}px`;
      canvas.style.height = `${dispH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // grain field — one small tile drawn multiplicatively, re-seeded a few
    // times a second so it shimmers rather than crawls.
    let grainTile: HTMLCanvasElement | null = null;
    const buildGrain = () => {
      const g = document.createElement('canvas');
      g.width = 90;
      g.height = 90;
      const gc = g.getContext('2d')!;
      const id = gc.createImageData(90, 90);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = 200 + Math.floor(Math.random() * 55);
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 22;
      }
      gc.putImageData(id, 0, 0);
      grainTile = g;
    };
    let grainCounter = 0;

    const drawRung = (levelWidth: number, resolveAmt: number) => {
      ctx.clearRect(0, 0, dispW, dispH);
      if (!isFinite(levelWidth)) {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, dispW, dispH);
      } else {
        const sw = Math.max(2, Math.round(levelWidth));
        const sh = Math.max(2, Math.round(levelWidth * (dispH / dispW)));
        tmp.width = sw;
        tmp.height = sh;
        tctx.imageSmoothingEnabled = true;
        tctx.clearRect(0, 0, sw, sh);
        tctx.drawImage(img, 0, 0, sw, sh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, dispW, dispH);
      }

      // Cuberto-style duotone bleed on the degraded rungs.
      if (colorShift && resolveAmt < 1) {
        const bleed = (1 - resolveAmt) * 0.42;
        ctx.globalCompositeOperation = 'overlay';
        const grad = ctx.createLinearGradient(0, 0, dispW, dispH);
        grad.addColorStop(0, `rgba(${PRISM.violet.join(',')},${bleed})`);
        grad.addColorStop(1, `rgba(${PRISM.cyan.join(',')},${bleed})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, dispW, dispH);
        ctx.globalCompositeOperation = 'source-over';
      }

      if (grain && grainTile) {
        ctx.globalCompositeOperation = 'multiply';
        const pat = ctx.createPattern(grainTile, 'repeat');
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, dispW, dispH);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    // progress (0..1) → which rung to show. Quantized so the resolve reads
    // as a staircase, not a dissolve.
    const rungFor = (p: number) => {
      const idx = Math.min(levels.length - 1, Math.floor(p * levels.length));
      return levels[idx];
    };

    if (reducedMotion) {
      // Destination only — the degraded state is motion; reduced-motion users
      // get the fully-resolved frame, no loop.
      progressRef.current = 1;
      drawRung(Infinity, 1);
      return () => {
        ro.disconnect();
      };
    }

    if (grain) buildGrain();

    const computeScrollProgress = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the element's center is a viewport-height away from center,
      // 1 when centered.
      const center = r.top + r.height / 2;
      const dist = Math.abs(center - vh / 2) / (vh / 2);
      return Math.max(0, Math.min(1, 1 - dist));
    };

    const frame = (ts: number) => {
      rafRef.current = requestAnimationFrame(frame);
      if (!inViewRef.current) return;

      if (grain) {
        grainCounter++;
        if (grainCounter % 6 === 0) buildGrain();
      }

      if (trigger === 'scroll') {
        targetRef.current = computeScrollProgress();
        progressRef.current += (targetRef.current - progressRef.current) * 0.12;
      } else if (trigger === 'hover') {
        const goal = hoverRef.current || (holdOnResolve && resolvedRef.current) ? 1 : 0;
        progressRef.current += (goal - progressRef.current) * 0.14;
        if (progressRef.current > 0.985) resolvedRef.current = true;
      } else {
        // time-based (inview / load)
        if (startRef.current == null) startRef.current = ts;
        const t = Math.min(1, (ts - startRef.current) / duration);
        progressRef.current = ease(t);
        if (t >= 1) resolvedRef.current = true;
      }

      const p = progressRef.current;
      drawRung(p >= 0.999 ? Infinity : rungFor(p), p);

      // Time-based, resolved, holding: stop the loop (nothing left to animate
      // except grain — keep grain alive only while in view is cheap enough,
      // but once resolved with grain off we can idle).
      if (
        (trigger === 'inview' || trigger === 'load') &&
        resolvedRef.current &&
        !grain
      ) {
        cancelAnimationFrame(rafRef.current);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting && (trigger === 'inview' || trigger === 'load') && startRef.current == null) {
          startRef.current = null; // stamped on first frame
        }
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);
    if (trigger === 'load') inViewRef.current = true;

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reducedMotion, trigger, duration, grain, colorShift, holdOnResolve]);

  const interactive = trigger === 'hover';

  return (
    <div
      ref={wrapRef}
      className={cn('relative overflow-hidden bg-[#0b0b0e]', rounded && 'rounded-xl', className)}
      style={{ aspectRatio }}
      onPointerEnter={interactive ? () => (hoverRef.current = true) : undefined}
      onPointerLeave={interactive ? () => (hoverRef.current = false) : undefined}
      onFocus={interactive ? () => (hoverRef.current = true) : undefined}
      onBlur={interactive ? () => (hoverRef.current = false) : undefined}
      tabIndex={interactive ? 0 : undefined}
      role="img"
      aria-label={alt}
    >
      {/* Fallback / SSR + pre-decode frame: the real image, so there's never a
          blank box and non-canvas / no-JS contexts still see the picture. */}
      {!ready && (
        // eslint-disable-next-line @next/next/no-img-element
        <PublicDemoImg src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-80" />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
