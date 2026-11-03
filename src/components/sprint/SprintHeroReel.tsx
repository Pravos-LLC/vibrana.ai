'use client'

import { useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { ReelStage, type ReelClip } from '@/src/components/landing'
import { landingMedia, landingVideo } from '@/src/landing-media'
import { SPRINT_HERO_REEL } from '@/src/ai-build-sprint-content'

/** m:ss from the encoded file's duration, never typed by hand (copy deck rule). */
function clock(seconds: number) {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const loop = landingVideo(SPRINT_HERO_REEL.loopStem)
const full = landingVideo(SPRINT_HERO_REEL.fullStem)
const duration = clock(landingMedia(`${SPRINT_HERO_REEL.fullStem}.mp4`).duration ?? 0)

// Both clips share one id so ReelStage keeps a single <video> element (its key) across the swap.
const CLIPS: Record<'loop' | 'full', ReelClip> = {
  loop: { id: 'factory', label: SPRINT_HERO_REEL.label, mp4: loop.mp4.path, webm: loop.webm.path, poster: loop.poster.path, duration },
  full: { id: 'factory', label: SPRINT_HERO_REEL.label, mp4: full.mp4.path, webm: full.webm.path, poster: full.poster.path, duration },
}

/**
 * The hero reel. It starts as the muted 7 s loop (preload none, so no video bytes load before the
 * card is half in view). The first request for sound (a click on the picture or the sound button)
 * swaps in the full cut: in the capture phase, before ReelStage's own click handler, the sources
 * are swapped on the same <video> element and `load()` is called. ReelStage's handler then
 * unmutes and calls play() on that element, still inside the visitor's gesture, so the film
 * plays with sound on the first click and the chip follows the element's real play state.
 * ReelStage takes one source per clip, so the swap lives here, in page code, not in the kit.
 */
export function SprintHeroReel({ className }: { className?: string }) {
  const [mode, setMode] = useState<'loop' | 'full'>('loop')

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (mode === 'full') return
    const target = e.target as HTMLElement
    // The picture, or the sound toggle (the only control with aria-pressed).
    if (target.closest('video') || target.closest('button[aria-pressed]')) {
      flushSync(() => setMode('full'))
      e.currentTarget.querySelector('video')?.load()
    }
  }

  return (
    <div onClickCapture={onClickCapture} className={className} data-testid="sprint-hero-reel">
      <ReelStage
        clips={[CLIPS[mode]]}
        title={SPRINT_HERO_REEL.title}
        caption={SPRINT_HERO_REEL.caption}
        captionNote={SPRINT_HERO_REEL.captionNote}
        playLabel={SPRINT_HERO_REEL.playLabel}
        playingLabel={SPRINT_HERO_REEL.playingLabel}
        labels={SPRINT_HERO_REEL.labels}
        cardWidth={300}
      />
    </div>
  )
}
