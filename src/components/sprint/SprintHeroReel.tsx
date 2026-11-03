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

const CLIPS: Record<'loop' | 'full', ReelClip> = {
  loop: { id: 'factory-loop', label: SPRINT_HERO_REEL.label, mp4: loop.mp4.path, webm: loop.webm.path, poster: loop.poster.path, duration },
  full: { id: 'factory-full', label: SPRINT_HERO_REEL.label, mp4: full.mp4.path, webm: full.webm.path, poster: full.poster.path, duration },
}

/**
 * The hero reel. It starts as the muted 7 s loop (light, never competes with the headline for
 * LCP). The first request for sound (a click on the picture or the sound button) swaps in the
 * full cut with its soundtrack before ReelStage handles that same click, so the full film plays
 * with sound inside the visitor's gesture. ReelStage takes one source per clip, so the swap
 * lives here, in page code, rather than in the kit.
 */
export function SprintHeroReel({ className }: { className?: string }) {
  const [mode, setMode] = useState<'loop' | 'full'>('loop')

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (mode === 'full') return
    const target = e.target as HTMLElement
    // The picture, or the sound toggle (the only control with aria-pressed).
    if (target.closest('video') || target.closest('button[aria-pressed]')) {
      flushSync(() => setMode('full'))
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
