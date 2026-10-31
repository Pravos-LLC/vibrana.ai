import React from 'react';
import { cn } from './utils/cn';
import { GradientText } from './GradientText';

/** Stat — a large value over a tertiary label. */
export interface StatProps {
  value: React.ReactNode;
  label: React.ReactNode;
  gradientValue?: boolean;
  size?: '2xl' | '3xl';
  align?: 'left' | 'center';
  className?: string;
}

export function Stat({ value, label, gradientValue = false, size = '3xl', align = 'left', className }: StatProps) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      <div className={cn(`type-${size}`, 'font-display leading-tight')}>
        {gradientValue ? <GradientText>{value}</GradientText> : value}
      </div>
      <div className="type-sm text-tertiary-token mt-2">{label}</div>
    </div>
  );
}
