import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Section } from '@/src/components/prism'
import { SharedResult, SharedGone } from '@/src/components/simulator/SharedResult'
import { getCachedProfile, getRunBySlug, recordView } from '@/src/lib/simulator/server/db'
import { sizeBand } from '@/src/lib/simulator/format'
import { SIM_META, SIM_SECTOR_LABELS } from '@/src/simulator-content'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

// Unlisted: never indexed, never followed.
const ROBOTS: Metadata['robots'] = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const run = await getRunBySlug(slug).catch(() => null)
  if (!run || run === 'deleted') return { title: SIM_META.title, robots: ROBOTS }
  const title = SIM_META.sharedTitle(SIM_SECTOR_LABELS[run.result.inputs.sector], sizeBand(run.result.inputs.headcount))
  return { title, description: SIM_META.sharedDescription, robots: ROBOTS, openGraph: { title, description: SIM_META.sharedDescription, type: 'website' } }
}

export default async function SharedSimulationPage({ params }: Params) {
  const { slug } = await params
  const run = await getRunBySlug(slug).catch(() => null)
  if (!run) notFound()

  if (run !== 'deleted') {
    await recordView(slug, await headers()).catch(() => undefined)
  }
  // The company header (logo, screenshot, summary) comes from the 30-day profile cache, only when the creator opted in.
  const profile = run !== 'deleted' && run.showCompanyName && run.domain ? await getCachedProfile(run.domain).catch(() => null) : null

  return (
    <EnterprisePageShell>
      <Section container="full" rhythm="none" className="pb-24 pt-28 md:pt-32">
        {run === 'deleted' ? <SharedGone /> : <SharedResult run={run} profile={profile} />}
      </Section>
    </EnterprisePageShell>
  )
}
