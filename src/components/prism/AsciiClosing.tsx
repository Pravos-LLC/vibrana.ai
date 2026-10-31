'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from './utils/cn';

/**
 * AsciiField — round-2 revision of the "08a" study
 * (research/homepage-visual-exploration/08-ascii-monospace/a-precision-into-meaning.html).
 * Renamed from AsciiClosing per JE's round-2 review (see
 * research/design-components/LEDGER.md, AsciiField row):
 *
 *   1. TEXT OVER THE FIELD IS REJECTED, PERMANENTLY. This is no longer a
 *      "closing section" with a headline/body/CTA — it is a standalone,
 *      self-contained decorative ASCII field that can be dropped between
 *      content anywhere. It renders nothing but the field. `AsciiClosing`
 *      is kept as a compat alias export so existing imports do not break.
 *      (The unused `ENTERPRISE_ASCII_CLOSING` copy block was removed 2026-09-30.)
 *   2. CANVAS ARCHITECTURE, not per-cell DOM nodes. JE saw the pointer lens
 *      ~3s behind the cursor on the DOM version. The likely mechanism: every
 *      cell inside the lens's bounding box got a direct style/textContent
 *      write every rAF frame, and because the box tracks the pointer
 *      continuously, a wide, ever-shifting set of the grid's DOM nodes was
 *      being invalidated every frame — enough style/paint work on a few
 *      thousand live elements to fall behind the input queue under load.
 *      The fix is architectural: one <canvas>, glyphs drawn with fillText,
 *      cleared and fully redrawn every rAF frame. Canvas draw calls do not
 *      trigger layout or style recalculation and batch into a single
 *      composite, so redrawing the whole grid every frame is cheaper than
 *      the old approach's *partial* DOM writes were. The pointer lens is
 *      pure canvas-space math against the latest pointer sample — there is
 *      no extra hop through the DOM, so the lens is at most one rAF
 *      (~16ms @60Hz) behind the physical cursor. See the "measured" note in
 *      the PR description for how this was verified.
 *   3. New word sets. The cycling virtue-word litany ("love", "compassion",
 *      "care", ...) is retired — see the standing taste rule in LEDGER.md
 *      ("no virtue-word litanies; words must be specific, surprising,
 *      grounded"). Three replacement sets are exported below, each pulled
 *      from an actual Vibrana brand source rather than invented:
 *        - WORDS_METHOD: the two-week pod sprint phases + builder lexicon
 *          (brand/theory-of-change.md, VOICE.md §5). Mechanism-first.
 *        - WORDS_QUESTIONS: real questions the studio asks, lifted from the
 *          founder interview (brand/interview-transcript.md) and the
 *          manifesto's "what are humans for" cornerstone line.
 *        - WORDS_MOMENTS: concrete scenes from the pod process and the
 *          founder's five-years-out answer (brand/interview-transcript.md
 *          Q7), not abstractions.
 *      Default word set is WORDS_QUESTIONS (JE's engaged preference).
 *      Callers pick another set via the `words` prop.
 *
 * Respects prefers-reduced-motion (one static held frame, fully rendered,
 * no loop, no pointer lens) and pauses the rAF loop when the section
 * scrolls out of view (IntersectionObserver) — both preserved from round 1.
 *
 * Default form factor is `contained`: a bounded, roughly square frame (JE's
 * preference over the round-1 full-bleed field). `wide` restores the
 * full-width, min-h-screen presentation for surfaces that want it.
 */

export const WORDS_METHOD = ['shadow', 'prioritize', 'build', 'validate', 'ship', 'redesign', 'orchestrate', 'judgment'] as const;

export const WORDS_QUESTIONS = [
  'what are humans for?',
  "who's orchestrating this?",
  'what would you refuse?',
  'who gave you permission?',
  'what did you build today?',
  "what's the real workflow?",
] as const;

export const WORDS_MOMENTS = [
  'the pilot that shipped',
  'monday, not someday',
  'no more permission slips',
  'the handoff, not the pitch',
  'shadow, day one',
  'the graph they keep',
] as const;

const NOISE_POOL = '01#$%&*+-/<=>?@[]{}|~;:.^01010110ABCDEF0123456789';
const LETTER_POOL = 'abcdefghijklmnopqrstuvwxyz';

// ---- timeline (ms) — shared across all words, only length-dependent spans vary ----
const T_RESOLVE_START = 700;
const STAGGER = 95;
const FLICKER_WINDOW = 950;
const RESOLVE_TAIL = 350;
const HOLD_DURATION = 2200;
const DISSOLVE_STAGGER = 70;
const DISSOLVE_DURATION = 650;
const TAIL_GAP = 900;
const TICK_MS = 95;

// Noise alpha — pushed whiter/fainter than the study (was 0.14 + hash*0.34).
const NOISE_ALPHA_MIN = 0.035;
const NOISE_ALPHA_RANGE = 0.095;

// Pointer "magnify" lens.
const LENS_RADIUS_PX = 150;
const LENS_MAX_ALPHA_BOOST = 0.34;
const LENS_MAX_SCALE = 1.32;
const LENS_LETTER_CHANCE = 0.55; // chance a cell inside the lens shows a letter, not a symbol

const FONT_SIZE = 19;
const LINE_HEIGHT_RATIO = 1.34;
const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

interface WordTiming {
  word: string;
  n: number;
  cycleStart: number; // offset into the total timeline
  cycleLength: number;
}

function buildWordTimings(words: readonly string[]): { timings: WordTiming[]; total: number } {
  let cursor = 0;
  const timings: WordTiming[] = words.map((word) => {
    const n = word.length;
    const resolveSpan = (n - 1) * STAGGER + RESOLVE_TAIL;
    const resolveEnd = T_RESOLVE_START + resolveSpan;
    const dissolveStart = resolveEnd + HOLD_DURATION;
    const dissolveSpan = (n - 1) * DISSOLVE_STAGGER + DISSOLVE_DURATION;
    const cycleLength = dissolveStart + dissolveSpan + TAIL_GAP;
    const timing: WordTiming = { word, n, cycleStart: cursor, cycleLength };
    cursor += cycleLength;
    return timing;
  });
  return { timings, total: cursor };
}

function hash(seed: number, tick: number): number {
  const x = Math.sin(seed * 127.1 + tick * 311.7 + 91.7) * 43758.5453;
  return x - Math.floor(x);
}

function noiseChar(seed: number, t: number): string {
  const tick = Math.floor((t + seed * 53) / TICK_MS);
  const v = hash(seed, tick);
  return NOISE_POOL[Math.floor(v * NOISE_POOL.length)];
}

function letterChar(seed: number, t: number): string {
  const tick = Math.floor((t + seed * 53) / TICK_MS);
  const v = hash(seed + 400, tick);
  return LETTER_POOL[Math.floor(v * LETTER_POOL.length)];
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

function prismColor(p: number): [number, number, number] {
  const vC = [124, 58, 237];
  const bC = [59, 130, 246];
  const cC = [45, 212, 191];
  let r: number, g: number, b: number;
  if (p < 0.5) {
    const q = p / 0.5;
    r = lerp(vC[0], bC[0], q);
    g = lerp(vC[1], bC[1], q);
    b = lerp(vC[2], bC[2], q);
  } else {
    const q = (p - 0.5) / 0.5;
    r = lerp(bC[0], cC[0], q);
    g = lerp(bC[1], cC[1], q);
    b = lerp(bC[2], cC[2], q);
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
}

interface CellSeed {
  seed: number;
  row: number;
  col: number;
}

export interface AsciiFieldProps {
  className?: string;
  /** Override the word cycle. Defaults to WORDS_QUESTIONS. */
  words?: readonly string[];
  /** Bounded/square frame (default) vs full-width min-h-screen field. */
  variant?: 'contained' | 'wide';
}

export function AsciiField({ className, words = WORDS_QUESTIONS, variant = 'contained' }: AsciiFieldProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stageEl = stageRef.current;
    const canvas = canvasRef.current;
    if (!stageEl || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const { timings, total: TOTAL_LENGTH } = buildWordTimings(words);

    let cols = 0;
    let rows = 0;
    let chW = 8;
    let chH = 18;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let cellSeeds: CellSeed[] = [];
    let targetRow = 0;
    let visible = true;
    let rafId: number | null = null;
    let startTime: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    // Pointer position in canvas-space (CSS px, relative to the stage). This
    // is written synchronously on every native pointermove event; the rAF
    // loop reads whatever the latest value is on its next tick, so the lens
    // is at most one frame behind the physical cursor.
    const pointer = { x: -9999, y: -9999 };

    function measureFont() {
      ctx!.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
      const m = ctx!.measureText('M');
      chW = Math.max(6, m.width);
      chH = Math.max(10, FONT_SIZE * LINE_HEIGHT_RATIO);
    }

    function buildGrid() {
      const rect = stageEl!.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      cssH = Math.max(1, Math.round(rect.height));
      dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      canvas!.style.width = `${cssW}px`;
      canvas!.style.height = `${cssH}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      measureFont();

      // Fill the container edge-to-edge: ceil so a partial cell covers any
      // remainder rather than leaving an empty band at the far edge.
      const maxN = Math.max(...words.map((w) => w.length));
      cols = Math.max(maxN + 4, Math.ceil(cssW / chW));
      rows = Math.max(5, Math.ceil(cssH / chH));
      targetRow = Math.floor(rows / 2);

      const seedBase = Math.random() * 10000;
      cellSeeds = new Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          cellSeeds[idx] = { seed: seedBase + idx * 7.13 + r * 1.91 + c * 3.37, row: r, col: c };
        }
      }
    }

    function activeWordAt(tTotal: number): { timing: WordTiming; localT: number } {
      let acc = 0;
      for (const timing of timings) {
        if (tTotal < acc + timing.cycleLength) {
          return { timing, localT: tTotal - acc };
        }
        acc += timing.cycleLength;
      }
      const last = timings[timings.length - 1];
      return { timing: last, localT: tTotal - (TOTAL_LENGTH - last.cycleLength) };
    }

    function drawCell(cellSeed: CellSeed, t: number, timing: WordTiming, localT: number) {
      const n = timing.n;
      const targetStart = Math.floor((cols - n) / 2);
      const isTarget = cellSeed.row === targetRow && cellSeed.col >= targetStart && cellSeed.col < targetStart + n;

      const cx = cellSeed.col * chW + chW / 2;
      const cy = cellSeed.row * chH + chH / 2;

      let lensBoost = 0;
      if (!reduced && pointer.x > -1000) {
        const dx = cx - pointer.x;
        const dy = cy - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LENS_RADIUS_PX) lensBoost = 1 - dist / LENS_RADIUS_PX;
      }

      let char: string;
      let color: string;
      let fontPx = FONT_SIZE;

      if (!isTarget) {
        const cellTick = Math.floor((t + cellSeed.seed * 53) / TICK_MS);
        const inLens = lensBoost > 0.05;
        const showLetter = inLens && hash(cellSeed.seed + 900, Math.floor(t / TICK_MS)) < LENS_LETTER_CHANCE * lensBoost;
        char = showLetter ? letterChar(cellSeed.seed, t) : NOISE_POOL[Math.floor(hash(cellSeed.seed, cellTick) * NOISE_POOL.length)];
        const baseAlpha = NOISE_ALPHA_MIN + hash(cellSeed.seed + 1000, cellTick) * NOISE_ALPHA_RANGE;
        const alpha = Math.min(0.62, baseAlpha + lensBoost * LENS_MAX_ALPHA_BOOST);
        color = `rgba(15,15,17,${alpha.toFixed(3)})`;
        if (lensBoost > 0.02) fontPx = FONT_SIZE * (1 + lensBoost * (LENS_MAX_SCALE - 1));
      } else {
        const i = cellSeed.col - targetStart;
        const targetChar = timing.word[i];
        const resolveAt = T_RESOLVE_START + i * STAGGER;
        const flickerAt = resolveAt - FLICKER_WINDOW;
        const dissolveStart = T_RESOLVE_START + (n - 1) * STAGGER + RESOLVE_TAIL + HOLD_DURATION;
        const dissolveAt = dissolveStart + i * DISSOLVE_STAGGER;
        const dissolveEnd = dissolveAt + DISSOLVE_DURATION;
        const col = prismColor(n <= 1 ? 0 : i / (n - 1));
        const colorStr = `${col[0]},${col[1]},${col[2]}`;

        if (localT < flickerAt) {
          char = noiseChar(cellSeed.seed, t);
          const a1 = NOISE_ALPHA_MIN + hash(cellSeed.seed + 1000, Math.floor((t + cellSeed.seed * 53) / TICK_MS)) * NOISE_ALPHA_RANGE;
          color = `rgba(15,15,17,${a1.toFixed(3)})`;
        } else if (localT < resolveAt) {
          const progress = (localT - flickerAt) / FLICKER_WINDOW;
          const tick = Math.floor(t / TICK_MS);
          const show = hash(cellSeed.seed + 55, tick) < progress;
          char = show ? targetChar : noiseChar(cellSeed.seed, t);
          const a2 = 0.08 + progress * 0.6;
          color = show ? `rgba(${colorStr},${a2.toFixed(2)})` : `rgba(15,15,17,${(NOISE_ALPHA_MIN + progress * 0.06).toFixed(3)})`;
        } else if (localT < dissolveAt) {
          char = targetChar;
          color = `rgba(${colorStr},0.94)`;
        } else if (localT < dissolveEnd) {
          const dprog = (localT - dissolveAt) / DISSOLVE_DURATION;
          const tick2 = Math.floor(t / TICK_MS);
          const show2 = hash(cellSeed.seed + 55, tick2) < 1 - dprog;
          char = show2 ? targetChar : noiseChar(cellSeed.seed, t);
          const a3 = 0.94 - dprog * 0.7;
          color = show2 ? `rgba(${colorStr},${Math.max(0.2, a3).toFixed(2)})` : `rgba(15,15,17,${(NOISE_ALPHA_MIN + (1 - dprog) * 0.06).toFixed(3)})`;
        } else {
          char = noiseChar(cellSeed.seed, t);
          const a4 = NOISE_ALPHA_MIN + hash(cellSeed.seed + 1000, Math.floor((t + cellSeed.seed * 53) / TICK_MS)) * NOISE_ALPHA_RANGE;
          color = `rgba(15,15,17,${a4.toFixed(3)})`;
        }
      }

      if (fontPx !== FONT_SIZE) ctx!.font = `${fontPx.toFixed(1)}px ${FONT_FAMILY}`;
      ctx!.fillStyle = color;
      ctx!.fillText(char, cx, cy);
      if (fontPx !== FONT_SIZE) ctx!.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    }

    function drawFrame(t: number, timing: WordTiming, localT: number) {
      ctx!.clearRect(0, 0, cssW, cssH);
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
      for (const cellSeed of cellSeeds) drawCell(cellSeed, t, timing, localT);
    }

    function renderStatic() {
      const { timing } = activeWordAt(0);
      const localT = T_RESOLVE_START + (timing.n - 1) * STAGGER + RESOLVE_TAIL + HOLD_DURATION * 0.5;
      drawFrame(localT, timing, localT);
    }

    function frame(now: number) {
      if (!visible) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (startTime === null) startTime = now;
      const t = (now - startTime) % TOTAL_LENGTH;
      const { timing, localT } = activeWordAt(t);
      drawFrame(t, timing, localT);
      rafId = requestAnimationFrame(frame);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = stageEl!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildGrid();
        if (reduced) {
          renderStatic();
        } else {
          startTime = null;
        }
      }, 150);
    }

    buildGrid();
    if (reduced) {
      renderStatic();
    } else {
      rafId = requestAnimationFrame(frame);
      stageEl.addEventListener('pointermove', onPointerMove);
      stageEl.addEventListener('pointerleave', onPointerLeave);
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(stageEl);
    window.addEventListener('resize', onResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(stageEl);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      stageEl.removeEventListener('pointermove', onPointerMove);
      stageEl.removeEventListener('pointerleave', onPointerLeave);
      ro?.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  return (
    <section
      className={cn(
        'relative w-full overflow-hidden bg-(--surface-base,#fff)',
        variant === 'wide' ? 'min-h-[70vh] md:min-h-[80vh]' : 'mx-auto aspect-square max-w-xl rounded-2xl border border-(--border-subtle)',
        className,
      )}
      aria-label="Decorative ASCII field"
    >
      <span className="sr-only">Precision resolving into: {words.join(', ')}.</span>
      {/* absolute inset-0, not h-full: the wide variant's height comes from
          min-height on the section (not a definite height), and percentage
          heights don't resolve against min-height — h-full would collapse
          this to content height instead of filling the section. */}
      <div ref={stageRef} className="absolute inset-0">
        <canvas ref={canvasRef} data-testid="ascii-field-canvas" aria-hidden className="block h-full w-full select-none" />
      </div>
    </section>
  );
}

/** Compat alias — round 1 named this component AsciiClosing. Do not add new callers. */
export const AsciiClosing = AsciiField;
export type AsciiClosingProps = AsciiFieldProps;
