import type { Metadata } from 'next'
import { SprintFitCheck } from '@/src/components/sprint-fit/SprintFitCheck'
import { FIT } from '@/src/sprint-fit-content'
import { getPublishedCaseStudies, caseStudyName } from '@/src/lib/case-studies'
import { BRIEF_DESIGN } from '@/src/sprint-brief-design-content'
export const metadata: Metadata = { title: 'Sprint Fit Check | Vibrana', description: FIT.intro, alternates: { canonical: 'https://www.vibrana.ai/ai-build-sprint/readiness' } }
export default function Page() {
  const caseStudies = getPublishedCaseStudies().flatMap(study => {
    const thumbnail = BRIEF_DESIGN.caseThumbnails[study.slug as keyof typeof BRIEF_DESIGN.caseThumbnails]
    return thumbnail ? [{ slug: study.slug, title: caseStudyName(study), description: BRIEF_DESIGN.caseDescriptions[study.slug as keyof typeof BRIEF_DESIGN.caseDescriptions], vertical: study.vertical, thumbnail, href: `/case-studies/${study.slug}` }] : []
  })
  return <SprintFitCheck caseStudies={caseStudies} />
}
