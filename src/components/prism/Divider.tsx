import React from 'react';
import { cn } from './utils/cn';

/** Prismatic divider — a thin rainbow rule. `animated` makes it slide. */
export function Divider({
  animated = false,
  className,
}: {
  animated?: boolean;
  className?: string;
}) {
  return <div className={cn('prismatic-divider', animated && 'animated', className)} aria-hidden />;
}
