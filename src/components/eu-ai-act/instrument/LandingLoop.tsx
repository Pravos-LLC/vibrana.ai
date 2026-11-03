'use client'

import { useEffect, useRef, useState } from 'react'
import { landingVideo } from '@/src/landing-media'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * LandingLoop: a muted screen loop from src/landing-media (AV1 WebM first, H.264 MP4 second)
 * over its poster. No video bytes until the frame nears the viewport; plays while visible and
 * pauses when it leaves. Under reduced motion or Save-Data the poster stays. The loop carries
 * meaning (the real assessment and report in use), so it is labeled with the manifest's alt text.
 */
export function LandingLoop({ stem, className }: { stem: string; className?: string }) {
  const { mp4, webm, poster } = landingVideo(stem)
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useHydratedReducedMotion()
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const el = ref.current
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!el || reduce || saveData || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true)
          el.play().catch(() => {})
        } else el.pause()
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduce])

  useEffect(() => {
    if (load) ref.current?.load()
  }, [load])

  return (
    <video
      ref={ref}
      className={cn('block h-auto w-full bg-surface-raised', className)}
      width={mp4.width}
      height={mp4.height}
      poster={poster.path}
      muted
      loop
      playsInline
      preload="none"
      aria-label={mp4.alt}
      onCanPlay={(e) => {
        if (!reduce) e.currentTarget.play().catch(() => {})
      }}
    >
      {load ? <source src={webm.path} type="video/webm; codecs=av01" /> : null}
      {load ? <source src={mp4.path} type="video/mp4" /> : null}
    </video>
  )
}
