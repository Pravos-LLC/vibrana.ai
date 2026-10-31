'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from './utils/cn';
import { prismColors, prismSemantic } from './tokens';
import { ASCII_DIALOGUE_ARIA_LABEL, ASCII_DIALOGUE_CAPTION, ASCII_DIALOGUE_PASSAGE, type AsciiDialoguePassage } from '@/src/ascii-dialogue-content';

/**
 * AsciiDialogue - "08b code-becomes-language" study, canvas rewrite.
 * Study: research/homepage-visual-exploration/08-ascii-monospace/b-code-becomes-language.html
 *
 * Concept: syntax-highlighted source code disassembles character-by-character
 * and flies, mid-scramble, into the exact letters of a plain human sentence.
 * The multi-hue syntax colors drain to a single calm ink tone as each
 * character settles, legible to a person instead of a parser. The sentence
 * stays in the SAME JetBrains Mono font and the SAME monospace grid spacing
 * as the code the whole time (round-2 revision, JE) - no font switch. The
 * human/machine signal comes from the color drain and the disassemble/fly
 * motion alone, not from a mono-to-serif swap. The one payoff word in the
 * passage (`passage.gradientWord`) renders with the prism gradient once the
 * sentence is fully resolved; everything else settles to flat ink.
 *
 * CANVAS ARCHITECTURE, not per-cell DOM nodes - the AsciiField lesson (see
 * AsciiClosing.tsx header comment): one <canvas>, glyphs drawn with fillText,
 * cleared and redrawn every rAF frame. No layout/style recalculation, no
 * per-character DOM writes.
 *
 * Respects prefers-reduced-motion: renders one static frame (dimmed code
 * above, resolved sentence in mono ink below, payoff word in the prism
 * gradient), no loop, no flight. Pauses the rAF loop when scrolled out of
 * view (IntersectionObserver).
 */

const KEYWORDS = ['const', 'if', 'return', 'export', 'default'];
const SCRAMBLE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]()<>=;:,.+-*/\\|&%$#@!?';

type TokenType = 'keyword' | 'punct' | 'number' | 'ident' | 'space';

function tokenizeLine(line: string): TokenType[] {
  const result: (TokenType | null)[] = new Array(line.length).fill(null);
  KEYWORDS.forEach((kw) => {
    let idx = 0;
    for (;;) {
      idx = line.indexOf(kw, idx);
      if (idx === -1) break;
      const before = idx > 0 ? line[idx - 1] : '';
      const after = idx + kw.length < line.length ? line[idx + kw.length] : '';
      const boundaryBefore = !before || /[^a-zA-Z0-9_]/.test(before);
      const boundaryAfter = !after || /[^a-zA-Z0-9_]/.test(after);
      if (boundaryBefore && boundaryAfter) {
        for (let k = 0; k < kw.length; k++) result[idx + k] = 'keyword';
      }
      idx += kw.length;
    }
  });
  for (let i = 0; i < line.length; i++) {
    if (result[i]) continue;
    const c = line[i];
    if (c === ' ') { result[i] = 'space'; continue; }
    if (/[{}()[\];,.<>=]/.test(c)) { result[i] = 'punct'; continue; }
    if (/[0-9]/.test(c)) { result[i] = 'number'; continue; }
    result[i] = 'ident';
  }
  return result as TokenType[];
}

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

const SYNTAX_RGB: Record<Exclude<TokenType, 'space'>, [number, number, number]> = {
  keyword: hexToRgb(prismColors.blueStrong),
  punct: hexToRgb(prismColors.violetStrong),
  number: hexToRgb(prismColors.cyanStrong),
  ident: [102, 102, 108], // approximates ink-secondary as a flat RGB for lerp math
};

const INK_RGB: [number, number, number] = [15, 15, 17];

// Prism spectrum text-gradient stops, matching --gradient-prism-text in
// globals.css / GradientText.tsx ("prism" variant, darkened for on-white
// text contrast). Canvas gradients need concrete stop colors rather than a
// CSS custom property, so these come from the same prismColors tokens
// GradientText itself is built on (tokens.ts), not re-hardcoded hex.
const PRISM_GRADIENT_STOPS: [number, string][] = [
  [0, prismColors.violetStrong],
  [0.5, prismColors.blueStrong],
  [1, prismColors.cyanStrong],
];

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

function easeInOutCubic(p: number) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function hash(seed: number, tick: number): number {
  const x = Math.sin(seed * 127.1 + tick * 311.7 + 91.7) * 43758.5453;
  return x - Math.floor(x);
}

function scrambleChar(seed: number, tick: number): string {
  const v = hash(seed, tick);
  return SCRAMBLE_CHARS[Math.floor(v * SCRAMBLE_CHARS.length)];
}

interface SourceParticle {
  ch: string;
  type: Exclude<TokenType, 'space'>;
  row: number;
  col: number;
  sourceX: number;
  sourceY: number;
  seed: number;
  // assignment (flight to a target letter)
  assigned: boolean;
  targetChar?: string;
  targetX?: number;
  targetY?: number;
  /** Index of targetChar within `passage.sentence` (spaces included). */
  targetSentIndex?: number;
  flightDelay?: number;
  flightDuration?: number;
  // dissolve (no target, drifts away)
  dissolveDelay?: number;
  dissolveDuration?: number;
}

// ---- timeline (ms) ----
const HOLD_CODE = 1900;
const STAGGER = 42;
const BASE_FLIGHT = 950;
const FLIGHT_JITTER = 380;
const DISSOLVE_STAGGER = 55;
const DISSOLVE_DURATION = 620;
const HOLD_SENTENCE = 2500;
const FADE_DURATION = 450;
const TAIL_GAP = 350;
const TICK_MS = 90;

const FONT_WEIGHT_MONO = 400;
const LINE_HEIGHT_RATIO = 1.6;
const PAD_X = 6;
const PAD_Y = 8;
const ROW_GAP = 2; // extra rows of vertical breathing room before the target row

export interface AsciiDialogueProps {
  className?: string;
  passage?: AsciiDialoguePassage;
  /** Show the small explanatory caption under the field. Default true. */
  showCaption?: boolean;
}

export function AsciiDialogue({ className, passage = ASCII_DIALOGUE_PASSAGE, showCaption = true }: AsciiDialogueProps) {
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

    const codeLines = passage.codeLines;
    const sentence = passage.sentence;
    const gradientWord = passage.gradientWord;

    let monoFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    if (typeof window !== 'undefined') {
      const rootStyle = getComputedStyle(document.documentElement);
      const monoVar = rootStyle.getPropertyValue('--font-mono').trim();
      if (monoVar) monoFamily = `${monoVar}, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    }

    let fontSize = 15;
    let cellW = 8;
    let cellH = 18;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let particles: SourceParticle[] = [];
    let transitionTotal = 0;
    let totalCycle = 0;
    let targetStartX = 0;
    let targetY = 0;
    let cursorX = 0;
    let visible = true;
    let rafId: number | null = null;
    let startTime: number | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    // [startSentIndex, endSentIndex) of `gradientWord` within `sentence`, or
    // null if not found. Built once per layout pass.
    let gradientRange: [number, number] | null = null;
    let gradientFill: CanvasGradient | null = null;

    function monoFont(size: number) {
      return `${FONT_WEIGHT_MONO} ${size.toFixed(1)}px ${monoFamily}`;
    }

    function isInGradientRange(sentIndex: number): boolean {
      return !!gradientRange && sentIndex >= gradientRange[0] && sentIndex < gradientRange[1];
    }

    function buildLayout() {
      const rect = stageEl!.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;

      fontSize = Math.min(17, Math.max(11, cssW * 0.03));
      ctx!.font = monoFont(fontSize);
      const m = ctx!.measureText('M');
      cellW = Math.max(6, m.width);
      cellH = fontSize * LINE_HEIGHT_RATIO;

      const codeRows = codeLines.length;
      const targetRow = codeRows + ROW_GAP;
      cssH = Math.round(PAD_Y * 2 + (targetRow + 1) * cellH);

      canvas!.width = Math.round(cssW * dpr);
      canvas!.height = Math.round(cssH * dpr);
      canvas!.style.width = `${cssW}px`;
      canvas!.style.height = `${cssH}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ---- source particles (visible, non-space chars) ----
      const seedBase = 17.31;
      const source: SourceParticle[] = [];
      codeLines.forEach((line, row) => {
        const tokens = tokenizeLine(line);
        for (let col = 0; col < line.length; col++) {
          const type = tokens[col];
          if (type === 'space') continue;
          source.push({
            ch: line[col],
            type,
            row,
            col,
            sourceX: PAD_X + col * cellW,
            sourceY: PAD_Y + row * cellH,
            seed: seedBase + row * 91.7 + col * 3.13,
            assigned: false,
          });
        }
      });

      // ---- target chars (visible, non-space) from the sentence ----
      const targetChars: { ch: string; sentIndex: number }[] = [];
      for (let i = 0; i < sentence.length; i++) {
        if (sentence[i] === ' ') continue;
        targetChars.push({ ch: sentence[i], sentIndex: i });
      }

      const sentenceWidthPx = sentence.length * cellW;
      targetStartX = Math.max(PAD_X, (cssW - sentenceWidthPx) / 2);
      targetY = PAD_Y + targetRow * cellH;
      cursorX = targetStartX + sentence.length * cellW + 2;

      // ---- gradient payoff word: locate it in the sentence and build a
      // canvas gradient spanning its grid cell range. Coordinates are
      // absolute canvas space, so the same gradient object paints correctly
      // across separate fillText calls for each character in the word. ----
      const wordStart = gradientWord ? sentence.indexOf(gradientWord) : -1;
      if (wordStart >= 0) {
        gradientRange = [wordStart, wordStart + gradientWord.length];
        const x0 = targetStartX + wordStart * cellW;
        const x1 = targetStartX + (wordStart + gradientWord.length) * cellW;
        const grad = ctx!.createLinearGradient(x0, targetY, x1, targetY + cellH);
        PRISM_GRADIENT_STOPS.forEach(([offset, color]) => grad.addColorStop(offset, color));
        gradientFill = grad;
      } else {
        gradientRange = null;
        gradientFill = null;
      }

      // spread target chars evenly across source particles (nearest-free assignment)
      const S = source.length;
      const T = targetChars.length;
      const used = new Set<number>();
      function findNearestFree(ideal: number): number {
        if (!used.has(ideal) && ideal >= 0 && ideal < S) return ideal;
        for (let d = 1; d < S; d++) {
          const up = ideal + d;
          const down = ideal - d;
          if (up < S && !used.has(up)) return up;
          if (down >= 0 && !used.has(down)) return down;
        }
        return ideal;
      }
      const assignments: number[] = new Array(T);
      for (let t = 0; t < T; t++) {
        const ideal = T > 1 ? Math.round((t * (S - 1)) / (T - 1)) : Math.round((S - 1) / 2);
        const idx = findNearestFree(ideal);
        used.add(idx);
        assignments[t] = idx;
      }

      for (let ti = 0; ti < T; ti++) {
        const sp = source[assignments[ti]];
        sp.assigned = true;
        sp.targetChar = targetChars[ti].ch;
        sp.targetX = targetStartX + targetChars[ti].sentIndex * cellW;
        sp.targetY = targetY;
        sp.targetSentIndex = targetChars[ti].sentIndex;
        sp.flightDelay = ti * STAGGER;
        sp.flightDuration = BASE_FLIGHT + hash(sp.seed, 0) * FLIGHT_JITTER;
      }

      const dissolveMaxDelay = T * STAGGER;
      source.forEach((sp) => {
        if (sp.assigned) return;
        sp.dissolveDelay = hash(sp.seed, 1) * dissolveMaxDelay;
        sp.dissolveDuration = DISSOLVE_DURATION + hash(sp.seed, 2) * 320;
      });

      particles = source;

      let maxFlightEnd = 0;
      let maxDissolveEnd = 0;
      particles.forEach((sp) => {
        if (sp.assigned) {
          maxFlightEnd = Math.max(maxFlightEnd, (sp.flightDelay ?? 0) + (sp.flightDuration ?? 0));
        } else {
          maxDissolveEnd = Math.max(maxDissolveEnd, (sp.dissolveDelay ?? 0) + (sp.dissolveDuration ?? 0));
        }
      });
      transitionTotal = Math.max(maxFlightEnd, maxDissolveEnd) + 120;
      totalCycle = HOLD_CODE + transitionTotal + HOLD_SENTENCE + FADE_DURATION + TAIL_GAP;
    }

    function drawStatic(sp: SourceParticle, alphaScale = 1) {
      const [r, g, b] = SYNTAX_RGB[sp.type];
      const a = 0.9 * alphaScale;
      ctx!.font = monoFont(fontSize);
      ctx!.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx!.fillText(sp.ch, sp.sourceX + cellW / 2, sp.sourceY + cellH / 2);
    }

    function drawFrame(t: number) {
      ctx!.clearRect(0, 0, cssW, cssH);
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      let globalAlpha = 1;
      const fadeStart = HOLD_CODE + transitionTotal + HOLD_SENTENCE;
      if (t >= fadeStart) {
        globalAlpha = Math.max(0, 1 - (t - fadeStart) / FADE_DURATION);
      }
      ctx!.globalAlpha = globalAlpha;

      const transitionStart = HOLD_CODE;
      const inTransition = t >= transitionStart && t < transitionStart + transitionTotal;
      const afterTransition = t >= transitionStart + transitionTotal;

      for (const sp of particles) {
        if (sp.assigned) {
          const delay = sp.flightDelay ?? 0;
          const duration = sp.flightDuration ?? BASE_FLIGHT;
          const localT = t - transitionStart - delay;

          if (t < transitionStart || (inTransition && localT < 0)) {
            drawStatic(sp);
            continue;
          }
          if (inTransition && localT >= 0 && localT < duration) {
            const p = Math.min(1, localT / duration);
            const eased = easeInOutCubic(p);
            const x = lerp(sp.sourceX, sp.targetX!, eased);
            const y = lerp(sp.sourceY, sp.targetY!, eased);
            const [sr, sgc, sb] = SYNTAX_RGB[sp.type];
            const [ir, ig, ib] = INK_RGB;
            const r = Math.round(lerp(sr, ir, p));
            const g = Math.round(lerp(sgc, ig, p));
            const bl = Math.round(lerp(sb, ib, p));
            const locked = p > 0.82;
            const tick = Math.floor((t + sp.seed * 53) / TICK_MS);
            const char = locked ? sp.targetChar! : scrambleChar(sp.seed, tick);
            ctx!.font = monoFont(fontSize);
            ctx!.fillStyle = `rgba(${r},${g},${bl},${(0.55 + p * 0.4).toFixed(3)})`;
            ctx!.fillText(char, x + cellW / 2, y + cellH / 2);
            continue;
          }
          // settled: resolved, mono, flat ink - except the payoff word,
          // which reads in the prism gradient as the emotional payoff.
          if (afterTransition || (inTransition && localT >= duration)) {
            ctx!.font = monoFont(fontSize);
            const useGradient = sp.targetSentIndex !== undefined && gradientFill && isInGradientRange(sp.targetSentIndex);
            ctx!.fillStyle = useGradient ? gradientFill! : `rgba(${INK_RGB[0]},${INK_RGB[1]},${INK_RGB[2]},0.95)`;
            ctx!.fillText(sp.targetChar!, sp.targetX! + cellW / 2, sp.targetY! + cellH / 2);
          }
        } else {
          const delay = sp.dissolveDelay ?? 0;
          const duration = sp.dissolveDuration ?? DISSOLVE_DURATION;
          const localT = t - transitionStart - delay;

          if (t < transitionStart || localT < 0) {
            drawStatic(sp);
            continue;
          }
          if (localT >= 0 && localT < duration) {
            const d = localT / duration;
            const [r, g, b] = SYNTAX_RGB[sp.type];
            const alpha = (1 - d) * 0.9;
            const tick = Math.floor((t + sp.seed * 53) / TICK_MS);
            const char = d < 0.7 ? scrambleChar(sp.seed, tick) : sp.ch;
            const jitterX = (hash(sp.seed, 3) - 0.5) * 12;
            const jitterY = d * (8 + hash(sp.seed, 4) * 14);
            ctx!.font = monoFont(fontSize);
            ctx!.fillStyle = `rgba(${r},${g},${b},${Math.max(0, alpha).toFixed(3)})`;
            ctx!.fillText(char, sp.sourceX + jitterX + cellW / 2, sp.sourceY + jitterY + cellH / 2);
          }
          // after dissolve completes: invisible until loop resets
        }
      }

      // cursor, blinks during the sentence hold
      const holdStart = transitionStart + transitionTotal;
      const holdEnd = holdStart + HOLD_SENTENCE;
      if (t >= holdStart && t < holdEnd) {
        const blinkOn = Math.floor((t - holdStart) / 500) % 2 === 0;
        if (blinkOn) {
          ctx!.font = monoFont(fontSize);
          ctx!.fillStyle = `rgba(${INK_RGB[0]},${INK_RGB[1]},${INK_RGB[2]},0.85)`;
          ctx!.fillText('_', cursorX, targetY + cellH / 2);
        }
      }

      ctx!.globalAlpha = 1;
    }

    function drawStaticReducedFrame() {
      ctx!.clearRect(0, 0, cssW, cssH);
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'middle';
      // dimmed code block, mono, secondary ink
      ctx!.font = monoFont(fontSize);
      const [r, g, b] = SYNTAX_RGB.ident;
      ctx!.fillStyle = `rgba(${r},${g},${b},0.6)`;
      codeLines.forEach((line, row) => {
        ctx!.fillText(line, PAD_X, PAD_Y + row * cellH + cellH / 2);
      });
      // resolved sentence, mono ink, same monospace grid as the code above -
      // drawn per character (not one fillText call) so the payoff word can
      // carry its own gradient fillStyle while the rest stays flat ink.
      ctx!.textAlign = 'center';
      ctx!.font = monoFont(fontSize * 1.05);
      const inkStyle = `rgba(${INK_RGB[0]},${INK_RGB[1]},${INK_RGB[2]},0.95)`;
      for (let i = 0; i < sentence.length; i++) {
        const ch = sentence[i];
        if (ch === ' ') continue;
        const x = targetStartX + i * cellW + cellW / 2;
        ctx!.fillStyle = gradientFill && isInGradientRange(i) ? gradientFill : inkStyle;
        ctx!.fillText(ch, x, targetY + cellH / 2);
      }
    }

    function frame(now: number) {
      if (!visible) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (startTime === null) startTime = now;
      const t = (now - startTime) % totalCycle;
      drawFrame(t);
      rafId = requestAnimationFrame(frame);
    }

    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildLayout();
        if (reduced) {
          drawStaticReducedFrame();
        } else {
          startTime = null;
        }
      }, 150);
    }

    function start() {
      buildLayout();
      if (reduced) {
        drawStaticReducedFrame();
      } else {
        rafId = requestAnimationFrame(frame);
      }
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
      ro?.observe(stageEl!);
      window.addEventListener('resize', onResize);

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0 },
      );
      io.observe(stageEl!);

      return () => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (resizeTimer) clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        ro?.disconnect();
        io.disconnect();
      };
    }

    let cleanup: (() => void) | undefined;
    // Set once the effect tears down, so a `fonts.ready`/fallback callback
    // that resolves after unmount never calls start() on a stale node -
    // and so the two races (font ready before/after the 800ms fallback)
    // can't both win and start() twice, leaking a second rAF loop and pair
    // of observers with no way to clean them up.
    let disposed = false;
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cleanup && !disposed) cleanup = start();
      });
    } else {
      cleanup = start();
    }
    const fallbackTimer = setTimeout(() => {
      if (!cleanup && !disposed) cleanup = start();
    }, 800);

    return () => {
      disposed = true;
      clearTimeout(fallbackTimer);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage]);

  return (
    <section
      className={cn('relative w-full', className)}
      aria-label={ASCII_DIALOGUE_ARIA_LABEL}
    >
      <span className="sr-only">
        {ASCII_DIALOGUE_ARIA_LABEL}. Resolved sentence: {passage.sentence}
      </span>
      <div
        ref={stageRef}
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface-base,#fff)"
      >
        <canvas ref={canvasRef} data-testid="ascii-dialogue-canvas" aria-hidden className="block w-full select-none" />
      </div>
      {showCaption ? (
        <p className="mx-auto mt-3 max-w-2xl text-center text-xs tracking-wide" style={{ color: prismSemantic.textTertiary }}>
          {ASCII_DIALOGUE_CAPTION}
        </p>
      ) : null}
    </section>
  );
}
