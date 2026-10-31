import { describe, expect, it } from 'vitest'
import { EMPTY_FIT, FIT_SAMPLE, evaluateFit, fitAnswersSchema, fitMetricText, fitRows, fitStepError, selectedFitMetrics } from '@/src/lib/sprint-fit'
import { buildSprintBrief, EMPTY_BUSINESS_CASE, type BriefRequest } from '@/src/lib/sprint-brief'
import { sprintInquirySchema } from '@/src/lib/sprint-inquiry'
import { FIT } from '@/src/sprint-fit-content'
const request: BriefRequest = { company: { name: 'Example project', website: '', description: 'A professional services business.', sector: 'professional-services', confirmed: true }, businessCase: EMPTY_BUSINESS_CASE, submissionId: '16cbb772-776f-4da6-b347-26468f9bba84' }
const ready = { ...FIT_SAMPLE, access: 'ready' as const }
describe('multiple sprint success measures', () => {
  it('keeps legacy saved answers readable without converting unknown to Other', () => {
    expect(selectedFitMetrics(FIT_SAMPLE)).toEqual(['time'])
    expect(selectedFitMetrics({ ...FIT_SAMPLE, metric: 'unknown' })).toEqual([])
    expect(fitStepError({ ...FIT_SAMPLE, metric: 'unknown' }, 3)).toBe('')
    expect(evaluateFit({ ...ready, metric: 'unknown' }).route).toBe('confirm')
  })
  it('requires a new selection even when an old single-choice value remains', () => {
    expect(selectedFitMetrics({ ...FIT_SAMPLE, metrics: [] })).toEqual([])
    expect(fitStepError({ ...FIT_SAMPLE, metrics: [] }, 3)).toBe(FIT.errors.answer)
    expect(fitStepError(EMPTY_FIT, 3)).toBe(FIT.errors.answer)
  })
  it('keeps every selected success measure in the brief and summary', () => {
    const answers = { ...ready, metrics: ['time', 'quality'] as const, metricOther: '' }
    const a = { ...answers, metrics: [...answers.metrics] }
    expect(fitMetricText(a)).toBe('Less time, Better quality')
    expect(fitRows(a)).toContainEqual([FIT.rows.metric, 'Less time, Better quality'])
    expect(buildSprintBrief(a, request).scope.successMeasure).toContain('Less time, Better quality')
    expect(buildSprintBrief(a, request).scope.successMeasure).toContain(FIT_SAMPLE.target)
    for (const funding of ['funded', 'proposal', 'case', 'exploring', 'private'] as const) expect(evaluateFit({ ...a, funding }).route).toBe('ready')
  })
  it('requires Other text only when selected and never treats a hidden old answer as a criterion', () => {
    const a = { ...ready, metrics: ['other'] as const }
    expect(fitStepError({ ...a, metrics: [...a.metrics], metricOther: '  ' }, 3)).toBe(FIT.errors.metricOther)
    expect(fitStepError({ ...a, metrics: [...a.metrics], metricOther: 'More repeat purchases' }, 3)).toBe('')
    expect(fitMetricText({ ...a, metrics: [...a.metrics], metricOther: 'More repeat purchases' })).toBe('More repeat purchases')
    expect(fitMetricText({ ...ready, metrics: ['quality'], metricOther: 'Old unselected text' })).toBe('Better quality')
    const base = { name: 'Demo founder', email: 'demo@example.com', role: 'Founder', companyName: 'Example project', track: 'product', desiredOutcome: 'A proposal assistant', briefRequest: request }
    expect(sprintInquirySchema.safeParse({ ...base, fitCheck: { ...a, metrics: [...a.metrics], metricOther: '' } }).success).toBe(false)
  })
  it('bounds multiple-choice payloads and custom text', () => {
    expect(fitAnswersSchema.safeParse({ ...ready, metrics: ['not-a-measure'] }).success).toBe(false)
    expect(fitAnswersSchema.safeParse({ ...ready, metrics: Array(7).fill('time') }).success).toBe(false)
    expect(fitAnswersSchema.safeParse({ ...ready, metrics: ['other'], metricOther: 'x'.repeat(1201) }).success).toBe(false)
  })
})
