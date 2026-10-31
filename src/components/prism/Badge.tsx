import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from './utils/cn';

type Tint = 'violet' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'red' | 'neutral';

const TINT: Record<Tint, { bg: string; fg: string; border: string }> = {
  violet: { bg: 'rgba(124,58,237,0.10)', fg: 'var(--violet-strong)', border: 'rgba(124,58,237,0.22)' },
  blue: { bg: 'rgba(59,130,246,0.10)', fg: 'var(--blue-strong)', border: 'rgba(59,130,246,0.22)' },
  cyan: { bg: 'rgba(45,212,191,0.12)', fg: 'var(--cyan-strong)', border: 'rgba(45,212,191,0.28)' },
  emerald: { bg: 'rgba(74,222,128,0.12)', fg: 'var(--emerald-strong)', border: 'rgba(74,222,128,0.28)' },
  amber: { bg: 'rgba(245,158,11,0.12)', fg: 'var(--amber-strong)', border: 'rgba(245,158,11,0.28)' },
  red: { bg: 'rgba(239,68,68,0.10)', fg: 'var(--red-strong)', border: 'rgba(239,68,68,0.22)' },
  neutral: { bg: 'var(--surface-card)', fg: 'var(--text-secondary)', border: 'var(--border-default)' },
};

const SIZE = {
  sm: 'type-xs px-2 py-1',
  md: 'type-xs px-3 py-1.5',
  lg: 'type-sm px-4 py-2',
} as const;

/**
 * Badge / Tag — pill, tinted from the accent spectrum. `gradient` renders a
 * solid prism-gradient fill (for the old "primary" badge). No mono-uppercase by
 * default — pass `uppercase` for label-style chips.
 */
export interface BadgeProps {
  children: React.ReactNode;
  tint?: Tint;
  gradient?: boolean;
  size?: keyof typeof SIZE;
  uppercase?: boolean;
  icon?: LucideIcon;
  as?: React.ElementType;
  className?: string;
}

export function Badge({
  children,
  tint = 'violet',
  gradient = false,
  size = 'md',
  uppercase = false,
  icon: Icon,
  as: Tag = 'span',
  className,
}: BadgeProps) {
  const t = TINT[tint];
  const iconSize = size === 'lg' ? 16 : 13;
  return (
    <Tag
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-body font-medium',
        SIZE[size],
        uppercase && 'uppercase',
        className,
      )}
      style={
        gradient
          ? { background: 'var(--gradient-prism)', color: '#fff', letterSpacing: uppercase ? '0.08em' : undefined }
          : {
              background: t.bg,
              color: t.fg,
              border: `1px solid ${t.border}`,
              letterSpacing: uppercase ? '0.08em' : undefined,
            }
      }
    >
      {Icon && <Icon size={iconSize} aria-hidden />}
      {children}
    </Tag>
  );
}
