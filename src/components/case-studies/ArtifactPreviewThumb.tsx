'use client'

import React from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import type { CaseStudyScreenshotFrame } from '@/src/case-study-screenshots-content'
import { Maximize2 } from 'lucide-react'

const FRAME_CANVAS: Record<CaseStudyScreenshotFrame, { w: number; h: number; aspect: string }> = {
  laptop: { w: 960, h: 600, aspect: 'aspect-16/10' },
  tablet: { w: 768, h: 576, aspect: 'aspect-4/3' },
  phone: { w: 390, h: 780, aspect: 'aspect-9/16' },
}

function useFitScale(ref: React.RefObject<HTMLElement | null>, canvasW: number) {
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const width = el.getBoundingClientRect().width
      if (width > 0) setScale(width / canvasW)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [canvasW])

  return scale
}

/**
 * ArtifactPreviewThumb — product mock scaled to fit its frame exactly.
 */
export function ArtifactPreviewThumb({
  children,
  frame = 'laptop',
  interactive = false,
  className,
}: {
  children: React.ReactNode
  frame?: CaseStudyScreenshotFrame
  interactive?: boolean
  className?: string
}) {
  const canvas = FRAME_CANVAS[frame]
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const scale = useFitScale(viewportRef, canvas.w)
  const isPhone = frame === 'phone'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-line-subtle bg-surface-base shadow-xs transition-shadow duration-300',
        interactive &&
          'group-hover:shadow-lg group-focus-visible:ring-2',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-frost px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
      </div>

      <div
        ref={viewportRef}
        className={cn(
          'relative w-full overflow-hidden bg-surface-raised',
          canvas.aspect,
          isPhone && 'mx-auto max-w-44',
        )}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 select-none"
          style={{
            width: canvas.w,
            height: canvas.h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>

        {interactive ? (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-linear-to-t/srgb from-black/15 via-transparent to-transparent pb-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow-md">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Expand
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
