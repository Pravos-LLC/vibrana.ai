'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';

/**
 * VerticalWaveField — a whisper of vertical motion for empty gaps. One (at
 * most two) 1px Prism ribbon(s) running top to bottom, x = f(y, t): two summed
 * sines whose phase is driven, slowly, by the page's scroll position. Meant to
 * be barely noticed: very low alpha, faded out at both ends by a CSS mask, and
 * always placed in empty space (never over text or the rail).
 *
 * - Still when the page is still. The drawn phase eases toward
 *   `scrollY / PX_PER_T`, and the rAF loop sleeps once it arrives.
 * - Amplitude swells with scroll speed (the lag between target and drawn
 *   phase), then relaxes as the phase settles.
 * - Stroked violet → blue → cyan along Y, faded to nothing at both ends.
 * - Pauses offscreen (IntersectionObserver), DPR capped at 2, one static
 *   composed frame under prefers-reduced-motion.
 * - Dark mode: reads html[data-theme], lifts the hues and the alpha so the
 *   hairlines hold against a dark surface.
 */

type RGB = readonly [number, number, number];
const V: RGB = [124, 58, 237];
const B: RGB = [59, 130, 246];
const C: RGB = [45, 212, 191];
// Lifted twins for dark surfaces.
const V_D: RGB = [167, 139, 250];
const B_D: RGB = [96, 165, 250];
const C_D: RGB = [94, 234, 212];

/** Scroll pixels per unit of wave phase. */
const PX_PER_T = 420;

const FADE = 'linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent)';

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

type Ribbon = { off: number; amp: number; k1: number; k2: number; s1: number; s2: number; ph: number; alpha: number };

export interface VerticalWaveFieldProps {
  /** Number of ribbons (1, at most 2: this is a whisper). */
  ribbons?: number;
  /** Multiplies stroke alpha for per-surface tuning. */
  intensity?: number;
  /** Peak sway as a fraction of band width. */
  amplitude?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function VerticalWaveField({
  ribbons: count = 1,
  intensity = 1,
  amplitude = 0.28,
  className,
  style,
}: VerticalWaveFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let rbs: Ribbon[] = [];
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    const build = () => {
      seed = 11;
      // One coherent bundle: shared long wavelength, small per-strand offsets.
      const k1 = (Math.PI * 2) / 1.0;
      const k2 = (Math.PI * 2) / 0.37;
      rbs = Array.from({ length: count }, (_, i) => {
        const f = count === 1 ? 0.5 : i / (count - 1);
        return {
          off: 0.5 + (f - 0.5) * 0.3,
          amp: amplitude * (0.8 + 0.4 * f),
          k1,
          k2: k2 * (0.9 + 0.2 * rand()),
          s1: 0.9,
          s2: 1.25 + 0.3 * rand(),
          ph: i * 0.55,
          alpha: 0.16,
        };
      });
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();

    /** x (0..1 of W) of ribbon `rb` at vertical position y (px). */
    const xAt = (rb: Ribbon, y: number, t: number, ampMul: number) => {
      // Wavelength is in viewport-ish pixels so tall hosts do not stretch it.
      const v = y / 900;
      return (
        rb.off +
        rb.amp * ampMul * (0.72 * Math.sin(v * rb.k1 + t * rb.s1 + rb.ph) + 0.28 * Math.sin(v * rb.k2 - t * rb.s2 + rb.ph * 1.7))
      );
    };

    const render = (t: number, ampMul: number) => {
      ctx.clearRect(0, 0, W, H);
      const dark = document.documentElement.dataset.theme === 'dark';
      const [c0, c1, c2] = dark ? [V_D, B_D, C_D] : [V, B, C];
      const gain = (dark ? 1.3 : 1) * intensity;
      const step = 6;
      ctx.lineWidth = 1;
      for (const rb of rbs) {
        const a = Math.min(1, rb.alpha * gain);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, rgba(c0, 0));
        g.addColorStop(0.1, rgba(c0, a));
        g.addColorStop(0.5, rgba(c1, a));
        g.addColorStop(0.9, rgba(c2, a));
        g.addColorStop(1, rgba(c2, 0));
        ctx.strokeStyle = g;
        ctx.beginPath();
        for (let y = 0; y <= H + step; y += step) {
          const x = xAt(rb, y, t, ampMul) * W;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const themeObs = new MutationObserver(() => render(current, 1));
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let current = window.scrollY / PX_PER_T;
    let running = false;
    let visible = true;
    let raf = 0;

    const ro = new ResizeObserver(() => {
      resize();
      render(current, 1);
    });
    ro.observe(wrap);

    if (reducedMotion) {
      current = 2;
      render(current, 1);
      return () => {
        ro.disconnect();
        themeObs.disconnect();
      };
    }

    const tick = () => {
      const target = window.scrollY / PX_PER_T;
      const lag = target - current;
      current += lag * 0.05;
      const settled = Math.abs(target - current) < 0.0005;
      if (settled) current = target;
      // Swell with scroll speed, relax as the phase catches up.
      render(current, 1 + Math.min(0.25, Math.abs(lag) * 0.5));
      if (settled || !visible) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) wake();
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(wrap);

    render(current, 1);
    window.addEventListener('scroll', wake, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      themeObs.disconnect();
      window.removeEventListener('scroll', wake);
    };
  }, [count, intensity, amplitude, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('pointer-events-none absolute overflow-hidden', className)}
      style={{ maskImage: FADE, WebkitMaskImage: FADE, ...style }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

/**
 * SectionWhisper — a connector for the empty vertical gap between two page
 * sections. Straddles the gap with negative margins, so it adds no layout
 * height of its own. Place it between two `py-32` sections.
 */
export function SectionWhisper({ className, intensity }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className="pointer-events-none relative -my-20 h-40" data-section-whisper>
      <VerticalWaveField
        className={cn('inset-y-0 left-1/2 w-24 -translate-x-1/2', className)}
        intensity={intensity}
      />
    </div>
  );
}
