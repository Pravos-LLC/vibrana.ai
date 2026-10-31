import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { EMPTY_BUSINESS_CASE } from '@/src/lib/sprint-brief'

const state = vi.hoisted(() => ({ rows: new Map<string, Record<string, unknown>>(), emails: [] as {to:string}[], guard: 'allow', failInsert: false, failEmail: false }))
vi.mock('@/lib/form-guard/server', () => ({ FORM_GUARDS: { sprintInquiries: {} }, guardFieldsFromBody: () => ({}), guardSubmission: async () => ({ action: state.guard }) }))
vi.mock('@/src/lib/simulator/server/db', () => ({ getCachedProfile: async () => null }))
vi.mock('@/src/lib/sprint-fit/narrative', () => ({ enrichSprintNarrative: async (brief: unknown) => brief }))
vi.mock('@/lib/resend', () => ({ FROM_EMAIL: 'hello@vibrana.ai', sendEmail: async (message: {to:string}) => { state.emails.push(message); return { error: state.failEmail ? { message: 'unavailable' } : null } } }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => {
  if (table === 'companies') return { upsert: () => ({ select: () => ({ single: async () => ({ data: { id: 'company-1' }, error: null }) }) }) }
  return {
    select: () => {
      const filters: Record<string, unknown> = {}
      const query = { eq: (key: string, value: unknown) => { filters[key] = value; return query }, maybeSingle: async () => {
        const row = state.rows.get(String(filters.id)); return { data: row && row.email === filters.email ? row : null, error: null }
      } }; return query
    },
    insert: (row: Record<string, unknown>) => ({ select: () => ({ single: async () => {
      if (state.failInsert) return { data: null, error: { code: 'connection_error' } }
      const id = String(row.id)
      if (state.rows.has(id)) return { data: null, error: { code: '23505' } }
      state.rows.set(id, row); return { data: { id }, error: null }
    } }) }),
    update: (values: Record<string, unknown>) => {
      const filters: Record<string, unknown> = {}
      const query = { eq: (key: string, value: unknown) => { filters[key] = value; if (key === 'email') {
        const row = state.rows.get(String(filters.id)); if (row?.email === value) state.rows.set(String(filters.id), { ...row, ...values })
      }; return query }, then: (resolve: (value: {error:null}) => void) => resolve({ error: null }) }; return query
    },
  }
} } }))
const { POST } = await import('@/app/api/sprint-inquiries/route')
const input = { name: 'Ada', email: 'ada@example.com', companyName: 'Example', role: 'Founder', companyWebsite: '', track: 'product', desiredOutcome: FIT_SAMPLE.outcome, fitCheck: FIT_SAMPLE,
  briefRequest: { submissionId: '16cbb772-776f-4da6-b347-26468f9bba84', company: { name: 'Example', website: '', description: 'Professional services.', sector: 'professional-services', confirmed: true }, businessCase: { ...EMPTY_BUSINESS_CASE, tasksPerWeek: 20, minutesPerTask: 30, peoplePerTask: 1, hourlyCost: 50 } },
}
const post = (body: unknown) => POST(new NextRequest('http://localhost/api/sprint-inquiries', { method: 'POST', body: JSON.stringify(body) }))
beforeEach(() => { state.rows.clear(); state.emails.length = 0; state.guard = 'allow'; state.failInsert = false; state.failEmail = false })
describe('saved sprint brief', () => {
  it('saves the server-computed snapshot before returning a real receipt', async () => {
    const response = await post(input); const result = await response.json()
    expect(response.status).toBe(200); expect(result.inquiryId).toBeTruthy(); expect(result.emailDelivered).toBe(true)
    expect(result.brief.calculation.currentHours).toBe(10); expect(result.brief.calculation.currentCost).toBe(500)
    expect(state.rows.get(result.inquiryId)?.metadata).toMatchObject({ form_version: 'sprint-brief-v2', brief_snapshot: result.brief, email_delivered: true })
  })
  it('returns the same snapshot on retry without duplicate inquiry or emails', async () => {
    const a = await (await post(input)).json(); const b = await (await post(input)).json()
    expect(b).toEqual(a); expect(state.rows.size).toBe(1); expect(state.emails).toHaveLength(2)
  })
  it('rejects changed content using the same submission receipt', async () => {
    await post(input)
    expect((await post({ ...input, role: 'CEO' })).status).toBe(409)
    expect(state.rows.size).toBe(1)
  })
  it('allows bounded explicit email retry without resaving the inquiry', async () => {
    state.failEmail = true
    const first = await (await post(input)).json(); expect(first.emailDelivered).toBe(false); expect(first.brief).toBeTruthy()
    state.failEmail = false
    const retry = await (await post({ ...input, resendEmail: true })).json()
    expect(retry.emailDelivered).toBe(true); expect(state.rows.size).toBe(1); expect(state.emails).toHaveLength(3)
  })
  it('never unlocks a brief for a guard drop or database failure', async () => {
    state.guard = 'drop'; expect(await (await post(input)).json()).toEqual({ success: true }); expect(state.rows.size).toBe(0)
    state.guard = 'allow'; state.failInsert = true; const response = await post(input)
    expect(response.status).toBe(500); expect(await response.json()).not.toHaveProperty('brief'); expect(state.emails).toHaveLength(0)
  })
  it('rejects unsafe websites and missing contact requirements before saving', async () => {
    expect((await post({ ...input, briefRequest: { ...input.briefRequest, company: { ...input.briefRequest.company, website: 'http://127.0.0.1' } } })).status).toBe(400)
    expect((await post({ ...input, role: '' })).status).toBe(400)
    expect(state.rows.size).toBe(0)
  })
})
