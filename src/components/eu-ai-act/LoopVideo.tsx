'use client'

import { useEffect, useRef, useState } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { productionSite } from '@/src/site-content'
import { useReducedMotion } from 'framer-motion'
import { EU_VIDEO_BASE } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * LoopVideo: a short, silent, muted loop over its own poster.
 *
 * The poster renders first through next/image (so it is optimized, sized and never shifts
 * layout); the video loads only when the frame nears the viewport, plays while it is visible
 * and pauses when it leaves. Under prefers-reduced-motion the video never loads and the poster
 * stays. Decorative by default (aria-hidden); pass `alt` when the footage carries meaning.
 *
 * Files: `<name>.webm` (VP9), `<name>.mp4` (H.264) and `<name>-poster.webp` under
 * public/assets/eu-ai-act/video/. Sources and licenses: CREDITS.md in that folder.
 */
export function LoopVideo({
  name,
  alt,
  priority = false,
  sizes = '(max-width: 1024px) 92vw, 50vw',
  className,
  mediaClassName,
}: {
  name: string
  alt?: string
  priority?: boolean
  sizes?: string
  className?: string
  mediaClassName?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const [load, setLoad] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !productionSite) return
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

  if (!productionSite) return <div className={cn('relative overflow-hidden', className)} aria-hidden><Image src="/assets/imagery/homepage/prism-grid-solar.webp" alt="" fill priority={priority} sizes={sizes} className={cn('object-cover', mediaClassName)} /></div>

  const src = `${EU_VIDEO_BASE}/${name}`
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden={alt ? undefined : true}>
      <Image src={`${src}-poster.webp`} alt={alt ?? ''} fill priority={priority} sizes={sizes} className={cn('object-cover', mediaClassName)} />
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', playing ? 'opacity-100' : 'opacity-0', mediaClassName)}
      >
        {load && <source src={`${src}.webm`} type="video/webm" />}
        {load && <source src={`${src}.mp4`} type="video/mp4" />}
      </video>
    </div>
  )
}
