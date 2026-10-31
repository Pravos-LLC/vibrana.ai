import { SIM_OG } from '@/src/simulator-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// Simulator landing share card. Statically generated.
export const alt = SIM_OG.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(SIM_OG)
}
