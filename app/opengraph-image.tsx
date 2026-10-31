import { OG_SITE } from '@/src/og-content'
import { OG_SIZE, renderOgCard } from '@/src/og/render-og-card'

// Site-wide share card (Prism Light). Statically generated at build time.
export const alt = OG_SITE.alt
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOgCard(OG_SITE)
}
