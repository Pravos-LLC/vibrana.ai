import { PublicDemoImg } from '@/src/components/PublicDemoImage'
import React from 'react';
import { cn } from './utils/cn';

/**
 * PunkThumbnail — a vintage-punk blog / newsletter thumbnail. Wave-3 coverage
 * component (JE pick round, 2026-07-20): Koto's blog thumbnails — "vintage
 * artsy punk vibe that fits the stickers" — recolored off yellow into the
 * Vibrana accent tones. A single-hue saturated ground with near-black type, a
 * halftone dot screen and a faint xerox-noise pass for the risograph/photocopy
 * feel, an oversized bold display title, and a monospace edge label. Optional
 * duotone-treated image behind the ground.
 *
 * Single-hue per card (no warm+cool mixing). COPY IS DATA: every string is a
 * prop. Dependency-free — halftone + noise are CSS/SVG, no runtime.
 */

export type PunkTone = 'violet' | 'cyan' | 'amber';

export interface PunkThumbnailProps {
  title: string;
  /** Small kicker over the title, e.g. "NEWSLETTER". */
  kicker?: string;
  /** Issue/index marker for the mono edge label, e.g. "NO. 13". */
  index?: string;
  /** Footer category tag, e.g. "NEWSLETTERS". */
  category?: string;
  /** Footer date, e.g. "Mon 15 Jun". */
  date?: string;
  tone?: PunkTone;
  href?: string;
  /** Optional image; rendered grayscale + tinted (duotone) behind the ground. */
  image?: string;
  className?: string;
}

const TONES: Record<PunkTone, { ground: string; ink: string }> = {
  violet: { ground: 'var(--violet-tint, #8b5cf6)', ink: '#160b2e' },
  cyan: { ground: 'var(--cyan, #2dd4bf)', ink: '#062b26' },
  amber: { ground: 'var(--amber, #f59e0b)', ink: '#2a1a02' },
};

// Faint fractal-noise tile for the photocopy grain, reused from the Background
// noise technique.
const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function PunkThumbnail({
  title,
  kicker,
  index,
  category,
  date,
  tone = 'violet',
  href,
  image,
  className,
}: PunkThumbnailProps) {
  const t = TONES[tone];
  const Wrapper: React.ElementType = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      className={cn(
        'group block overflow-hidden rounded-xl transition-transform duration-200 hover:-translate-y-0.5',
        className,
      )}
      style={{ color: t.ink }}
    >
      {/* Art panel */}
      <div className="relative aspect-16/10 overflow-hidden" style={{ background: t.ground }}>
        {/* duotone image */}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <PublicDemoImg
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: 'grayscale(1) contrast(1.15)', mixBlendMode: 'multiply', opacity: 0.85 }}
          />
        )}

        {/* halftone dot screen */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${t.ink} 1px, transparent 1.4px)`,
            backgroundSize: '6px 6px',
            opacity: 0.16,
          }}
        />
        {/* xerox noise */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-multiply"
          style={{ backgroundImage: NOISE_URL, backgroundSize: '180px 180px', opacity: 0.14 }}
        />

        {/* mono edge label (vertical, down the left edge) */}
        {(kicker || index) && (
          <span
            aria-hidden
            className="absolute left-3 top-5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ writingMode: 'vertical-rl' }}
          >
            {[kicker, index].filter(Boolean).join(' · ')}
          </span>
        )}

        {/* title */}
        <div className="absolute inset-0 flex items-center px-8 py-7">
          <h3 className="font-display text-2xl font-bold leading-[1.02] tracking-tight md:text-3xl">{title}</h3>
        </div>
      </div>

      {/* footer meta (on the light board, not the panel) */}
      {(category || date) && (
        <div className="mt-3 flex items-center gap-3">
          {category && (
            <span
              className="rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}
            >
              {category}
            </span>
          )}
          {date && <span className="type-xs text-tertiary-token">{date}</span>}
        </div>
      )}
    </Wrapper>
  );
}
