'use client'

import React, { useEffect, useRef } from 'react'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import type { LandingMedia } from '@/src/landing-media'

interface Clip {
  mp4: LandingMedia
  webm: LandingMedia
  poster: LandingMedia
}

/**
 * ScreenLoop: a muted screen recording of the real product. Nothing loads but the poster until the
 * loop is half in view; then it plays, and pauses again when it leaves. Reduced motion and
 * Save-Data keep the poster. `wide` shows on md and up, `tall` below md (two elements, so each
 * viewport fetches only its own cut).
 */
export function ScreenLoop({ wide, tall, label, className }: { wide: Clip; tall: Clip; label: string; className?: string }) {
  return (
    <div className={className}>
      <LoopVideo clip={wide} label={label} className="hidden md:block" />
      <LoopVideo clip={tall} label={label} className="mx-auto max-w-[360px] md:hidden" />
    </div>
  )
}

function LoopVideo({ clip, label, className }: { clip: Clip; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useHydratedReducedMotion()

  useEffect(() => {
    const v = ref.current
    if (!v || reduce || typeof IntersectionObserver === 'undefined') return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return
    const io = new IntersectionObserver(
      ([e]) => {
        // Hidden at this breakpoint: offsetParent is null, so the other cut is the one that plays.
        if (e.isIntersecting && v.offsetParent !== null) {
          v.play().catch(() => {})
        } else v.pause()
      },
      { threshold: 0.5 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduce])

  return (
    <video
      ref={ref}
      className={cn('block h-auto w-full', className)}
      width={clip.mp4.width}
      height={clip.mp4.height}
      poster={clip.poster.path}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    >
      <source src={clip.webm.path} type="video/webm; codecs=av01" />
      <source src={clip.mp4.path} type="video/mp4" />
    </video>
  )
}
