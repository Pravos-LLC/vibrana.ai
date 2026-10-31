import { describe, expect, it } from 'vitest'
import { EMPTY_FIT, FIT_SAMPLE, evaluateFit, fitStepError, fitRows, fitBriefText, fitAnswersSchema, isCompleteFit } from '@/src/lib/sprint-fit'
import { sprintInquirySchema } from '@/src/lib/sprint-inquiry'
import { fitBriefHtml } from '@/src/lib/sprint-fit-export'
import { FIT } from '@/src/sprint-fit-content'
const ready = { ...FIT_SAMPLE, access: 'ready' as const }
describe('Sprint fit routing', () => {
  it('welcomes an idea without a prototype or existing tools', () => { expect(isCompleteFit({ ...FIT_SAMPLE, tools: '' })).toBe(true) })
  it('routes an identified first release to scoping, independent of funding', () => {
    for (const funding of ['funded', 'proposal', 'case', 'exploring', 'private'] as const) expect(evaluateFit({ ...ready, funding }).route).toBe('ready')
  })
  it('keeps unknown access as a confirmation item, even for a funded buyer', () => {
    const result = evaluateFit({ ...ready, access: 'unknown', funding: 'funded' })
    expect(result.route).toBe('confirm'); expect(result.actions).toContain(FIT.actions.access)
  })
  it.each(['blocked', 'participation', 'review'])('resolves a known %s dependency before shaping or scoping', key => {
    const overrides = key === 'blocked' ? { access: 'blocked' as const } : key === 'participation' ? { participation: 'no' as const } : { review: 'required' as const }
    expect(evaluateFit({ ...ready, shapeFirst: true, ...overrides }).route).toBe('dependency')
  })
  it('offers scope shaping for a founder who cannot yet define the user/outcome', () => {
    const a = { ...ready, user: '', outcome: '', shapeFirst: true }
    expect(fitStepError(a, 1)).toBe(''); expect(evaluateFit(a).route).toBe('shape')
  })
  it('does not call an unknown success indicator ready', () => { expect(evaluateFit({ ...ready, metric: 'unknown' }).route).toBe('confirm') })
  it('carries every unresolved preparation item', () => {
    const result = evaluateFit({ ...ready, access: 'arrange', owner: 'identify', participation: 'arrange', review: 'unknown', metric: 'unknown' })
    expect(result.actions).toHaveLength(5); expect(result.route).toBe('confirm')
  })
  it('keeps a zero baseline distinct from an unknown baseline', () => {
    expect(fitRows({ ...ready, baseline: '0' })).toContainEqual([FIT.rows.baseline, '0'])
    expect(fitRows(ready)).toContainEqual([FIT.rows.baseline, FIT.empty])
  })
  it('includes the useful result and funding in the downloadable brief', () => {
    const brief = fitBriefText(FIT_SAMPLE)
    expect(brief).toContain(FIT_SAMPLE.outcome); expect(brief).toContain(FIT.routes.confirm); expect(brief).toContain(FIT.actions.access); expect(brief).toContain('Approval needs a proposal')
  })
  it.each([0,1,2,3,4,5,6])('does not silently advance incomplete step %i', step => { expect(fitStepError(EMPTY_FIT, step)).not.toBe('') })
  it('rejects invalid enums and excessive answer payloads', () => {
    expect(fitAnswersSchema.safeParse({ ...ready, access: 'certain' }).success).toBe(false)
    expect(fitAnswersSchema.safeParse({ ...ready, current: 'x'.repeat(1201) }).success).toBe(false)
  })
  it('rejects an incomplete fit check at the existing inquiry boundary', () => {
    const base = { name: 'Ada', email: 'ada@example.com', companyName: 'Project', track: 'product', desiredOutcome: 'A proposal assistant' }
    expect(sprintInquirySchema.safeParse({ ...base, fitCheck: EMPTY_FIT }).success).toBe(false)
    expect(sprintInquirySchema.safeParse({ ...base, fitCheck: ready }).success).toBe(true)
  })
})

describe('HTML build brief', () => {
  it('is self-contained and escapes visitor answers in every row', () => {
    const html = fitBriefHtml({ ...FIT_SAMPLE, user: '<img src=x onerror=alert(1)>', outcome: '<script>alert(2)</script>' })
    expect(html).toContain('<!doctype html>'); expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>'); expect(html).not.toContain('<img src=x')
    expect(html).toContain('Confirm a few essentials'); expect(html).toContain('Funding')
  })
})
