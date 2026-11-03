'use client'

import React, { useEffect, useId, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT, PRISM_STROKE } from './tokens'

export interface Chapter {
  /** The id of the section element this chapter links to. */
  id: string
  title: string
  /** Shown in mono before the title. Defaults to the position: `1`, `2`. Use `2.1` style for subchapters. */
  number?: string
}

export interface ChapterRailProps {
  chapters: readonly Chapter[]
  /** Accessible name for the nav. */
  label?: string
  /** Sticky offset from the top, to clear the site nav. Default 96px. */
  top?: number
  /** Visible-on-focus skip link that jumps past the chapter list. Default `Skip chapter navigation`. */
  skipLabel?: string
  /** Mobile bar progress text. Default `Chapter 2 of 5`. */
  formatProgress?: (n: number, total: number, chapter: Chapter) => string
  className?: string
}

/**
 * ChapterRail: the Field Report table of contents that stays with the reader. A sticky list of
 * chapters (mono numbers, Linear Method style); the chapter in view gets ink and a short gradient
 * rule that slides to it. Links jump to the section; `aria-current` marks the active one.
 *
 * Tracking: one IntersectionObserver on the chapter sections, with a band from 30% to 40% down
 * the viewport, so the active chapter is the one being read, not the one just peeking in.
 *
 * Below md the rail collapses to a sticky bar: the current chapter and a progress hairline.
 * Place it in a grid column beside the sections (`lg:grid-cols-[200px_1fr]`).
 */
const defaultProgress = (n: number, total: number) => `Chapter ${n} of ${total}`

export function ChapterRail({ chapters, label = 'Chapters', top = 96, skipLabel = 'Skip chapter navigation', formatProgress = defaultProgress, className }: ChapterRailProps) {
  const [active, setActive] = useState(0)
  const reduce = useHydratedReducedMotion()
  const uid = useId()

  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e)
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = chapters.findIndex((c) => c.id === e.target.id)
            if (i >= 0) setActive(i)
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [chapters])

  const num = (c: Chapter, i: number) => c.number ?? String(i + 1)
  const current = chapters[active]

  const skipId = `${uid}-after`.replace(/:/g, '')

  return (
    <>
      {/* Desktop rail */}
      <nav aria-label={label} className={cn('sticky hidden md:block', className)} style={{ top }}>
        <a
          href={`#${skipId}`}
          className="label-mono sr-only rounded-md bg-surface-base px-2 py-1 text-ink focus:not-sr-only focus:absolute focus:-top-9 focus:left-0 focus:z-30 focus:border focus:border-line"
        >
          {skipLabel}
        </a>
        <ol className="relative space-y-0.5 border-l border-line">
          {chapters.map((c, i) => {
            const on = i === active
            return (
              <li key={c.id} className="relative">
                {on ? (
                  <motion.span
                    layoutId={`${uid}-marker`}
                    aria-hidden
                    className="absolute -left-px top-1.5 bottom-1.5 w-[2px] rounded-full"
                    style={{ background: PRISM_STROKE.replace('90deg', '180deg') }}
                    transition={reduce ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT }}
                  />
                ) : null}
                <a
                  href={`#${c.id}`}
                  aria-current={on ? 'location' : undefined}
                  className={cn(
                    'grid grid-cols-[2.25rem_1fr] items-baseline gap-1 rounded-r-md py-1.5 pl-4 pr-2 text-sm leading-snug transition-colors duration-150',
                    on ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary',
                  )}
                >
                  <span className="label-mono tabular">{num(c, i)}</span>
                  <span className={on ? 'font-medium' : undefined}>{c.title}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Mobile bar */}
      <nav aria-label={label} className="sticky z-20 border-b border-line-subtle bg-[var(--surface-nav)] px-1 backdrop-blur md:hidden" style={{ top: Math.max(0, top - 32) }}>
        <a href={`#${current?.id ?? ''}`} className="flex items-baseline gap-3 py-3 text-sm">
          <span className="label-mono tabular shrink-0 text-ink-tertiary">{current ? formatProgress(active + 1, chapters.length, current) : null}</span>
          <span className="truncate font-medium text-ink">{current?.title}</span>
        </a>
        <span aria-hidden className="absolute bottom-[-1px] left-0 h-[2px] w-full origin-left" style={{ background: PRISM_STROKE, transform: `scaleX(${(active + 1) / chapters.length})`, transition: reduce ? 'none' : `transform ${DUR.draw}s cubic-bezier(0.23, 1, 0.32, 1)` }} />
      </nav>
      {/* Skip-link target: focus lands here, after the chapter list. */}
      <span id={skipId} tabIndex={-1} className="sr-only" />
    </>
  )
}
