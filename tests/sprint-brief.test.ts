import { describe, expect, it } from 'vitest'
import { buildSprintBrief, calculateBusinessCase, EMPTY_BUSINESS_CASE, inferWebsiteFromEmail, briefRequestSchema, type BriefRequest } from '@/src/lib/sprint-brief'
import { FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { parseSprintNarrative } from '@/src/lib/sprint-fit/narrative'
const request: BriefRequest = { company: { name: 'Example', website: '', description: 'A professional services business.', sector: 'professional-services', confirmed: true }, businessCase: EMPTY_BUSINESS_CASE, submissionId: '16cbb772-776f-4da6-b347-26468f9bba84' }

describe('sprint business case', () => {
  it('keeps unknown inputs distinct from zero and requires explicit people per task', () => {
    expect(calculateBusinessCase(EMPTY_BUSINESS_CASE).currentHours).toBeNull()
    expect(calculateBusinessCase({ ...EMPTY_BUSINESS_CASE, tasksPerWeek: 0, minutesPerTask: 30, peoplePerTask: 1 }).currentHours).toBe(0)
    expect(calculateBusinessCase({ ...EMPTY_BUSINESS_CASE, tasksPerWeek: 30, minutesPerTask: 30 }).currentHours).toBeNull()
  })
  it('calculates team-total weekly person-hours once, and separates time from money', () => {
    const result = calculateBusinessCase({ ...EMPTY_BUSINESS_CASE, tasksPerWeek: 12, minutesPerTask: 30, peoplePerTask: 2, targetMinutesPerTask: 10 })
    expect(result.currentHours).toBe(12); expect(result.targetHours).toBe(4); expect(result.releasedHours).toBe(8)
    expect(result.currentCost).toBeNull()
    expect(calculateBusinessCase({ ...result.inputs, hourlyCost: 50 }).capacityValue).toBe(400)
  })
  it('does not clamp a worse target to invented positive savings or add software spend to it', () => {
    const result = calculateBusinessCase({ ...EMPTY_BUSINESS_CASE, tasksPerWeek: 10, minutesPerTask: 6, peoplePerTask: 1, targetMinutesPerTask: 12, hourlyCost: 100, softwareCostMonthly: 500 })
    expect(result.releasedHours).toBe(-1); expect(result.capacityValue).toBe(-100)
  })
  it('rejects negative, nonfinite or excessive quantities and invalid confirmation', () => {
    expect(briefRequestSchema.safeParse({ ...request, businessCase: { ...EMPTY_BUSINESS_CASE, tasksPerWeek: -1 } }).success).toBe(false)
    expect(briefRequestSchema.safeParse({ ...request, businessCase: { ...EMPTY_BUSINESS_CASE, hourlyCost: Infinity } }).success).toBe(false)
    expect(briefRequestSchema.safeParse({ ...request, company: { ...request.company, confirmed: false } }).success).toBe(false)
  })
})

describe('grounded sprint brief', () => {
  it('supports idea-stage founders with no website and meaningful shaping decisions', () => {
    const brief = buildSprintBrief({ ...FIT_SAMPLE, shapeFirst: true, user: '', outcome: '' }, request)
    expect(brief.company.logoUrl).toBeNull(); expect(brief.company.sourceUrl).toBeNull()
    expect(brief.narrative.proposal).toBeTruthy(); expect(brief.scope.firstRelease).toBeTruthy(); expect(brief.scope.user).toBeTruthy()
    expect(brief.benchmark).toBeNull()
  })
  it('does not trust client-supplied research timestamps, domains or image fields', () => {
    const brief = buildSprintBrief(FIT_SAMPLE, { ...request, company: { ...request.company, profileDomain: 'forged.example', researchedAt: 'yesterday' } })
    expect(brief.company.researchedAt).toBeNull(); expect(brief.company).not.toHaveProperty('profileDomain')
  })
  it('requires both a relevant sector and task for industry evidence', () => {
    expect(buildSprintBrief(FIT_SAMPLE, request).benchmark).toBeNull()
    expect(buildSprintBrief({ ...FIT_SAMPLE, outcome: 'Internal knowledge search for staff' }, request).benchmark?.company).toBe('PwC')
    expect(buildSprintBrief({ ...FIT_SAMPLE, outcome: 'Internal knowledge search for staff' }, { ...request, company: { ...request.company, sector: 'other' } }).benchmark).toBeNull()
  })
  it('suggests exact business domains without reading personal mail services', () => {
    expect(inferWebsiteFromEmail('ada@gmail.com')).toBe('')
    expect(inferWebsiteFromEmail('ada@proton.me')).toBe('')
    expect(inferWebsiteFromEmail('ada@mygmail.com')).toBe('https://mygmail.com')
    expect(inferWebsiteFromEmail('Ada@EXAMPLE.COM')).toBe('https://example.com')
  })
  it('rejects invented numeric claims or unsafe model output', () => {
    expect(parseSprintNarrative({ summary: 'You save 90 percent.', proposal: 'A useful first release.', assumptions: [] })).toBeNull()
    expect(parseSprintNarrative({ summary: '<script>x</script>', proposal: 'A useful first release.', assumptions: [] })).toBeNull()
    expect(parseSprintNarrative({ summary: 'Connect the stated task to the business.', proposal: 'Test a draft with human review.', assumptions: ['Confirm a first user.'] })).not.toBeNull()
  })
})
