import { getCachedProfile, getRunBySlug } from '@/src/lib/simulator/server/db'
import { renderSimulatorCard } from '@/src/components/simulator/server/render-simulator-card'

export const dynamic = 'force-dynamic'

/** The share card as a downloadable PNG, for LinkedIn posts. Same image as the OG card. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const run = await getRunBySlug(slug).catch(() => null)
  if (run === 'deleted') return new Response(null, { status: 410 })
  if (!run) return new Response(null, { status: 404 })
  const profile = run.showCompanyName && run.domain ? await getCachedProfile(run.domain).catch(() => null) : null
  return renderSimulatorCard(run, { download: true, profile })
}
