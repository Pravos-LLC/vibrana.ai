import React from 'react';
import { cn } from './utils/cn';

/**
 * Eyebrow / section label. Strict Prism: body font, uppercase small-caps,
 * 0.12em tracking, tertiary text (or a named gradient). Replaces the legacy
 * `font-mono uppercase tracking-[0.3em]` mono-label pattern.
 */
export interface EyebrowProps {
  children: React.ReactNode;
  as?: React.ElementType;
  /** Size token; defaults to xs. */
  size?: 'xs' | 'sm';
  /** Render as gradient text instead of tertiary. */
  gradient?: 'prism' | 'warm' | 'regenerative';
  className?: string;
}

export function Eyebrow({ children, as: Tag = 'p', size = 'xs', gradient, className }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        size === 'xs' ? 'type-xs' : 'type-sm',
        'font-body uppercase',
        gradient ? `text-gradient-${gradient}` : 'text-tertiary-token',
        className,
      )}
      style={{ letterSpacing: '0.12em' }}
    >
      {children}
    </Tag>
  );
}
