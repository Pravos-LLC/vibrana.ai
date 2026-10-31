import React from 'react';
import { cn } from './utils/cn';

/**
 * MarkerCaption — a handwritten photo/film caption: a label line (a name, a
 * photo title) plus an optional smaller sub-line (a role, a date), set in the
 * Permanent Marker face (`--font-marker`, see app/layout.tsx). Generalizes the
 * caption strip PolaroidPhoto has always used, so any photo, screenshot, or
 * framed visual across the site can carry the same hand-touched caption
 * without re-deriving the typography by hand each time. PolaroidPhoto consumes
 * this internally (see PolaroidPhoto.tsx) with an exact-match pixel refactor,
 * not a visual change.
 *
 * RESTRAINT: one of a small marker-accent family (see MarkerNote,
 * MarkerUnderline, MarkerCircle, MarkerArrow). Max 1-2 marker moments per
 * viewport. Never in section headers or eyebrows. Annotation, not typography:
 * never body copy, never a headline substitute.
 */
export interface MarkerCaptionProps {
  /** Primary line: a name, a photo title, a short label. */
  label: string;
  /** Optional secondary line, smaller, set in a muted ink by default. */
  sublabel?: string;
  align?: 'left' | 'center' | 'right';
  /** Text size pairing. lg matches the original Polaroid caption. */
  size?: 'sm' | 'md' | 'lg';
  /** CSS color for the label line. Defaults to the Prism primary-ink token. */
  ink?: string;
  /** CSS color for the sublabel line. Defaults to the Prism tertiary-ink token. */
  subInk?: string;
  className?: string;
}

const SIZES: Record<NonNullable<MarkerCaptionProps['size']>, { label: string; sub: string }> = {
  sm: { label: 'text-sm', sub: 'text-xs' },
  md: { label: 'text-lg', sub: 'text-sm' },
  lg: { label: 'text-2xl', sub: 'text-base' },
};

const ALIGN: Record<NonNullable<MarkerCaptionProps['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function MarkerCaption({
  label,
  sublabel,
  align = 'center',
  size = 'md',
  ink,
  subInk,
  className,
}: MarkerCaptionProps) {
  const sizes = SIZES[size];

  return (
    <span
      aria-hidden
      className={cn('block select-none leading-tight', ALIGN[align], className)}
      style={{ fontFamily: 'var(--font-marker)' }}
    >
      <span className={cn('block', sizes.label)} style={{ color: ink ?? 'var(--text-primary)' }}>
        {label}
      </span>
      {sublabel && (
        <span className={cn('mt-1 block', sizes.sub)} style={{ color: subInk ?? 'var(--text-tertiary)' }}>
          {sublabel}
        </span>
      )}
    </span>
  );
}
