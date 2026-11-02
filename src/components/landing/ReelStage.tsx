'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'

export interface ReelClip {
  id: string
  /** Short name for the film-strip button and the accessible name: `Factory reel`. */
  label: string
  /** H.264 MP4, the universal source. */
  mp4: string
  /** VP9/AV1 WebM, listed first so browsers that can take it do. */
  webm?: string
  /** A strong still from the cut. Shown first, and for reduced motion and slow connections. */
  poster: string
  /** Running time as shown: `0:42`. */
  duration?: string
}

export interface ReelStageProps {
  clips: readonly ReelClip[]
  /** Accessible name for the stage region. */
  title: string
  /** Show the film strip. Defaults to true when there is more than one clip. */
  strip?: boolean
  /** Small line under the card about captions, e.g. `Captions are burned in.` */
  captionNote?: React.ReactNode
  /** Card width on desktop, 300 to 360px. */
  cardWidth?: 300 | 320 | 340 | 360
  className?: string
}

/**
 * ReelStage: a 9:16 reel set into a desktop hero without reading as a phone ad.
 *
 * A framed card (300 to 360px, 1px hairline, no device chrome) sits on a heavily blurred,
 * enlarged copy of the same picture. The backdrop starts as the poster and, while the reel plays,
 * a 24x42 canvas samples the playing frame four times a second; scaled up and blurred it carries
 * the film's color with one video decode, not two.
 *
 * Loading: the poster paints first; `preload="none"` means no video bytes until the card is half
 * in view, so the reel never competes with the headline for LCP. Muted autoplay only while in
 * view and only without reduced motion; with reduced motion the poster stays and a Play button
 * starts the reel on request. Clicking the picture or the sound button turns sound on.
 *
 * Mobile: the card takes 78vw up to its desktop width, the backdrop becomes a contained panel
 * behind it, and the film strip scrolls sideways under it.
 */
export function ReelStage({ clips, title, strip, captionNote, cardWidth = 320, className }: ReelStageProps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [inView, setInView] = useState(false)
  /** The visitor paused by hand: autoplay stays off until they press play. */
  const [heldByUser, setHeldByUser] = useState(false)
  const reduce = useHydratedReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clip = clips[index]
  const showStrip = (strip ?? clips.length > 1) && clips.length > 1

  // Watch the stage; autoplay only while at least half of it is visible.
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Autoplay policy: muted, in view, no reduced motion, not paused by hand, not on Save-Data.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const saveData = typeof navigator !== 'undefined' && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    const shouldAuto = inView && !reduce && !heldByUser && !saveData
    // React does not reliably reflect `muted` onto a hydrated element; browsers only autoplay muted video.
    v.muted = muted
    if (shouldAuto && v.paused) v.play().catch(() => setPlaying(false))
    if (!inView && !v.paused) v.pause()
  }, [inView, reduce, heldByUser, index, muted])

  // Sample the playing frame into the backdrop canvas, four times a second, only while playing.
  useEffect(() => {
    if (!playing) return
    const v = videoRef.current
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!v || !c || !ctx) return
    const draw = () => {
      if (v.readyState >= 2) ctx.drawImage(v, 0, 0, c.width, c.height)
    }
    draw()
    const id = window.setInterval(draw, 250)
    return () => window.clearInterval(id)
  }, [playing, index])

  const select = useCallback((i: number) => {
    setIndex(i)
    setPlaying(false)
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      setHeldByUser(false)
      v.play().catch(() => setPlaying(false))
    } else {
      setHeldByUser(true)
      v.pause()
    }
  }

  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    const next = !muted
    v.muted = next
    setMuted(next)
    if (!next && v.paused) {
      setHeldByUser(false)
      v.play().catch(() => setPlaying(false))
    }
  }

  // A click on the picture is a request for sound: unmute, and play if paused.
  const onPictureClick = () => {
    const v = videoRef.current
    if (!v) return
    if (muted) toggleSound()
    else togglePlay()
  }

  const width = `min(78vw, ${cardWidth}px)`

  return (
    <section ref={stageRef} aria-label={title} className={cn('relative isolate', className)}>
      {/* Backdrop: the same picture, enlarged and blurred. CSS background so it reads as one slot. */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-[28px] bg-surface-overlay">
        <div
          className="absolute inset-[-12%] scale-110 bg-cover bg-center opacity-60 blur-2xl saturate-150 transition-opacity duration-300"
          style={{ backgroundImage: `url(${clip.poster})`, opacity: playing ? 0 : undefined }}
        />
        <canvas
          ref={canvasRef}
          width={24}
          height={42}
          className="absolute inset-[-12%] h-[124%] w-[124%] blur-2xl saturate-150 transition-opacity duration-300"
          style={{ opacity: playing ? 0.8 : 0 }}
        />
        {/* Wash keeps the card edge and any text on the stage legible in both themes. */}
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent,var(--surface-base))] opacity-55" />
      </div>

      <div className="flex flex-col items-center px-4 py-8 sm:px-10 sm:py-12">
        <div
          className="relative overflow-hidden rounded-[20px] border border-line bg-surface-overlay shadow-[0_24px_60px_-24px_rgba(17,12,46,0.45)]"
          style={{ width, aspectRatio: '9 / 16' }}
        >
          <video
            key={clip.id}
            ref={videoRef}
            className="absolute inset-0 h-full w-full cursor-pointer object-cover"
            poster={clip.poster}
            muted={muted}
            playsInline
            loop
            preload="none"
            aria-label={`${clip.label}${clip.duration ? `, ${clip.duration}` : ''}`}
            onClick={onPictureClick}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            {clip.webm ? <source src={clip.webm} type="video/webm" /> : null}
            <source src={clip.mp4} type="video/mp4" />
          </video>

          {/* Control bar: its own band at the foot of the card, never over the captions' middle. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-linear-to-t from-black/55 to-transparent p-3 pt-10">
            <span className="label-mono pointer-events-auto rounded-full bg-black/40 px-2.5 py-1 text-white/90 backdrop-blur-sm">
              {playing ? 'Playing' : 'Watch'}
              {clip.duration ? ` ${clip.duration}` : ''}
            </span>
            <span className="pointer-events-auto flex gap-1.5">
              <StageButton label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
                {playing ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
              </StageButton>
              <StageButton label={muted ? 'Turn sound on' : 'Turn sound off'} pressed={!muted} onClick={toggleSound}>
                {muted ? <VolumeX size={15} strokeWidth={2} /> : <Volume2 size={15} strokeWidth={2} />}
              </StageButton>
            </span>
          </div>
        </div>

        {showStrip ? (
          <div className="mt-5 flex max-w-full gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Choose a clip">
            {clips.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={i === index}
                onClick={() => select(i)}
                className={cn(
                  'group flex shrink-0 items-center gap-2 rounded-xl border p-1.5 pr-3 text-left transition-[border-color,background-color,transform] duration-150 active:scale-[0.97]',
                  i === index ? 'border-line-strong bg-surface-frost' : 'border-line-subtle bg-surface-frost/60 hover:border-line',
                )}
              >
                <span
                  aria-hidden
                  className={cn('h-12 w-[27px] rounded-md bg-cover bg-center transition-opacity duration-150', i === index ? 'opacity-100' : 'opacity-60 group-hover:opacity-90')}
                  style={{ backgroundImage: `url(${c.poster})` }}
                />
                <span className="flex flex-col">
                  <span className="text-xs font-medium text-ink">{c.label}</span>
                  {c.duration ? <span className="label-mono text-ink-tertiary">{c.duration}</span> : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {captionNote ? <p className="label-mono mt-3 text-center text-ink-tertiary">{captionNote}</p> : null}
      </div>
    </section>
  )
}

function StageButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-[transform,background-color] duration-150 hover:bg-black/60 active:scale-[0.94]"
    >
      {children}
    </button>
  )
}
