import { READINESS_OG } from '@/src/ai-readiness-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// AI Readiness share card, with the page headline. Statically generated.
export const alt = READINESS_OG.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(READINESS_OG)
}
