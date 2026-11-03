'use client'

import React, { useEffect, useRef } from 'react'
import { landingVideo } from '@/src/landing-media'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'

const WIDE = landingVideo('transformation/transformation-pathway-16x9')
const TALL = landingVideo('transformation/transformation-pathway-9x16')

/**
 * The transformation-pathway screen loop (a sample readiness report scrolling to its plan), muted.
 * 16:9 from 768px, 9:16 below; only the one on screen ever loads. Nothing is fetched until the film
 * is half in view (preload none, poster first), and it never plays with reduced motion or Save-Data.
 */
export function PathwayFilm({ caption }: { caption: string }) {
  const wide = useRef<HTMLVideoElement>(null)
  const tall = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const reduce = useHydratedReducedMotion()

  useEffect(() => {
    const el = box.current
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (saveData) return
    const visible = () => [wide.current, tall.current].find((v) => v && v.offsetParent !== null) ?? null
    const io = new IntersectionObserver(
      ([entry]) => {
        const v = visible()
        if (!v) return
        if (entry.isIntersecting) void v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduce])

  const video = (ref: React.RefObject<HTMLVideoElement | null>, v: typeof WIDE, className: string) => (
    <video
      ref={ref}
      className={className}
      poster={v.poster.path}
      width={v.mp4.width}
      height={v.mp4.height}
      muted
      loop
      playsInline
      preload="none"
      aria-label={v.mp4.alt}
    >
      <source src={v.webm.path} type="video/webm; codecs=av01" />
      <source src={v.mp4.path} type="video/mp4" />
    </video>
  )

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div ref={box} className="overflow-hidden rounded-2xl border border-line bg-black max-md:mx-auto max-md:w-full max-md:max-w-[300px]">
        {video(wide, WIDE, 'hidden aspect-video h-auto w-full md:block')}
        {video(tall, TALL, 'block aspect-[9/16] h-auto w-full md:hidden')}
      </div>
      <figcaption className="label-mono text-ink-tertiary">{caption}</figcaption>
    </figure>
  )
}
