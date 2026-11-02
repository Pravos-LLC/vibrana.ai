'use client'

import { useEffect, useRef, useState } from 'react'
import { FEEDBACK_BACKDROPS, UNSPLASH_URL, photographerUrl } from '@/src/feedback-backdrops'

/** How long each city holds before the next crossfade begins. */
const HOLD_MS = 9000

/**
 * Fixed backdrop for the feedback form: a timed carousel of blurred city photos, a per-slide prism
 * tint, a faint dot field, and a dot glow that follows a fine pointer. Presentational only; the
 * `startIndex` comes from the server so SSR and hydration agree. `wide` lines the credit up with the
 * wider thank-you column.
 */
export function FeedbackBackdrop({ startIndex, wide = false }: { startIndex: number; wide?: boolean }) {
  const count = FEEDBACK_BACKDROPS.length
  const start = Number.isInteger(startIndex) ? ((startIndex % count) + count) % count : 0
  const [active, setActive] = useState(start)
  const [loadAll, setLoadAll] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // The first photo loads with the page; the rest follow once it has settled.
  useEffect(() => {
    const timer = window.setTimeout(() => setLoadAll(true), 1200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let timer: number | undefined
    const arm = () => {
      window.clearInterval(timer)
      timer = window.setInterval(() => setActive((i) => (i + 1) % count), HOLD_MS)
    }
    const onVisibility = () => {
      if (document.hidden) window.clearInterval(timer)
      else arm()
    }
    if (!document.hidden) arm()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [count])

  // Glowing dots under a mouse. Skipped for touch and for reduced motion.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    let x = 0
    let y = 0
    const paint = () => {
      frame = 0
      root.style.setProperty('--mx', `${x}px`)
      root.style.setProperty('--my', `${y}px`)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      x = event.clientX
      y = event.clientY
      root.dataset.glow = '1'
      if (!frame) frame = window.requestAnimationFrame(paint)
    }
    const onLeave = () => { root.dataset.glow = '0' }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const slide = FEEDBACK_BACKDROPS[active]

  return (
    <>
      <div
        ref={rootRef}
        className="fb-backdrop"
        aria-hidden
        data-glow="0"
        style={{ '--fb-h': slide.hue } as React.CSSProperties}
      >
        {FEEDBACK_BACKDROPS.map((item, index) =>
          index === start || loadAll ? (
            <div
              key={item.id}
              className="fb-slide"
              data-active={index === active}
              style={{ '--h': item.hue, '--bx': `${item.bandX}%` } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="fb-slide-img"
                decoding="async"
                fetchPriority={index === start ? 'high' : 'low'}
              />
              <div className="fb-slide-tint" />
            </div>
          ) : null,
        )}
        <div className="fb-dots" />
        <div className="fb-dots fb-dots-glow" />
      </div>
      <p className={wide ? 'fb-credit fb-credit-wide' : 'fb-credit'}>
        Photo:{' '}
        <a href={photographerUrl(slide)} target="_blank" rel="noopener noreferrer">{slide.photographer}</a>
        {' / '}
        <a href={UNSPLASH_URL} target="_blank" rel="noopener noreferrer">Unsplash</a>
      </p>
    </>
  )
}
