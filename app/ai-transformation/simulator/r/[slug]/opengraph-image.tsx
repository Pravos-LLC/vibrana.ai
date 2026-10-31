import { getCachedProfile, getRunBySlug } from '@/src/lib/simulator/server/db'
import { CARD_SIZE, renderSimulatorCard } from '@/src/components/simulator/server/render-simulator-card'
import { SIM_META } from '@/src/simulator-content'

// Share card for one stored simulation. A deleted run stops rendering (410).
export const alt = SIM_META.ogAlt
export const size = CARD_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const run = await getRunBySlug(slug).catch(() => null)
  if (run === 'deleted') return new Response(null, { status: 410 })
  if (!run) return new Response(null, { status: 404 })
  const profile = run.showCompanyName && run.domain ? await getCachedProfile(run.domain).catch(() => null) : null
  return renderSimulatorCard(run, { profile })
}
