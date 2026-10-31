import React from 'react';
import { cn } from './utils/cn';

const CONTAINERS = {
  prose: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-7xl',
} as const;

const SURFACE_VAR: Record<string, string | undefined> = {
  base: 'var(--surface-base)',
  raised: 'var(--surface-raised)',
  overlay: 'var(--surface-overlay)',
};

/**
 * Section — standard container + vertical rhythm wrapper. Encodes the Prism
 * spacing system (container widths, py-24/32, px-6) so views stop hand-rolling
 * `mx-auto max-w-* px-6 py-*`.
 */
export interface SectionProps {
  children: React.ReactNode;
  id?: string;
  as?: React.ElementType;
  container?: keyof typeof CONTAINERS;
  rhythm?: 'default' | 'large' | 'compact' | 'none';
  /** Inline x-padding (px-6). Default true. */
  inset?: boolean;
  surface?: 'base' | 'raised' | 'overlay' | 'mesh';
  className?: string;
  /** Class for the inner centered container. */
  innerClassName?: string;
}

export function Section({
  children,
  id,
  as: Tag = 'section',
  container = 'wide',
  rhythm = 'default',
  inset = true,
  surface,
  className,
  innerClassName,
}: SectionProps) {
  const rhythmClass =
    rhythm === 'large' ? 'py-32' : rhythm === 'compact' ? 'py-12' : rhythm === 'none' ? '' : 'py-24';
  const isMesh = surface === 'mesh';
  return (
    <Tag
      id={id}
      className={cn('relative', isMesh && 'mesh-prism', inset && 'px-6', rhythmClass, className)}
      style={surface && !isMesh ? { background: SURFACE_VAR[surface] } : undefined}
    >
      <div className={cn(CONTAINERS[container], 'mx-auto', innerClassName)}>{children}</div>
    </Tag>
  );
}
