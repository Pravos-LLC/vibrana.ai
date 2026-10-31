import { CaseStudyMockPreview } from '@/src/components/case-studies/CaseStudyMockPreview'
import { notFound } from 'next/navigation'
import { getRoutableCaseStudies } from '@/src/lib/case-studies'
import { CASE_STUDY_MOCKS } from '@/src/components/product-mocks'

export const dynamic = 'force-static'

export const metadata = {
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  const params: { study: string; screen: string }[] = []
  const visible = new Set(getRoutableCaseStudies().map(({ slug }) => slug))
  for (const [study, screens] of Object.entries(CASE_STUDY_MOCKS)) {
    if (!visible.has(study)) continue
    for (const screen of Object.keys(screens)) {
      params.push({ study, screen })
    }
  }
  return params
}

export default async function CaseStudyPreviewPage({
  params,
}: {
  params: Promise<{ study: string; screen: string }>
}) {
  const { study, screen } = await params
  if (!getRoutableCaseStudies().some(({ slug }) => slug === study)) notFound()
  if (!Object.hasOwn(CASE_STUDY_MOCKS[study] ?? {}, screen)) notFound()
  return (
    <div className="prism-light min-h-screen bg-surface-base font-body text-ink">
      <CaseStudyMockPreview studySlug={study} screenId={screen} />
    </div>
  )
}
