'use client';

import React from 'react';
import Image from '@/src/components/PublicDemoImage';
import { cn } from './utils/cn';

/**
 * FilmRoll — the Life on Film track's flagship component (round 2). A
 * horizontal, continuously-scrolling strip of real photos styled as an
 * actual 35mm film roll: dark film-base chrome, sprocket-hole rails top and
 * bottom, thin frame separators, a warm sepia film grade on every image, and
 * small mono edge markings (frame numbers / stock name) — the physical
 * object language `PolaroidPhoto` already ships, extended to a long roll
 * instead of a single print.
 *
 * Supersedes `FilmFrame` and `FilmStrip` (both rejected in JE round-2
 * review — see `research/homepage-visual-exploration/13-life-on-film-
 * language.md` §7). No name labels or "keeper" marks are rendered over the
 * frames; the roll reads as a roll, not a marked-up sheet. `alt` text still
 * carries the real name for accessibility, it's just never shown visually.
 *
 * Motion: the roll auto-scrolls in a seamless loop (the frame list is
 * duplicated once and the track animates exactly -50%, so the loop point is
 * invisible). Hover/focus pauses it so a viewer can look at a frame.
 * `prefers-reduced-motion` swaps to a static, natively horizontal-scrollable
 * strip (single, non-duplicated frame set, no animation) per the standing
 * motion rule.
 */
export interface FilmRollFrame {
  src: string;
  alt: string;
  /** CSS aspect-ratio, e.g. "3 / 2" for a disposable-camera still. Default "1 / 1". */
  aspect?: string;
  /** CSS object-position, chosen per image so faces stay whole (no forehead-chopping). */
  objectPosition?: string;
}

export interface FilmRollProps {
  frames: FilmRollFrame[];
  /** Stamped into the edge markings alongside frame numbers, e.g. "VIBRANA 200". */
  stockLabel?: string;
  /** Starting edge-print frame number (real negatives count up along the roll). */
  startFrameNumber?: number;
  /** Seconds for one full loop of the track. Default scales with frame count (~5s/frame, min 24s). */
  durationSeconds?: number;
  className?: string;
}

function FilmRollCell({
  frame,
  frameNumber,
  stockLabel,
  showStock,
  decorative = false,
}: {
  frame: FilmRollFrame;
  frameNumber: number;
  stockLabel: string;
  showStock: boolean;
  decorative?: boolean;
}) {
  return (
    <div
      aria-hidden={decorative || undefined}
      className="film-roll-cell relative shrink-0 overflow-hidden"
      style={{ aspectRatio: frame.aspect ?? '1 / 1' }}
    >
      <Image
        src={frame.src}
        alt={decorative ? '' : frame.alt}
        fill
        loading="lazy"
        sizes="(max-width: 640px) 55vw, 320px"
        className="film-roll-grade object-cover"
        style={{ objectPosition: frame.objectPosition ?? 'center' }}
      />
      <span
        aria-hidden
        className="absolute bottom-1.5 left-1.5 select-none rounded-[1px] bg-black/40 px-1 py-0.5 text-[9px] leading-none tracking-[0.06em] text-[#e8d4b8]/80"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {showStock ? stockLabel : `${frameNumber}A`}
      </span>
    </div>
  );
}

export function FilmRoll({
  frames,
  stockLabel = 'VIBRANA 200',
  startFrameNumber = 12,
  durationSeconds,
  className,
}: FilmRollProps) {
  if (frames.length === 0) return null;

  const duration = durationSeconds ?? Math.max(24, frames.length * 5);

  return (
    <div
      className={cn('film-roll-shell relative overflow-hidden rounded-[3px] border', className)}
      style={{ background: '#141009', borderColor: '#050403' }}
    >
      <div aria-hidden className="film-roll-rail" />

      {/* Motion-safe default: auto-scrolling, seamless-loop track. Hidden under reduced motion.
          Real frames render once (accessible to AT); a second, aria-hidden copy trails it so the
          loop point (-50% translate) is invisible. */}
      <div className="overflow-hidden py-3 motion-reduce:hidden">
        <div
          className="film-roll-track flex h-40 w-max gap-0 sm:h-48 md:h-56"
          style={{ '--film-roll-duration': `${duration}s` } as React.CSSProperties}
        >
          {frames.map((frame, i) => (
            <FilmRollCell
              key={`real-${frame.src}-${i}`}
              frame={frame}
              frameNumber={startFrameNumber + i}
              stockLabel={stockLabel}
              showStock={i % 4 === 0}
            />
          ))}
          {frames.map((frame, i) => (
            <FilmRollCell
              key={`dup-${frame.src}-${i}`}
              frame={frame}
              frameNumber={startFrameNumber + i}
              stockLabel={stockLabel}
              showStock={i % 4 === 0}
              decorative
            />
          ))}
        </div>
      </div>

      {/* Reduced motion: static, single set, natively scrollable by the user. */}
      <div className="hidden overflow-x-auto py-3 motion-reduce:block">
        <div className="flex h-40 w-max gap-0 sm:h-48 md:h-56">
          {frames.map((frame, i) => (
            <FilmRollCell
              key={`static-${frame.src}-${i}`}
              frame={frame}
              frameNumber={startFrameNumber + i}
              stockLabel={stockLabel}
              showStock={i % 4 === 0}
            />
          ))}
        </div>
      </div>

      <div aria-hidden className="film-roll-rail" />
    </div>
  );
}
