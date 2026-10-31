'use client'

import React from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import { Badge } from '@/src/components/prism'
import type { LucideIcon } from 'lucide-react'

export interface ProductNavItem {
  icon: LucideIcon
  label: string
  active?: boolean
}

export interface ProductAppShellProps {
  productName: string
  clientBadge?: string
  nav: ProductNavItem[]
  topRight?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ProductAppShell({
  productName,
  clientBadge,
  nav,
  topRight,
  children,
  className,
}: ProductAppShellProps) {
  return (
    <div className={cn('flex h-full w-full min-h-0 bg-surface-base text-ink', className)}>
      {/* sidebar */}
      <aside className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r border-line-subtle bg-surface-raised py-3">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-(image:--gradient-prism) text-[10px] font-bold text-white">
          V
        </div>
        {nav.map((item) => (
          <span
            key={item.label}
            title={item.label}
            aria-hidden
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              item.active
                ? 'text-brand-violet-strong'
                : 'text-ink-tertiary',
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-line-subtle px-4 py-2 backdrop-blur-xs">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-xs font-semibold text-ink">{productName}</span>
            {clientBadge ? (
              <Badge tint="neutral" size="sm" className="shrink-0">
                {clientBadge}
              </Badge>
            ) : null}
          </div>
          {topRight}
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

/** Avatar circle with initials — no external images. */
export function ProductAvatar({
  initials,
  tint = 'violet',
  size = 'md',
}: {
  initials: string
  tint?: 'violet' | 'cyan' | 'blue' | 'emerald' | 'amber'
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  const fills: Record<string, string> = {
    violet: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(59,130,246,0.75))',
    cyan: 'linear-gradient(135deg, rgba(45,212,191,0.85), rgba(59,130,246,0.75))',
    blue: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(124,58,237,0.75))',
    emerald: 'linear-gradient(135deg, rgba(74,222,128,0.85), rgba(45,212,191,0.75))',
    amber: 'linear-gradient(135deg, rgba(245,158,11,0.85), rgba(252,211,77,0.75))',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
      )}
      style={{ background: fills[tint] }}
    >
      {initials}
    </span>
  )
}
