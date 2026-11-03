'use client'

import React, { useEffect, useRef } from 'react'
import { landingVideo } from '@/src/landing-media'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'

const FILM = landingVideo('transformation/transformation-pathway-9x16')

/**
 * The transformation-pathway screen loop (a sample readiness report scrolling to its plan), muted.
 * The 9:16 cut at every width: it was recorded at phone width, so in a 300 to 340px frame its text
 * reads at near its own size (the 16:9 cut shrank a desktop report to about 38%, unreadable).
 *
 * Loading: the poster is a lazy <img> behind the video (a `poster` attribute would load with the
 * page), the video is preload none and starts muted only when half in view; never with reduced
 * motion or Save-Data, where the poster stays.
 */
export function PathwayFilm({ caption }: { caption: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const reduce = useHydratedReducedMotion()

  useEffect(() => {
    const v = video.current
    if (!v || reduce || typeof IntersectionObserver === 'undefined') return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.5 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduce])

  return (
    <figure className="m-0 mx-auto flex w-full max-w-[300px] flex-col gap-3 lg:max-w-[340px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-line bg-[var(--surface-base)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- a lazy poster under the video, not a content image */}
        <img src={FILM.poster.path} width={FILM.poster.width} height={FILM.poster.height} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <video ref={video} className="relative block h-full w-full object-cover" width={FILM.mp4.width} height={FILM.mp4.height} muted loop playsInline preload="none" aria-label={FILM.mp4.alt}>
          <source src={FILM.webm.path} type="video/webm; codecs=av01" />
          <source src={FILM.mp4.path} type="video/mp4" />
        </video>
      </div>
      <figcaption className="label-mono text-ink-tertiary">{caption}</figcaption>
    </figure>
  )
}
