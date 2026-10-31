import React from 'react';
import { cn } from './utils/cn';

const TINT_FILL: Record<string, string> = {
  prism: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(45,212,191,0.05))',
  warm: 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(252,211,77,0.05))',
  regenerative: 'linear-gradient(135deg, rgba(74,222,128,0.10), rgba(59,130,246,0.05))',
};

/**
 * Card — `.card` (default) or `.card-feature`. Flat at rest; `glow` adds the
 * colored hover glow; `gradientBorder` adds the masked prism edge; `tint` keys a
 * feature fill to one named gradient. Strict DS: no hex outside the tint map.
 */
export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature';
  glow?: boolean;
  gradientBorder?: boolean;
  tint?: 'prism' | 'warm' | 'regenerative';
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function Card({
  children,
  variant = 'default',
  glow = false,
  gradientBorder = false,
  tint,
  as: Tag = 'div',
  className,
  style,
  id,
}: CardProps) {
  return (
    <Tag
      id={id}
      className={cn(
        variant === 'feature' ? 'card-feature' : 'card',
        glow && 'card-glow-hover',
        gradientBorder && 'card-gradient-border',
        className,
      )}
      style={tint ? { background: TINT_FILL[tint], ...style } : style}
    >
      {children}
    </Tag>
  );
}
