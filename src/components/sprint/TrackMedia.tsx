import Image from '@/src/components/PublicDemoImage'
import { landingMedia } from '@/src/landing-media'
import type { SprintTrackCard } from '@/src/ai-build-sprint-content'
import { LoopPlate } from './LoopPlate'

/** The track card's picture: a loop or a still of the person who leads it. Real people, large. */
export function TrackMedia({ track }: { track: SprintTrackCard }) {
  if ('video' in track.media) {
    return <LoopPlate stem={track.media.video} aspect="4 / 3" className="rounded-2xl" />
  }
  const asset = landingMedia(track.media.landing)
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-overlay" style={{ aspectRatio: '4 / 3' }}>
      <Image src={asset.path} alt={asset.alt} fill sizes="(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 22vw" className="object-cover" />
    </div>
  )
}
