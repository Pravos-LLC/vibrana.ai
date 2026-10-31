'use client'

import { MacBookFrame, CASE_STUDY_MOCKS } from '@/src/components/product-mocks'
import { CASE_STUDY_SCREENSHOTS } from '@/src/case-study-screenshots-content'

/** Single mock at full MacBook width — for `/case-studies/previews/...` capture routes. */
export function CaseStudyMockPreview({
  studySlug,
  screenId,
}: {
  studySlug: string
  screenId: string
}) {
  const mocks = CASE_STUDY_MOCKS[studySlug]
  const Mock = mocks?.[screenId]
  if (!Mock) {
    return (
      <p className="p-8 text-sm text-ink-secondary">
        Unknown preview: {studySlug} / {screenId}
      </p>
    )
  }

  const shots = CASE_STUDY_SCREENSHOTS[studySlug] ?? []
  const meta = shots.find((s) => s.id === screenId)

  return (
    <div className="min-h-screen bg-surface-overlay p-8">
      <div className="mx-auto max-w-[960px]">
        <MacBookFrame url={meta?.url} label={meta?.title}>
          <div className="absolute inset-0 overflow-hidden">
            <Mock />
          </div>
        </MacBookFrame>
      </div>
    </div>
  )
}
