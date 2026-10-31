import { OG_SPRINT } from '@/src/og-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// AI Build Sprint share card, with the sprint headline. Statically generated.
export const alt = OG_SPRINT.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(OG_SPRINT)
}
