import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { buildSprintBrief, EMPTY_BUSINESS_CASE } from '@/src/lib/sprint-brief'
const state = vi.hoisted(() => ({ budget: vi.fn() }))
vi.mock('@/src/lib/simulator/server/db', () => ({ budgetHit: state.budget }))
vi.mock('@/src/lib/simulator/profile', () => ({ DAILY_CLASSIFY_CAP: 300 }))
const { enrichSprintNarrative } = await import('@/src/lib/sprint-fit/narrative')
const brief = buildSprintBrief(FIT_SAMPLE, { company: { name: 'Example', website: '', description: 'A consulting business.', sector: 'professional-services', confirmed: true }, businessCase: EMPTY_BUSINESS_CASE, submissionId: '16cbb772-776f-4da6-b347-26468f9bba84' })
const narrative = { summary: 'A proposal draft can support the consulting workflow.', proposal: 'Test a draft with account managers reviewing the output.', assumptions: ['Confirm where meeting notes are stored.'] }
beforeEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); state.budget.mockReset(); state.budget.mockResolvedValue(true) })
describe('sprint narrative grounding', () => {
  it('keeps a useful deterministic result without credentials or cost allowance', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '')
    expect(await enrichSprintNarrative(brief)).toBe(brief); expect(state.budget).not.toHaveBeenCalled()
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key'); state.budget.mockResolvedValue(false)
    expect(await enrichSprintNarrative(brief)).toBe(brief)
  })
  it('keeps the deterministic brief when budget admission fails', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    state.budget.mockRejectedValue(new Error('budget unavailable'))
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
    expect(await enrichSprintNarrative(brief)).toBe(brief)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('generates only bounded proposal prose and strips identity-like tokens from free text', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(narrative) } }] }) }); vi.stubGlobal('fetch', fetch)
    const result = await enrichSprintNarrative({ ...brief, answers: { ...brief.answers, outcome: 'Make proposals. Email secret@example.com. https://private.example.com' } })
    expect(result.narrative).toEqual(narrative)
    const payload = JSON.parse(fetch.mock.calls[0][1].body)
    expect(payload.provider).toMatchObject({ data_collection: 'deny', zdr: true })
    expect(payload.messages[1].content).not.toContain('secret@example.com'); expect(payload.messages[1].content).not.toContain('private.example.com')
    expect(payload.messages[0].content).toContain('untrusted data')
  })
  it('falls back on timeout, malformed JSON, schema mismatch and fabricated numerical claims', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key')
    for (const content of ['bad json', JSON.stringify({ summary: 'Missing fields' }), JSON.stringify({ ...narrative, proposal: 'Save 90% of work.' })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content } }] }) }))
      expect(await enrichSprintNarrative(brief)).toBe(brief)
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    expect(await enrichSprintNarrative(brief)).toBe(brief)
  })
})
