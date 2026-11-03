'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import type { LandingMedia } from '@/src/landing-media'

interface Clip {
  mp4: LandingMedia
  webm: LandingMedia
  poster: LandingMedia
}

export interface ScreenLoopLabels {
  pause: string
  play: string
}

/**
 * ScreenLoop: a muted screen recording of the real product. Nothing loads but the poster until the
 * loop is half in view; then it plays, and pauses again when it leaves. Reduced motion and
 * Save-Data keep the poster. A visible pause and play button stops it (WCAG 2.2.2); once paused
 * by the reader it stays paused. `wide` shows on md and up, `tall` below md (two elements, so each
 * viewport fetches only its own cut).
 */
export function ScreenLoop({ wide, tall, label, labels, className }: { wide: Clip; tall: Clip; label: string; labels: ScreenLoopLabels; className?: string }) {
  return (
    <div className={className}>
      <LoopVideo clip={wide} label={label} labels={labels} className="hidden md:block" />
      <LoopVideo clip={tall} label={label} labels={labels} className="md:hidden" />
    </div>
  )
}

function LoopVideo({ clip, label, labels, className }: { clip: Clip; label: string; labels: ScreenLoopLabels; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useHydratedReducedMotion()
  const [playing, setPlaying] = useState(false)
  const [heldByReader, setHeldByReader] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || reduce || heldByReader || typeof IntersectionObserver === 'undefined') return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return
    const io = new IntersectionObserver(
      ([e]) => {
        // Hidden at this breakpoint: offsetParent is null, so the other cut is the one that plays.
        if (e.isIntersecting && v.offsetParent !== null) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.5 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduce, heldByReader])

  const toggle = () => {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      setHeldByReader(false)
      v.play().catch(() => {})
    } else {
      setHeldByReader(true)
      v.pause()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <video
        ref={ref}
        className="block h-auto w-full"
        width={clip.mp4.width}
        height={clip.mp4.height}
        poster={clip.poster.path}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={clip.webm.path} type="video/webm; codecs=av01" />
        <source src={clip.mp4.path} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? labels.pause : labels.play}
        className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface-base/90 text-ink shadow-sm backdrop-blur transition-transform duration-150 hover:bg-surface-base active:scale-[0.94]"
      >
        {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
      </button>
    </div>
  )
}
