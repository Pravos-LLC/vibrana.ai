import React from 'react';
import { cn } from './utils/cn';
import { Stat } from './Stat';
import { Eyebrow } from './Eyebrow';

/**
 * MetricProof — a metric-led customer-proof block. Wave-3 coverage component
 * (JE pick round, 2026-07-20): Stripe's "metric-led customer proof (stat
 * before story)" fused with Notion's "single true sentence as social proof."
 * Leads with the numbers, then the one honest line and its attribution — the
 * opposite of a logo wall.
 *
 * Composes the existing `Stat` (gradient value + label) so the numbers read in
 * the same voice as the rest of the system. `statement` is the single proof
 * sentence (Notion's "one true line"); `attribution` names the source without
 * a photo. COPY IS DATA: every string is a prop — when surfaced on a real page
 * the copy comes from a `src/*-content.ts` module and rides through
 * vibrana-copywriting → persona-review.
 */

export interface MetricProofProps {
  eyebrow?: string;
  /** The single proof sentence. Pass JSX to emphasize a phrase. */
  statement?: React.ReactNode;
  /** 1–4 metrics; the first is the lead. Rendered as gradient Stats. */
  metrics: { value: React.ReactNode; label: React.ReactNode }[];
  attribution?: { name: string; role?: string };
  align?: 'left' | 'center';
  className?: string;
}

export function MetricProof({
  eyebrow,
  statement,
  metrics,
  attribution,
  align = 'left',
  className,
}: MetricProofProps) {
  const centered = align === 'center';
  return (
    <div className={cn(centered && 'text-center', className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}

      {statement && (
        <p
          className={cn(
            'type-2xl md:type-3xl font-display leading-tight tracking-tight text-ink',
            centered ? 'mx-auto max-w-3xl' : 'max-w-3xl',
          )}
        >
          {statement}
        </p>
      )}

      <div
        className={cn(
          'mt-10 flex flex-wrap gap-x-12 gap-y-8',
          centered && 'justify-center',
        )}
      >
        {metrics.map((m, i) => (
          <Stat
            key={i}
            value={m.value}
            label={m.label}
            gradientValue
            align={align}
            className="min-w-32"
          />
        ))}
      </div>

      {attribution && (
        <p className={cn('type-sm text-secondary-token mt-8', centered && 'mx-auto')}>
          <span className="font-medium text-ink">{attribution.name}</span>
          {attribution.role ? ` · ${attribution.role}` : ''}
        </p>
      )}
    </div>
  );
}
