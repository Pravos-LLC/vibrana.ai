'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';

/**
 * ShaderField — the single modular animated gradient-grain surface for the
 * "digital ⇄ vintage" spine (JE pick round, 2026-07-20). Absorbs three picks
 * into one engine rather than three:
 *   - ShaderGradient (shadergradient.co) — "one modular shader gradient, don't
 *     duplicate it everywhere."
 *   - monopo.vn — the subtle flowing gradient + grain, used sparingly as a
 *     responsive section background (NOT the full-bleed WebGL takeover).
 *   - koto.com/about — shader gradients as slow-motion card background fills.
 *
 * Deliberately dependency-free: a low-resolution offscreen canvas with a few
 * drifting radial "light" blobs (Orchid palette: violet → blue → cyan) is
 * blitted up smooth to fill the surface, then a faint animated grain is laid
 * over the top. This matches how Background.tsx / AsciiField already work
 * (canvas + rAF + IntersectionObserver + reduced-motion held frame) and avoids
 * shipping a WebGL/three.js runtime for what reads as a soft moving gradient.
 * If a future surface genuinely needs a true refractive shader, this is the
 * seam to swap the fill implementation behind — the `preset` API stays.
 *
 * Presets (all Orchid-tuned; `card-fill` is the Koto card use, `ambient` the
 * monopo section-background use, `monopo` the slightly grainier/warmer wash):
 *   - ambient   — large, slow, low-opacity. Section backgrounds behind copy.
 *   - card-fill — tighter, a touch brighter, for bounded cards / tiles.
 *   - monopo    — grainier, more contrast between blobs; the "post-process" look.
 *
 * Reduced motion renders one static, fully-composed frame (no loop). Off-screen
 * the rAF loop is paused via IntersectionObserver.
 */

type Blob = { hue: readonly [number, number, number]; r: number; ax: number; ay: number; sx: number; sy: number; ph: number };

interface Preset {
  blobs: Blob[];
  grain: number; // 0..1 alpha of the grain wash
  opacity: number; // overall field opacity
  base: string; // base fill under the blobs
  blurScale: number; // offscreen resolution (smaller = softer/cheaper)
  speed: number;
  /**
   * How blobs stack over the base. `lighter` (additive) reads as glowing
   * light on a dark base; on a light base it blows out to white, so light
   * presets use `source-over` with a lower inner alpha to keep visible tint.
   */
  composite: 'lighter' | 'source-over';
  /** Inner alpha of each blob's radial gradient. */
  blobAlpha: number;
}

const V = [124, 58, 237] as const;
const B = [59, 130, 246] as const;
const C = [45, 212, 191] as const;

const PRESETS: Record<'ambient' | 'card-fill' | 'monopo', Preset> = {
  ambient: {
    base: '#ffffff',
    opacity: 0.7,
    grain: 0.03,
    blurScale: 0.05,
    speed: 0.05,
    composite: 'source-over',
    blobAlpha: 0.5,
    blobs: [
      { hue: V, r: 0.7, ax: 0.22, ay: 0.28, sx: 0.7, sy: 0.5, ph: 0.0 },
      { hue: C, r: 0.62, ax: 0.24, ay: 0.24, sx: 0.9, sy: 0.8, ph: 2.1 },
      { hue: B, r: 0.5, ax: 0.28, ay: 0.2, sx: 1.1, sy: 0.6, ph: 4.0 },
    ],
  },
  'card-fill': {
    base: '#ffffff',
    opacity: 0.92,
    grain: 0.035,
    blurScale: 0.08,
    speed: 0.08,
    composite: 'source-over',
    blobAlpha: 0.62,
    blobs: [
      { hue: V, r: 0.85, ax: 0.3, ay: 0.3, sx: 0.9, sy: 0.7, ph: 0.5 },
      { hue: C, r: 0.7, ax: 0.32, ay: 0.28, sx: 1.2, sy: 1.0, ph: 3.2 },
    ],
  },
  monopo: {
    base: '#0d0d11',
    opacity: 0.9,
    grain: 0.075,
    blurScale: 0.06,
    speed: 0.06,
    composite: 'lighter',
    blobAlpha: 0.9,
    blobs: [
      { hue: V, r: 0.8, ax: 0.28, ay: 0.3, sx: 0.6, sy: 0.5, ph: 0.0 },
      { hue: C, r: 0.7, ax: 0.3, ay: 0.26, sx: 0.8, sy: 0.7, ph: 1.7 },
      { hue: B, r: 0.6, ax: 0.32, ay: 0.24, sx: 1.0, sy: 0.9, ph: 3.9 },
    ],
  },
};

export interface ShaderFieldProps {
  preset?: 'ambient' | 'card-fill' | 'monopo';
  /** Multiplies the preset opacity (0..1+) for per-surface tuning. */
  intensity?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ShaderField({ preset = 'ambient', intensity = 1, className, style }: ShaderFieldProps) {
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
    const off = document.createElement('canvas');
    const octx = off.getContext('2d')!;

    let dispW = 0;
    let dispH = 0;
    let ow = 0;
    let oh = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dispW = Math.max(1, Math.round(r.width));
      dispH = Math.max(1, Math.round(r.height));
      canvas.width = dispW;
      canvas.height = dispH;
      ow = Math.max(8, Math.round(dispW * p.blurScale));
      oh = Math.max(8, Math.round(dispH * p.blurScale));
      off.width = ow;
      off.height = oh;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let grainTile: HTMLCanvasElement | null = null;
    const buildGrain = () => {
      const g = document.createElement('canvas');
      g.width = 80;
      g.height = 80;
      const gc = g.getContext('2d')!;
      const id = gc.createImageData(80, 80);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = Math.floor(Math.random() * 255);
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 255;
      }
      gc.putImageData(id, 0, 0);
      grainTile = g;
    };

    const render = (time: number) => {
      // low-res flow field
      octx.globalCompositeOperation = 'source-over';
      octx.fillStyle = p.base;
      octx.fillRect(0, 0, ow, oh);
      octx.globalCompositeOperation = p.composite;
      for (const b of p.blobs) {
        const cx = (0.5 + Math.sin(time * p.speed * b.sx + b.ph) * b.ax) * ow;
        const cy = (0.5 + Math.cos(time * p.speed * b.sy + b.ph * 1.3) * b.ay) * oh;
        const rad = b.r * Math.max(ow, oh);
        const grad = octx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const [r, g, bl] = b.hue;
        grad.addColorStop(0, `rgba(${r},${g},${bl},${p.blobAlpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);
        octx.fillStyle = grad;
        octx.fillRect(0, 0, ow, oh);
      }

      // blit up smooth
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, dispW, dispH);
      ctx.drawImage(off, 0, 0, ow, oh, 0, 0, dispW, dispH);

      // grain wash
      if (p.grain > 0 && grainTile) {
        ctx.globalAlpha = p.grain;
        ctx.globalCompositeOperation = preset === 'monopo' ? 'screen' : 'multiply';
        const pat = ctx.createPattern(grainTile, 'repeat');
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, dispW, dispH);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    if (p.grain > 0) buildGrain();

    if (reducedMotion) {
      render(1200); // one composed, static frame at an arbitrary non-zero phase
      return () => ro.disconnect();
    }

    let inView = true;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { threshold: 0 });
    io.observe(wrap);

    let frameCount = 0;
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!inView) return;
      frameCount++;
      if (p.grain > 0 && frameCount % 5 === 0) buildGrain();
      render(ts * 0.001);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      ro.disconnect();
    };
  }, [preset, reducedMotion]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ opacity: Math.min(1, PRESETS[preset].opacity * intensity), ...style }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
