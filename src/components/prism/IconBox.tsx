import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from './utils/cn';

const TINT: Record<string, { bg: string; fg: string }> = {
  violet: { bg: 'rgba(124,58,237,0.10)', fg: 'var(--violet)' },
  blue: { bg: 'rgba(59,130,246,0.10)', fg: 'var(--blue)' },
  cyan: { bg: 'rgba(45,212,191,0.12)', fg: 'var(--cyan-strong)' },
  emerald: { bg: 'rgba(74,222,128,0.12)', fg: 'var(--emerald-strong)' },
};

/**
 * IconBox — 3rem tinted square housing a Lucide icon. Tint pulls from the
 * accent spectrum only.
 */
export interface IconBoxProps {
  icon?: LucideIcon;
  children?: React.ReactNode;
  tint?: 'violet' | 'blue' | 'cyan' | 'emerald';
  size?: number;
  className?: string;
}

export function IconBox({ icon: Icon, children, tint = 'violet', size = 22, className }: IconBoxProps) {
  const t = TINT[tint];
  return (
    <span className={cn('icon-box', className)} style={{ background: t.bg, color: t.fg }}>
      {Icon ? <Icon size={size} aria-hidden /> : children}
    </span>
  );
}
