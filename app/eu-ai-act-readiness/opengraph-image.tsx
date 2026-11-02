import { EU_OG } from '@/src/eu-ai-act-readiness-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// EU AI Act Readiness share card, with the page headline. Statically generated.
export const alt = EU_OG.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(EU_OG)
}
