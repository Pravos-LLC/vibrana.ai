import React from 'react';
import Image from '@/src/components/PublicDemoImage';
import { cn } from './utils/cn';

/**
 * RoleImage — curriculum role illustration with the "shared field" treatment so
 * the colored-on-white renders stop reading as floating tiles:
 *   - a faint shared dot-grid (echoes the page Background field)
 *   - a soft category-accent glow + two-tone bokeh orbs (break the heavy white)
 *   - the image blended with `multiply` (white drops out → field shows through)
 *     and edge-feathered (the hard rectangle dissolves).
 * Bokeh positions are deterministic from `seed` (stable across SSR/CSR).
 */
export interface RoleImageProps {
  src: string;
  alt: string;
  /** [c1, c2] rgb triples, e.g. "124,58,237". From roleAccents(). */
  accents: [string, string];
  /** Stable seed for bokeh placement (e.g. the role's index). */
  seed: number;
  className?: string;
}

// mulberry32 — tiny deterministic PRNG so bokeh is stable (no hydration drift).
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

function bokeh(accents: [string, string], seed: number, count: number) {
  const r = prng(seed * 2654435761);
  const [c1, c2] = accents;
  return Array.from({ length: count }, (_, i) => {
    const size = 56 + Math.floor(r() * 130);
    const left = Math.floor(r() * 86);
    const top = Math.floor(r() * 78);
    const blur = 22 + Math.floor(r() * 28);
    const op = (0.16 + r() * 0.2).toFixed(2);
    // two-tone orb: both category colors in each bokeh gradient
    const bg = `radial-gradient(circle at 42% 40%, rgba(${c1},0.85), rgba(${c2},0.45) 52%, transparent 72%)`;
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
          background: bg,
        }}
      />
    );
  });
}

export function RoleImage({ src, alt, accents, seed, className }: RoleImageProps) {
  const [c1] = accents;
  return (
    <div className={cn('role-image relative aspect-4/3 overflow-hidden', className)}>
      {/* shared dot-grid (echoes the page field) */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(15,15,17,0.09) 1px, transparent 1.15px)',
          backgroundSize: '18px 18px',
        }}
      />
      {/* category-accent glow */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 58%, rgba(${c1},0.16), transparent 68%)` }}
      />
      {/* two-tone bokeh orbs */}
      {bokeh(accents, seed, 4)}
      {/* the illustration: white drops out (multiply) + edges feather.
          next/image `fill` serves right-sized AVIF/webp variants per `sizes`. */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 30vw, 22vw"
        className="object-cover"
        style={{
          mixBlendMode: 'multiply',
          WebkitMaskImage: 'radial-gradient(125% 125% at 50% 45%, #000 58%, transparent 100%)',
          maskImage: 'radial-gradient(125% 125% at 50% 45%, #000 58%, transparent 100%)',
        }}
      />
    </div>
  );
}
