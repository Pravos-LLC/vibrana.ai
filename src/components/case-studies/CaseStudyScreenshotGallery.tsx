'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Eyebrow } from '@/src/components/prism'
import {
  CASE_STUDY_SCREENSHOTS,
  CASE_STUDY_SCREENSHOTS_SECTION,
  CASE_STUDY_ARTICLE_CLASS,
  type CaseStudyScreenshot,
} from '@/src/case-study-screenshots-content'
import { CASE_STUDY_MOCKS } from '@/src/components/product-mocks'
import { ArtifactPreviewThumb } from './ArtifactPreviewThumb'
import { ArtifactLightbox } from './ArtifactLightbox'
import { cn } from '@/src/components/prism/utils/cn'

/** Fixed slide width — avoids width transitions that cause jank + bad scroll math. */
const SLIDE_CLASS = 'w-[min(82vw,20rem)] md:w-[24rem]'

function RibbonSlide({
  studySlug,
  shot,
  index,
  isCenter,
  onSelect,
}: {
  studySlug: string
  shot: CaseStudyScreenshot
  index: number
  isCenter: boolean
  onSelect: () => void
}) {
  const Mock = CASE_STUDY_MOCKS[studySlug]?.[shot.id]
  if (!Mock) return null

  return (
    <li
      data-slide-index={index}
      // transform, not the scale-* utility: Tailwind v4 maps scale-* to the standalone `scale`
      // property, which Chromium weighs differently when re-snapping this carousel.
      className={cn(
        SLIDE_CLASS,
        'snap-center shrink-0 will-change-[transform,opacity]',
        'transition-[transform,opacity] duration-200 ease-out',
        isCenter ? 'z-10 [transform:scale(1.05)] opacity-100' : '[transform:scale(0.9)] opacity-40',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="group w-full text-left focus-visible:outline-hidden"
      >
        <ArtifactPreviewThumb frame={shot.frame ?? 'laptop'} interactive>
          <Mock />
        </ArtifactPreviewThumb>
        <p
          className={cn(
            'mt-3 text-sm font-semibold',
            isCenter ? 'text-ink' : 'text-ink-secondary',
          )}
        >
          {shot.tag}
        </p>
      </button>
    </li>
  )
}

/**
 * Full-bleed center-focused ribbon — fits full UI in frame, side slides fade out.
 */
export function CaseStudyArtifactOverview({ studySlug }: { studySlug: string }) {
  const shots = CASE_STUDY_SCREENSHOTS[studySlug]
  const scrollRef = React.useRef<HTMLUListElement>(null)
  const rafRef = React.useRef<number | null>(null)
  const [open, setOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)
  const [centerIndex, setCenterIndex] = React.useState(1)

  const measureCenter = React.useCallback(() => {
    const track = scrollRef.current
    if (!track) return

    const trackRect = track.getBoundingClientRect()
    const trackCenter = trackRect.left + trackRect.width / 2
    let closest = 0
    let closestDist = Infinity

    track.querySelectorAll<HTMLElement>('[data-slide-index]').forEach((el) => {
      const rect = el.getBoundingClientRect()
      const slideCenter = rect.left + rect.width / 2
      const dist = Math.abs(slideCenter - trackCenter)
      const idx = Number(el.dataset.slideIndex)
      if (dist < closestDist) {
        closestDist = dist
        closest = idx
      }
    })

    setCenterIndex((prev) => (prev === closest ? prev : closest))
  }, [])

  const scheduleMeasure = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      measureCenter()
    })
  }, [measureCenter])

  const scrollToSlide = React.useCallback(
    (index: number) => {
      const track = scrollRef.current
      const target = track?.querySelector<HTMLElement>(`[data-slide-index="${index}"]`)
      if (!track || !target) return

      setCenterIndex(index)
      const left = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2
      track.scrollTo({ left, behavior: 'smooth' })
    },
    [],
  )

  React.useEffect(() => {
    const track = scrollRef.current
    if (!track || !shots?.length) return

    const middle = Math.min(1, shots.length - 1)
    requestAnimationFrame(() => {
      const target = track.querySelector<HTMLElement>(`[data-slide-index="${middle}"]`)
      if (target) {
        const left = target.offsetLeft - (track.clientWidth - target.offsetWidth) / 2
        track.scrollTo({ left, behavior: 'auto' })
        setCenterIndex(middle)
      }
    })

    track.addEventListener('scroll', scheduleMeasure, { passive: true })
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      track.removeEventListener('scroll', scheduleMeasure)
      window.removeEventListener('resize', scheduleMeasure)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [shots?.length, scheduleMeasure])

  if (!shots?.length) return null

  const openAt = (index: number) => {
    setLightboxIndex(index)
    setOpen(true)
  }

  const scrollBy = (dir: -1 | 1) => {
    scrollToSlide(Math.min(shots.length - 1, Math.max(0, centerIndex + dir)))
  }

  return (
    <>
      <section className="pb-14 pt-4">
        <div className={cn('px-6', CASE_STUDY_ARTICLE_CLASS)}>
          <Eyebrow>{CASE_STUDY_SCREENSHOTS_SECTION.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-ink md:text-xl">
            {CASE_STUDY_SCREENSHOTS_SECTION.heading}
          </h2>
        </div>

        <div className="relative mt-6 w-full">
          <div className="relative border-y border-line-subtle py-10 md:py-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  'linear-gradient(90deg, color-mix(in srgb, var(--surface-base), transparent 12%) 0%, transparent 22%, transparent 78%, color-mix(in srgb, var(--surface-base), transparent 12%) 100%)',
              }}
            />

            <ul
              ref={scrollRef}
              className={cn(
                'relative flex items-center gap-5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory',
                /* symmetric inset padding so first AND last slide can reach centre */
                'pl-[calc(50%-min(41vw,10rem))] pr-[calc(50%-min(41vw,10rem))]',
                'md:pl-[calc(50%-12rem)] md:pr-[calc(50%-12rem)]',
                'scrollbar-none [&::-webkit-scrollbar]:hidden',
              )}
              aria-label="Product previews"
            >
              {shots.map((shot, i) => (
                <RibbonSlide
                  key={shot.id}
                  studySlug={studySlug}
                  shot={shot}
                  index={i}
                  isCenter={i === centerIndex}
                  onSelect={() => openAt(i)}
                />
              ))}
            </ul>

            <div
              className={cn(
                'relative z-20 mt-6 flex items-center justify-center gap-3 px-6',
                CASE_STUDY_ARTICLE_CLASS,
              )}
            >
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={centerIndex <= 0}
                aria-label="Previous preview"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-subtle bg-surface-card text-ink transition-colors hover:bg-surface-overlay disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {shots.map((shot, i) => (
                  <button
                    key={shot.id}
                    type="button"
                    aria-label={`Show ${shot.tag}`}
                    aria-current={i === centerIndex ? 'true' : undefined}
                    onClick={() => scrollToSlide(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-[width,background-color] duration-200',
                      i === centerIndex ? 'w-6 bg-brand-violet' : 'w-1.5 bg-line-subtle hover:bg-line',
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={centerIndex >= shots.length - 1}
                aria-label="Next preview"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-subtle bg-surface-card text-ink transition-colors hover:bg-surface-overlay disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p
          className={cn(
            'mt-4 px-6 text-[11px] leading-relaxed text-ink-tertiary',
            CASE_STUDY_ARTICLE_CLASS,
          )}
        >
          {CASE_STUDY_SCREENSHOTS_SECTION.footnote}
        </p>
      </section>

      <ArtifactLightbox
        open={open}
        onOpenChange={setOpen}
        studySlug={studySlug}
        shots={shots}
        activeIndex={lightboxIndex}
        onActiveIndexChange={setLightboxIndex}
      />
    </>
  )
}

/** @deprecated Use CaseStudyArtifactOverview on case-study pages. */
export const CaseStudyScreenshotGallery = CaseStudyArtifactOverview
