import { ROI_OG } from '@/src/roi-calculator-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// Workflow ROI calculator share card. Statically generated.
export const alt = ROI_OG.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(ROI_OG)
}
