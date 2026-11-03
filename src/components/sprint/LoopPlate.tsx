'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { landingVideo } from '@/src/landing-media'

/**
 * A muted b-roll loop as a framed plate (John's approved clips B and B2 only). Poster first,
 * no video bytes until the plate is in view, plays only while visible, and stays on the poster
 * under reduced motion or Save-Data. Supporting motion, never a hero.
 */
/** `aspect` sets an inline ratio; omit it to size the plate with classes. */
export function LoopPlate({ stem, className, aspect }: { stem: string; className?: string; aspect?: string }) {
  const media = landingVideo(stem)
  const ref = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(false)
  /** The poster loads only once the plate is near the viewport, so below-fold stills cost nothing up front. */
  const [near, setNear] = useState(false)
  const reduce = useHydratedReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    const nearIo = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true)
    }, { rootMargin: '800px 0px' })
    io.observe(el)
    nearIo.observe(el)
    return () => {
      io.disconnect()
      nearIo.disconnect()
    }
  }, [])

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    v.muted = true
    if (inView && !reduce && !saveData) v.play().catch(() => {})
    else if (!v.paused) v.pause()
  }, [inView, reduce])

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-line bg-surface-overlay', className)} style={aspect ? { aspectRatio: aspect } : undefined}>
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        poster={near ? media.poster.path : undefined}
        muted
        playsInline
        loop
        preload="none"
        aria-label={media.mp4.alt}
      >
        <source src={media.webm.path} type="video/webm; codecs=av01" />
        <source src={media.mp4.path} type="video/mp4" />
      </video>
    </div>
  )
}
