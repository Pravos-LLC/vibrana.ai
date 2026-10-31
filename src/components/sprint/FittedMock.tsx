'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { MacBookFrame } from '@/src/components/product-mocks'
import { cn } from '@/src/components/prism/utils/cn'

/** The product mocks are drawn on a 960x600 canvas (same as the case-study thumbnails). */
const CANVAS_W = 960
const CANVAS_H = 600

/**
 * FittedMock — a live product mock inside MacBookFrame, scaled to fit whatever
 * width the card gives it. Decorative on this page: the card copy carries the
 * meaning, so the mock is hidden from assistive tech and not interactive.
 */
export function FittedMock({ children, url, className }: { children: ReactNode; url?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const width = el.getBoundingClientRect().width
      if (width > 0) setScale(width / CANVAS_W)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <MacBookFrame url={url} className={cn('w-full', className)}>
      <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden" inert>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}
        >
          {children}
        </div>
      </div>
    </MacBookFrame>
  )
}
