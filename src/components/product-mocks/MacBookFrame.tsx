'use client'

import React from 'react'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * MacBookFrame — 16:10 laptop chrome for live React product mockups.
 * Sized for case-study inline display; content scales inside a fixed aspect canvas.
 */
export interface MacBookFrameProps {
  children: React.ReactNode
  /** Faux URL shown in the address bar area (optional). */
  url?: string
  className?: string
  /** aria-label for the figure when used as a product screenshot. */
  label?: string
}

export function MacBookFrame({ children, url, className, label }: MacBookFrameProps) {
  return (
    <figure className={cn('relative', className)} aria-label={label}>
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10"
        style={{
          background:
            'radial-gradient(62% 58% at 50% 42%, rgba(124,58,237,0.12), transparent 74%)',
          filter: 'blur(10px)',
        }}
      />
      <div className="overflow-hidden rounded-[1.25rem] border border-line-subtle bg-[#1a1a1c] p-[10px] shadow-2xl ring-1 ring-black/10">
        {/* screen bezel */}
        <div className="overflow-hidden rounded-[0.65rem] border border-black/20 bg-surface-base">
          {/* menu bar */}
          <div className="flex items-center gap-2 border-b border-line-subtle bg-surface-frost px-3 py-2 backdrop-blur-md">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            {url ? (
              <span className="mx-auto max-w-[72%] truncate rounded-md border border-line-subtle bg-white/70 px-3 py-0.5 text-[10px] text-ink-tertiary">
                {url}
              </span>
            ) : null}
          </div>
          {/* 16:10 canvas — MacBook Pro logical ratio, scaled for web */}
          <div className="relative aspect-16/10 w-full overflow-hidden bg-surface-base">
            {children}
          </div>
        </div>
      </div>
      {/* base / hinge hint */}
      <div
        aria-hidden
        className="mx-auto mt-1 h-1.5 w-[38%] rounded-b-lg bg-linear-to-b/srgb from-neutral-700 to-neutral-800"
      />
    </figure>
  )
}
