'use client';

import React, { useRef } from 'react';
import Image from '@/src/components/PublicDemoImage';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useReducedMotionValue } from './motion/useReducedMotionValue';
import { cn } from './utils/cn';

export interface FloatingCardsTile {
  src: string;
  shape?: 'rect' | 'circle';
  /** Tailwind width class, e.g. "w-40". */
  width?: string;
  top: string;
  left?: string;
  right?: string;
  /** Tailwind aspect class for rect tiles (default aspect-4/3) — mix portrait, wide and square. */
  aspect?: string;
  rotate?: number;
  /** How far (px) the tile rises across the hero's exit. Larger reads as nearer. */
  depth?: number;
  index: number;
}

export interface FloatingCardsProps {
  tiles: FloatingCardsTile[];
  className?: string;
}

/**
 * FloatingCards — a wide-desktop-only (xl+) layer of tilted photo tiles of mixed size and orientation behind
 * hero copy. Round 2 (JE review, 2026-10-03): no idle drift. The tiles move
 * only with scroll, each at its own depth, so the layer reads as parallax
 * rather than motion for its own sake. Purely decorative (`aria-hidden`);
 * static under prefers-reduced-motion.
 */
export function FloatingCards({ tiles, className }: FloatingCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  return (
    <div ref={ref} className={cn('pointer-events-none absolute inset-0 hidden xl:block', className)} aria-hidden>
      {tiles.map((tile) => (
        <Tile key={tile.src} tile={tile} progress={scrollYProgress} />
      ))}
    </div>
  );
}

function Tile({ tile, progress }: { tile: FloatingCardsTile; progress: MotionValue<number> }) {
  const rm = useReducedMotionValue();
  const depth = tile.depth ?? 100;
  const rotate = tile.rotate ?? 0;
  const y = useTransform([progress, rm], ([v, r]: number[]) => (r ? 0 : -depth * v));
  const rot = useTransform([progress, rm], ([v, r]: number[]) => (r ? rotate : rotate + Math.sign(rotate || 1) * 2 * v));
  const opacity = useTransform([progress, rm], ([v, r]: number[]) => (r ? 1 : v < 0.7 ? 1 : Math.max(0, 1 - (v - 0.7) / 0.3)));
  const isCircle = tile.shape === 'circle';
  const reduceMotion = useReducedMotion();
  // Entrance: each tile drifts in diagonally from its own edge of the screen
  // (left tiles from the upper left, right tiles from the upper right), staggered.
  const fromRight = tile.right !== undefined;
  const enter = reduceMotion
    ? { initial: false as const }
    : {
        initial: { opacity: 0, x: fromRight ? 260 : -260, y: -170, scale: 0.94 },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: { duration: 1.5, delay: 0.5 + tile.index * 0.16, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <motion.div
      className={cn('absolute', tile.width ?? 'w-40')}
      style={{ top: tile.top, left: tile.left, right: tile.right, y, rotate: rot, opacity }}
    >
      <motion.div
        {...enter}
        className={cn(
          'relative overflow-hidden border border-line-subtle shadow-xl',
          isCircle ? 'aspect-square rounded-full' : cn(tile.aspect ?? 'aspect-4/3', 'rounded-2xl'),
        )}
      >
        <Image src={tile.src} alt="" fill priority sizes="(min-width: 1536px) 18vw, 14vw" className="object-cover" />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.14), rgba(45,212,191,0.08))',
            mixBlendMode: 'overlay',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
