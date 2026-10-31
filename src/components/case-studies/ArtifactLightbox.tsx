'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/src/components/prism/utils/cn'
import { MacBookFrame, CASE_STUDY_MOCKS } from '@/src/components/product-mocks'
import type { CaseStudyScreenshot } from '@/src/case-study-screenshots-content'

export function ArtifactLightbox({
  open,
  onOpenChange,
  studySlug,
  shots,
  activeIndex,
  onActiveIndexChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  studySlug: string
  shots: CaseStudyScreenshot[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
}) {
  const shot = shots[activeIndex]
  const Mock = shot ? CASE_STUDY_MOCKS[studySlug]?.[shot.id] : null
  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < shots.length - 1

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) onActiveIndexChange(activeIndex - 1)
      if (e.key === 'ArrowRight' && hasNext) onActiveIndexChange(activeIndex + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, activeIndex, hasPrev, hasNext, onActiveIndexChange])

  if (!shot || !Mock) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[min(960px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col outline-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-4 px-1">
            <div className="min-w-0 pr-8">
              <DialogPrimitive.Title className="text-base font-semibold text-white sm:text-lg">
                {shot.title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-white/75">
                {shot.caption}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="absolute right-0 top-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <MacBookFrame url={shot.url} label={shot.title}>
              <div className="absolute inset-0 overflow-hidden">
                <Mock />
              </div>
            </MacBookFrame>
          </div>

          {shots.length > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 px-1">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => onActiveIndexChange(activeIndex - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs text-white/60">
                {activeIndex + 1} / {shots.length}
              </span>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => onActiveIndexChange(activeIndex + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
