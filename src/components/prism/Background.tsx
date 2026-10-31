'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue, useReducedMotion } from 'framer-motion';

/**
 * Background — the recolored mycelium field for Prism Light. Layered thin
 * effects (principle 8): multiple low-opacity SVG path layers + node dots +
 * an optional dot grid + bokeh + noise, each moving at a different parallax
 * pace, so the field reads as a coherent ambient presence without
 * overwhelming card content.
 *
 * `variant` selects a richness preset — see RICHNESS_PRESETS below. This
 * folds what used to be a separate `BackgroundRich.tsx` prototype into one
 * component (>90% of the two files was identical structure: same props,
 * same spring/parallax rig, same noise overlay technique — only the opacity
 * numbers, dot-grid, and bokeh differed). `BackgroundRich.tsx` now re-exports
 * `variant="rich"` for import-path stability; prefer `variant` directly in
 * new code.
 *
 * Presets settled during the BackgroundRich finalize round (research/
 * design-components/screenshots/background-rich/):
 *  - plain  — shipped baseline (paths 0.16, nodes 0.30, glow 0.09). No
 *             dot-grid/bokeh. This is what every current PageShell page uses.
 *  - quiet  — richness turned up from `plain` but capped well short of
 *             `rich`; the recommended production value for `variant="rich"`
 *             call sites that want texture without competing with content.
 *  - rich   — the original BackgroundRich prototype numbers (paths 0.34,
 *             nodes 0.46, glow 0.22, + dot-grid + bokeh). Kept as a named
 *             preset for comparison; noticeably busier under body copy.
 *  - dense  — same structural density approach as `rich` (extra path pass,
 *             more nodes) but every individual mark's opacity pulled back
 *             down, testing "more marks, each fainter" against "fewer marks,
 *             each bolder."
 *
 * Perf: `Background` no longer animates unconditionally off-screen or under
 * `prefers-reduced-motion`:
 *  - `useReducedMotion()` freezes the mouse-parallax offsets to (0, 0) and
 *    pins the scroll-driven opacity/size boosts to a fixed baseline, so
 *    reduced-motion users get the same visual richness as a single static
 *    frame — never a blank canvas, never continuous motion.
 *  - An `IntersectionObserver` on the field's own container skips rendering
 *    the SVG layers, glow blobs, dot-grid, and bokeh entirely while the
 *    field is out of the viewport (leaves only the cheap base gradient),
 *    resuming full richness the moment it re-enters view. Matters for any
 *    non-fixed mounting context (e.g. the `/prism` comparison grid, or a
 *    future card/section-scoped use) — `position: fixed` mounts at the page
 *    root are effectively always "visible" while the tab is open, so this
 *    mainly protects future non-fixed reuse and multi-instance comparison
 *    pages from paying for the layers they can't see.
 */
const PRISM = {
  violet: '#7c3aed',
  blue: '#3b82f6',
  cyan: '#2dd4bf',
} as const;

export type BackgroundVariant = 'plain' | 'quiet' | 'rich' | 'dense';

/**
 * How much of the viewport the field occupies. JE's final-polish note
 * (research/design-components/screenshots/background-rich/): the presets
 * above read as too saturated when stretched across a full page — "the more
 * space it occupies the less intense the coloration" should be. `'page'`
 * (the default, matching today's `PageShell` full-page mount) attenuates
 * every preset's color/glow/path/node alphas down via `COVERAGE_INTENSITY_SCALE`;
 * `'section'` renders the preset at its full designed intensity, appropriate
 * for a smaller bounded area where the same numbers don't oversaturate.
 */
export type BackgroundCoverage = 'page' | 'section';

interface RichnessPreset {
  /** Renders the shared RoleImage-style dot-grid texture under the field. */
  dotGrid: boolean;
  dotGridOpacity: number;
  /** Count + opacity range of the two-tone bokeh orbs (0 = none). */
  bokehCount: number;
  bokehOpacityMin: number;
  bokehOpacityRange: number;
  glowBase: number;
  glowScrollBoost: number;
  /** Whether to render the third ("extra structural pass") path in layer 1. */
  extraPath: boolean;
  path1Opacity: number;
  path2BaseOpacity: number;
  path2ScrollBoost: number;
  path3Opacity: number | null; // null = layer omitted (plain's 3rd tertiary layer)
  path3ScrollBoost: number;
  nodeCount: number;
  nodeOpacity: number;
  nodeOpacityScrollBoost: number;
  noiseOpacity: number;
  /** Background base gradient — identical across variants except plain's ellipse focus differs slightly. */
  baseGradient: string;
}

const RICHNESS_PRESETS: Record<BackgroundVariant, RichnessPreset> = {
  // Shipped baseline. Unchanged from the pre-merge Background.tsx.
  plain: {
    dotGrid: false,
    dotGridOpacity: 0,
    bokehCount: 0,
    bokehOpacityMin: 0,
    bokehOpacityRange: 0,
    glowBase: 0.101,
    glowScrollBoost: 0.03,
    extraPath: false,
    path1Opacity: 0.202,
    path2BaseOpacity: 0.13,
    path2ScrollBoost: 0.04,
    path3Opacity: 0.086,
    path3ScrollBoost: 0.03,
    nodeCount: 18,
    nodeOpacity: 0.374,
    nodeOpacityScrollBoost: 0.15,
    noiseOpacity: 0.035,
    baseGradient: 'radial-gradient(ellipse at 60% 40%, #fafafc 0%, #f6f6f8 40%, #f0f0f3 100%)',
  },
  // Recommended production "rich" value: texture restored, restraint kept.
  quiet: {
    dotGrid: true,
    dotGridOpacity: 0.045,
    bokehCount: 3,
    bokehOpacityMin: 0.035,
    bokehOpacityRange: 0.03,
    glowBase: 0.14,
    glowScrollBoost: 0.025,
    extraPath: false,
    path1Opacity: 0.24,
    path2BaseOpacity: 0.15,
    path2ScrollBoost: 0.06,
    path3Opacity: null,
    path3ScrollBoost: 0,
    nodeCount: 16,
    nodeOpacity: 0.32,
    nodeOpacityScrollBoost: 0.18,
    noiseOpacity: 0.038,
    baseGradient: 'radial-gradient(ellipse at center, #ffffff 0%, #fafafa 50%, #f4f4f5 100%)',
  },
  // Original BackgroundRich prototype numbers, unchanged.
  rich: {
    dotGrid: true,
    dotGridOpacity: 0.06,
    bokehCount: 5,
    bokehOpacityMin: 0.05,
    bokehOpacityRange: 0.05,
    glowBase: 0.22,
    glowScrollBoost: 0.03,
    extraPath: true,
    path1Opacity: 0.34,
    path2BaseOpacity: 0.2,
    path2ScrollBoost: 0.1,
    path3Opacity: null,
    path3ScrollBoost: 0,
    nodeCount: 16,
    nodeOpacity: 0.46,
    nodeOpacityScrollBoost: 0.24,
    noiseOpacity: 0.045,
    baseGradient: 'radial-gradient(ellipse at center, #ffffff 0%, #fafafa 50%, #f4f4f5 100%)',
  },
  // "More marks, each fainter" — structurally denser than `rich` (extra path
  // pass + more nodes) but every individual opacity pulled back down.
  dense: {
    dotGrid: true,
    dotGridOpacity: 0.05,
    bokehCount: 6,
    bokehOpacityMin: 0.03,
    bokehOpacityRange: 0.025,
    glowBase: 0.14,
    glowScrollBoost: 0.02,
    extraPath: true,
    path1Opacity: 0.22,
    path2BaseOpacity: 0.16,
    path2ScrollBoost: 0.08,
    path3Opacity: null,
    path3ScrollBoost: 0,
    nodeCount: 22,
    nodeOpacity: 0.3,
    nodeOpacityScrollBoost: 0.16,
    noiseOpacity: 0.04,
    baseGradient: 'radial-gradient(ellipse at center, #ffffff 0%, #fafafa 50%, #f4f4f5 100%)',
  },
};

// Single coverage→intensity knob (one mechanism, not per-value hand-tuning):
// multiplies every color/glow/path/node alpha in a preset down when the
// field spans a full page. `section` is a no-op (scale 1) — bounded areas
// keep the presets' full designed intensity.
const COVERAGE_INTENSITY_SCALE: Record<BackgroundCoverage, number> = {
  page: 0.65,
  section: 1,
};

function getScaledPreset(variant: BackgroundVariant, coverage: BackgroundCoverage): RichnessPreset {
  const base = RICHNESS_PRESETS[variant];
  // `plain` is the pre-existing shipped baseline, already calibrated for a
  // full-page mount — exempt it from page-coverage attenuation so pages that
  // pass no props (PageShell's default) don't shift visually on this branch.
  const scale = variant === 'plain' ? 1 : COVERAGE_INTENSITY_SCALE[coverage];
  if (scale === 1) return base;
  return {
    ...base,
    dotGridOpacity: base.dotGridOpacity * scale,
    bokehOpacityMin: base.bokehOpacityMin * scale,
    bokehOpacityRange: base.bokehOpacityRange * scale,
    glowBase: base.glowBase * scale,
    glowScrollBoost: base.glowScrollBoost * scale,
    path1Opacity: base.path1Opacity * scale,
    path2BaseOpacity: base.path2BaseOpacity * scale,
    path2ScrollBoost: base.path2ScrollBoost * scale,
    path3Opacity: base.path3Opacity !== null ? base.path3Opacity * scale : null,
    path3ScrollBoost: base.path3ScrollBoost * scale,
    nodeOpacity: base.nodeOpacity * scale,
    nodeOpacityScrollBoost: base.nodeOpacityScrollBoost * scale,
    noiseOpacity: base.noiseOpacity * scale,
  };
}

// mulberry32 — deterministic PRNG so bokeh placement is stable across
// SSR/CSR, same technique RoleImage uses for its per-card bokeh.
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pageBokeh(count: number, opacityMin: number, opacityRange: number) {
  if (count <= 0) return null;
  const r = prng(4211);
  const pairs: [string, string][] = [
    ['124,58,237', '59,130,246'], // violet -> blue
    ['59,130,246', '45,212,191'], // blue -> cyan
    ['45,212,191', '124,58,237'], // cyan -> violet
  ];
  return Array.from({ length: count }, (_, i) => {
    const [c1, c2] = pairs[i % pairs.length];
    const size = 220 + Math.floor(r() * 260);
    const left = Math.floor(r() * 90);
    const top = Math.floor(r() * 85);
    const blur = 70 + Math.floor(r() * 50);
    const op = (opacityMin + r() * opacityRange).toFixed(3);
    return (
      <span
        key={i}
        aria-hidden
        style={{
          position: 'absolute',
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          borderRadius: '9999px',
          filter: `blur(${blur}px)`,
          opacity: Number(op),
          background: `radial-gradient(circle at 42% 40%, rgba(${c1},0.9), rgba(${c2},0.5) 55%, transparent 75%)`,
          pointerEvents: 'none',
        }}
      />
    );
  });
}

/** One scroll-driven node: r and opacity are MotionValues, so no React render per frame. */
function NodeDot({ sp, cx, cy, r0, rk, fill, o0, ok }: {
  sp: MotionValue<number>; cx: number; cy: number; r0: number; rk: number; fill: string; o0: number; ok: number;
}) {
  const r = useTransform(sp, (v) => r0 + v * rk);
  const opacity = useTransform(sp, (v) => o0 + v * ok);
  return <motion.circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />;
}

interface BackgroundProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  /** Page scroll progress 0..1. Pass a MotionValue on scrolling pages: a plain number
   *  re-renders the whole field on every change. */
  scrollProgress: number | MotionValue<number>;
  /** Richness preset. Defaults to `plain`, the shipped baseline. */
  variant?: BackgroundVariant;
  /** Viewport coverage — controls color-intensity attenuation. See `BackgroundCoverage`. */
  coverage?: BackgroundCoverage;
  /** 'fixed' (default, viewport-pinned, existing behavior) or 'absolute'
   *  (fills the nearest positioned ancestor — for a section-scoped mount). */
  position?: 'fixed' | 'absolute';
}

// Fixed baseline used in place of live scroll/mouse motion when
// prefers-reduced-motion is set — full richness, one static frame.
const REDUCED_MOTION_SCROLL_BASELINE = 0.2;

export function Background({
  mouseX,
  mouseY,
  scrollProgress,
  variant = 'plain',
  coverage = 'page',
  position = 'fixed',
}: BackgroundProps) {
  const preset = getScaledPreset(variant, coverage);
  const prefersReducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const parallaxRange = prefersReducedMotion ? 0 : 1;
  const layer1X = useTransform(smoothMouseX, [0, 1], [-18 * parallaxRange, 18 * parallaxRange]);
  const layer1Y = useTransform(smoothMouseY, [0, 1], [-13 * parallaxRange, 13 * parallaxRange]);
  const layer2X = useTransform(smoothMouseX, [0, 1], [-32 * parallaxRange, 32 * parallaxRange]);
  const layer2Y = useTransform(smoothMouseY, [0, 1], [-23 * parallaxRange, 23 * parallaxRange]);
  const layer3X = useTransform(smoothMouseX, [0, 1], [-48 * parallaxRange, 48 * parallaxRange]);
  const layer3Y = useTransform(smoothMouseY, [0, 1], [-38 * parallaxRange, 38 * parallaxRange]);

  // Reduced motion: pin to a fixed baseline instead of the live scroll
  // value, so the field renders one static (but fully rich) frame rather
  // than continuously drifting opacity/size with scroll.
  // Everything scroll-driven below is a MotionValue, so scrolling never re-renders
  // this component or repaints the blurred glows (only compositor-cheap opacity moves).
  const constSp = useMotionValue(typeof scrollProgress === 'number' ? scrollProgress : 0);
  useEffect(() => {
    if (typeof scrollProgress === 'number') constSp.set(scrollProgress);
  }, [scrollProgress, constSp]);
  const spSource = typeof scrollProgress === 'number' ? constSp : scrollProgress;
  const sp = useTransform(spSource, (v) => (prefersReducedMotion ? REDUCED_MOTION_SCROLL_BASELINE : v));
  const glowAlpha = (base: number, boost: number) => base + boost; // peak alpha, painted once
  const glowOpacity = (base: number, boost: number) =>
    // Linear in alpha, so (peak gradient) x (this opacity) equals the old per-frame gradient exactly.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTransform(sp, (v) => Math.min(1, (base + v * boost) / (base + boost)));
  const glow1 = glowOpacity(preset.glowBase, preset.glowScrollBoost);
  const glow2 = glowOpacity(preset.glowBase, preset.glowScrollBoost);
  const glow3 = glowOpacity(preset.glowBase * 0.6, preset.glowScrollBoost * 0.6);
  const dash1 = useTransform(sp, (v) => 1600 - v * 800);
  const dash2 = useTransform(sp, (v) => 1400 - v * 700);
  const path2Opacity = useTransform(sp, (v) => preset.path2BaseOpacity + v * preset.path2ScrollBoost);
  const path3Op = useTransform(sp, (v) => (preset.path3Opacity ?? 0) + v * preset.path3ScrollBoost);

  // Off-screen: skip the SVG layers, glow, dot-grid, and bokeh — keep only
  // the cheap base gradient mounted so the field resumes instantly when it
  // re-enters view (no rebuild, just re-render of already-cheap markup).
  const renderRichLayers = inView;

  return (
    <div ref={containerRef} className={`${position} inset-0 overflow-hidden pointer-events-none z-0`}>
      {/* The base wash is light by design; dark theme swaps it via --bg-field-base
          (set under [data-theme="dark"] in globals.css). Without this the light
          gradient painted over the dark page and hid white text. */}
      <div className="absolute inset-0" style={{ background: `var(--bg-field-base, ${preset.baseGradient})` }} />

      {renderRichLayers && (
        <>
          {preset.dotGrid && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(15,15,17,${preset.dotGridOpacity}) 1px, transparent 1.15px)`,
                backgroundSize: '22px 22px',
              }}
            />
          )}

          {pageBokeh(preset.bokehCount, preset.bokehOpacityMin, preset.bokehOpacityRange)}

          {/* --- Glow field --- */}
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full blur-[140px]"
            style={{
              x: layer3X,
              y: layer3Y,
              left: '11%',
              top: '16%',
              opacity: glow1,
              background: `radial-gradient(circle, rgba(124, 58, 237, ${glowAlpha(preset.glowBase, preset.glowScrollBoost)}) 0%, transparent 68%)`,
            }}
          />
          <motion.div
            className="absolute w-[480px] h-[480px] rounded-full blur-[115px]"
            style={{
              x: layer2X,
              y: layer2Y,
              right: '17%',
              bottom: '18%',
              opacity: glow2,
              background: `radial-gradient(circle, rgba(45, 212, 191, ${glowAlpha(preset.glowBase, preset.glowScrollBoost)}) 0%, transparent 68%)`,
            }}
          />
          <motion.div
            className="absolute w-[410px] h-[410px] rounded-full blur-[98px]"
            style={{
              x: layer2X,
              y: layer2Y,
              right: '10%',
              top: '11%',
              opacity: glow3,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${glowAlpha(preset.glowBase * 0.6, preset.glowScrollBoost * 0.6)}) 0%, transparent 68%)`,
            }}
          />

          {/* --- SVG path layer 1 (primary) — parallax slow --- */}
          <motion.svg className="absolute inset-0 w-full h-full" style={{ x: layer1X, y: layer1Y, opacity: preset.path1Opacity }}>
            <defs>
              <linearGradient id="prism-bg-grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={PRISM.violet} stopOpacity="0" />
                <stop offset="25%" stopColor={PRISM.violet} stopOpacity="1" />
                <stop offset="60%" stopColor={PRISM.cyan} stopOpacity="1" />
                <stop offset="100%" stopColor={PRISM.cyan} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="prism-bg-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={PRISM.cyan} stopOpacity="0" />
                <stop offset="45%" stopColor={PRISM.blue} stopOpacity="1" />
                <stop offset="100%" stopColor={PRISM.violet} stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d="M-100,180 C150,80 300,280 500,200 S800,120 1100,240 S1500,180 1700,220"
              fill="none"
              stroke="url(#prism-bg-grad1)"
              strokeWidth="1.5"
              strokeDasharray="1600"
              style={{ strokeDashoffset: dash1 }}
            />
            <motion.path
              d="M-50,480 C200,420 400,520 650,460 S950,380 1200,500 S1550,440 1700,480"
              fill="none"
              stroke="url(#prism-bg-grad2)"
              strokeWidth="1.5"
              strokeDasharray="1400"
              style={{ strokeDashoffset: dash2 }}
            />
            {preset.extraPath && (
              <path
                d="M-80,80 Q220,180 480,60 T980,140 T1500,40"
                fill="none"
                stroke="url(#prism-bg-grad2)"
                strokeWidth="1.25"
              />
            )}
          </motion.svg>

          {/* --- SVG path layer 2 (secondary) — parallax medium --- */}
          <motion.svg
            className="absolute inset-0 w-full h-full"
            style={{ x: layer2X, y: layer2Y, opacity: path2Opacity }}
          >
            <path d="M-80,320 C200,260 400,380 650,300 S950,240 1200,360 S1550,290 1700,330" fill="none" stroke="url(#prism-bg-grad1)" strokeWidth="1" />
            <path d="M-30,620 C250,560 450,660 700,590 S1000,530 1250,640 S1580,580 1720,610" fill="none" stroke="url(#prism-bg-grad2)" strokeWidth="1" />
          </motion.svg>

          {/* --- SVG path layer 3 (tertiary, thin) — plain-only, parallax fast --- */}
          {preset.path3Opacity !== null && (
            <motion.svg
              className="absolute inset-0 w-full h-full"
              style={{ x: layer3X, y: layer3Y, opacity: path3Op }}
            >
              <path d="M-120,150 C180,140 320,170 520,150 S820,130 1120,170 S1420,150 1720,160" fill="none" stroke={PRISM.violet} strokeWidth="0.75" strokeOpacity="0.6" />
              <path d="M-60,550 C220,530 380,570 600,540 S920,520 1220,560 S1520,530 1760,540" fill="none" stroke={PRISM.cyan} strokeWidth="0.75" strokeOpacity="0.5" />
            </motion.svg>
          )}

          {/* --- Node dots ---
              `plain` keeps its original per-index staggered formula exactly
              (shipped baseline, don't drift it). The richer variants use the
              flatter formula from the original BackgroundRich prototype,
              scaled by the preset's node count/opacity/boost. */}
          <motion.svg className="absolute inset-0 w-full h-full" style={{ x: layer3X, y: layer3Y, opacity: preset.nodeOpacity }}>
            {[...Array(preset.nodeCount)].map((_, i) => {
              const cols = variant === 'plain' ? 6 : 5;
              const row = Math.floor(i / cols);
              const col = i % cols;
              if (variant === 'plain') {
                const nodeColor = i < 6 ? PRISM.violet : i < 12 ? PRISM.blue : PRISM.cyan;
                return (
                  <NodeDot
                    key={i}
                    sp={sp}
                    cx={80 + col * 280 + Math.sin(i * 1.7) * 40}
                    cy={120 + row * 220 + Math.cos(i * 0.9) * 35}
                    r0={2 + (i % 3)}
                    rk={0.4}
                    fill={nodeColor}
                    o0={0.18 + (i % 3) * 0.06}
                    ok={0.15}
                  />
                );
              }
              const third = Math.ceil(preset.nodeCount / 3);
              const nodeColor = i < third ? PRISM.violet : i < third * 2 ? PRISM.blue : PRISM.cyan;
              return (
                <NodeDot
                  key={i}
                  sp={sp}
                  cx={80 + col * 300 + Math.sin(i) * 55}
                  cy={120 + row * 220 + Math.cos(i) * 35}
                  r0={2.6}
                  rk={0.6}
                  fill={nodeColor}
                  o0={0.4}
                  ok={preset.nodeOpacityScrollBoost}
                />
              );
            })}
          </motion.svg>

          {/* --- Noise texture overlay --- */}
          <div
            className="absolute inset-0"
            style={{
              opacity: preset.noiseOpacity,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </>
      )}
    </div>
  );
}
