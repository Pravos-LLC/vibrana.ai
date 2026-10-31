'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';

/**
 * WaveField — hairline Prism-gradient waves for a hero or section background.
 * Distilled from mariwaze.com (JE, 2026-10-03): hairline strokes, low alpha,
 * no cursor, and above all driven by scroll.
 *
 * Round 2 (JE review): the waves must not move on their own. Their phase is
 * tied to the page's scroll position, so they flow while you scroll and are
 * completely still the moment you stop. The rAF loop only runs while the
 * drawn phase is catching up to the scroll target, then sleeps.
 *
 * - Ribbons: one coherent bundle; each is two summed sines with a small phase
 *   offset per strand. Stroked violet → blue → cyan, edges faded inside the
 *   gradient (no new hues, no background wash).
 * - Scroll: amplitude swells over the first third of the host's exit, then
 *   relaxes as the field fades out.
 * - Motes (section preset only): ride the waves, positioned by scroll.
 *
 * Same engine shape as ShaderField / AsciiField: canvas, DPR capped at 2,
 * one static composed frame under prefers-reduced-motion.
 */

type RGB = readonly [number, number, number];
const V: RGB = [124, 58, 237];
const B: RGB = [59, 130, 246];
const C: RGB = [45, 212, 191];

interface Preset {
  ribbons: number;
  /** Vertical band the ribbons occupy, as fractions of the host height. */
  bandTop: number;
  bandBottom: number;
  /** Base amplitude as a fraction of host height. */
  amp: number;
  /** Stroke alpha range across ribbons. */
  alphaMin: number;
  alphaMax: number;
  motes: number;
  motesMobile: number;
  speed: number;
}

const PRESETS: Record<'hero' | 'section', Preset> = {
  hero: {
    ribbons: 4,
    bandTop: 0.62,
    bandBottom: 0.8,
    amp: 0.07,
    alphaMin: 0.18,
    alphaMax: 0.36,
    motes: 0,
    motesMobile: 0,
    speed: 0.32,
  },
  section: {
    ribbons: 5,
    bandTop: 0.35,
    bandBottom: 0.8,
    amp: 0.06,
    alphaMin: 0.1,
    alphaMax: 0.22,
    motes: 22,
    motesMobile: 14,
    speed: 0.28,
  },
};

/** Scroll pixels per unit of wave phase time. */
const PX_PER_T = 110;

/** Amplitude multiplier across the host's exit: swell, then relax. */
function ampAt(scrollOut: number) {
  if (scrollOut < 0.3) return 1 + 0.25 * (scrollOut / 0.3);
  return 1.25 - 0.65 * ((scrollOut - 0.3) / 0.7);
}

/** Palette colour at horizontal position u (0..1): violet → blue → cyan. */
function paletteAt(u: number): RGB {
  const lerp = (a: RGB, b: RGB, k: number): RGB => [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
  return u < 0.5 ? lerp(V, B, u * 2) : lerp(B, C, (u - 0.5) * 2);
}

const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

type Ribbon = { base: number; amp: number; k1: number; k2: number; s1: number; s2: number; ph: number; alpha: number };
type Mote = { ribbon: number; x: number; dy: number; v: number; r: number; tw: number };

export interface WaveFieldProps {
  preset?: 'hero' | 'section';
  /** Multiplies stroke and mote alpha for per-surface tuning. */
  intensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function WaveField({ preset = 'hero', intensity = 1, className, style }: WaveFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
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

    const p = PRESETS[preset];
    let W = 0;
    let H = 0;
    let ribbons: Ribbon[] = [];
    let motes: Mote[] = [];
    // Deterministic jitter so the static (reduced-motion) frame is stable.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    const build = () => {
      seed = 7;
      // One coherent bundle, like strands of the same silk: every ribbon shares
      // the main wavelength and drift, offset a little in phase per strand, so
      // the set flows together instead of crossing at random.
      const k1 = (Math.PI * 2) / 1.15;
      const k2 = (Math.PI * 2) / 0.42;
      ribbons = Array.from({ length: p.ribbons }, (_, i) => {
        const f = p.ribbons === 1 ? 0.5 : i / (p.ribbons - 1);
        return {
          base: p.bandTop + (p.bandBottom - p.bandTop) * f,
          amp: p.amp * (0.85 + 0.3 * f),
          k1,
          k2: k2 * (0.9 + 0.2 * rand()),
          s1: p.speed,
          s2: p.speed * (1.3 + 0.3 * rand()),
          ph: i * 0.3,
          // Middle ribbons strongest, outer ones recede.
          alpha: p.alphaMin + (p.alphaMax - p.alphaMin) * (1 - Math.abs(f - 0.5) * 2),
        };
      });
      const n = W < 700 ? p.motesMobile : p.motes;
      motes = Array.from({ length: n }, () => ({
        ribbon: Math.floor(rand() * p.ribbons),
        x: rand(),
        dy: (rand() - 0.5) * 0.06,
        v: 0.004 + rand() * 0.008,
        r: 0.8 + rand() * 0.6,
        tw: rand() * Math.PI * 2,
      }));
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
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // 0 while the host is in place, → 1 as it scrolls up out of view.
    const scrollOutNow = () => {
      const r = wrap.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    };

    /** y (0..1 of H) of ribbon `rb` at horizontal fraction u. */
    const yAt = (rb: Ribbon, u: number, t: number, ampMul: number) =>
      rb.base +
      rb.amp * ampMul * (0.72 * Math.sin(u * rb.k1 + t * rb.s1 + rb.ph) + 0.28 * Math.sin(u * rb.k2 - t * rb.s2 + rb.ph * 1.7));

    const render = (t: number, scrollOut: number) => {
      ctx.clearRect(0, 0, W, H);
      const ampMul = ampAt(scrollOut);
      const fade = (1 - scrollOut) * intensity;
      if (fade <= 0.001) return;

      const step = Math.max(6, W / 160);
      ctx.lineWidth = 1;
      for (const rb of ribbons) {
        const a = Math.min(1, rb.alpha * fade);
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, rgba(V, 0));
        g.addColorStop(0.18, rgba(V, a));
        g.addColorStop(0.5, rgba(B, a));
        g.addColorStop(0.82, rgba(C, a));
        g.addColorStop(1, rgba(C, 0));
        ctx.strokeStyle = g;
        ctx.beginPath();
        for (let x = 0; x <= W + step; x += step) {
          const y = yAt(rb, x / W, t, ampMul) * H;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      for (const m of motes) {
        const rb = ribbons[m.ribbon];
        if (!rb) continue;
        const u = (((m.x + t * m.v * 3) % 1) + 1) % 1;
        const edge = Math.min(1, u / 0.12, (1 - u) / 0.12);
        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.9 + m.tw);
        const a = 0.45 * edge * twinkle * fade;
        if (a <= 0.01) continue;
        const y = (yAt(rb, u, t, ampMul) + m.dy) * H;
        ctx.fillStyle = rgba(paletteAt(u), a);
        ctx.beginPath();
        ctx.arc(u * W, y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reducedMotion) {
      // One composed, static frame, redrawn whenever a resize clears the canvas.
      const still = () => render(2, 0);
      still();
      const ro2 = new ResizeObserver(still);
      ro2.observe(wrap);
      return () => {
        ro.disconnect();
        ro2.disconnect();
      };
    }

    // Scroll-driven: the drawn phase eases toward the scroll target, and the
    // loop stops once it arrives, so an idle page costs nothing and never moves.
    let current = window.scrollY / PX_PER_T;
    let running = false;
    // Offscreen hosts draw nothing and keep no loop alive; the phase just tracks scroll
    // so the field resumes in step when it re-enters view.
    let visible = true;
    const tick = () => {
      if (!visible) {
        running = false;
        current = window.scrollY / PX_PER_T;
        return;
      }
      const target = window.scrollY / PX_PER_T;
      current += (target - current) * 0.12;
      const settled = Math.abs(target - current) < 0.0005;
      if (settled) current = target;
      render(current, scrollOutNow());
      if (settled) {
        running = false;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (running || !visible) return;
      running = true;
      rafRef.current = requestAnimationFrame(tick);
    };
    render(current, scrollOutNow());
    // Redraw after resizes (setting canvas size clears it).
    const ro3 = new ResizeObserver(() => render(current, scrollOutNow()));
    ro3.observe(wrap);
    window.addEventListener('scroll', wake, { passive: true });
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          render(current, scrollOutNow());
          wake();
        }
      },
      { rootMargin: '50px 0px' },
    );
    io.observe(wrap);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      ro.disconnect();
      ro3.disconnect();
      window.removeEventListener('scroll', wake);
    };
  }, [preset, intensity, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={style}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
