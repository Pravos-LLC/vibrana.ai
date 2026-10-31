import { describe, expect, it } from 'vitest'
import { getPublishedCaseStudies } from '@/src/lib/case-studies'
import { relevantSprintCases, type SprintCaseStudyCard } from '@/src/lib/sprint-case-studies'
import { FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { buildSprintBrief, EMPTY_BUSINESS_CASE } from '@/src/lib/sprint-brief'
import { BRIEF_DESIGN } from '@/src/sprint-brief-design-content'
const cards: SprintCaseStudyCard[] = getPublishedCaseStudies().flatMap(study => {
  const thumbnail = BRIEF_DESIGN.caseThumbnails[study.slug as keyof typeof BRIEF_DESIGN.caseThumbnails]
  return thumbnail ? [{ slug: study.slug, title: study.anonymizedName, description: study.oneLineOutcome, vertical: study.vertical, thumbnail, href: `/case-studies/${study.slug}` }] : []
})
const brief = buildSprintBrief(FIT_SAMPLE, { company: { name: 'Northbank', website: '', description: '', sector: 'real-estate', confirmed: true }, businessCase: EMPTY_BUSINESS_CASE, submissionId: '118b04ab-d8ea-4429-960c-7d9eb6983087' })
describe('published sprint credibility', () => {
  it('only receives published approved studies and prioritizes relevant work', () => {
    expect(cards).toHaveLength(2)
    expect(relevantSprintCases(brief, cards)[0].slug).toBe('european-proptech-rag')
    expect(cards.map(c => c.slug)).not.toContain('sample-review-draft')
  })
  it('omits irrelevant work and respects an empty approved catalogue', () => {
    const unrelated = { ...brief, company: { ...brief.company, sector: 'other' as const }, answers: { ...brief.answers, user: 'People', current: 'Nothing built yet', outcome: 'Track stock levels', tools: '' } }
    expect(relevantSprintCases(unrelated, cards)).toEqual([])
    expect(relevantSprintCases(brief, [])).toEqual([])
  })
})
