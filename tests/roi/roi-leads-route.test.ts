import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, ok, type Query } from '../helpers/fake-supabase'

// "Email me this" on the Workflow ROI calculator. Supabase and Resend are faked;
// the real schema, maths and email renderer run, so escaping is checked end to end.
process.env.ADMIN_EMAIL = 'admin@vibrana.test'

vi.mock('@/lib/supabase', async () => ({ supabase: (await import('../helpers/fake-supabase')).db.client }))

const emails = vi.hoisted(() => [] as { to: string; subject: string; html: string; replyTo?: string }[])
const resendDown = vi.hoisted(() => ({ value: false }))
vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'hello@vibrana.ai',
  sendEmail: async (message: { to: string; subject: string; html: string }) => {
    if (resendDown.value && message.to !== 'admin@vibrana.test') return { data: null, error: { name: 'x', message: 'down' } }
    emails.push(message)
    return { data: { id: 'email-1' }, error: null }
  },
}))

const { POST } = await import('@/app/api/roi-leads/route')

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/roi-leads', { method: 'POST', body: JSON.stringify(body) }))
}

const valid = {
  email: 'Ada@Example.com',
  companyName: 'Example <Labs>',
  currency: 'GBP',
  weeksPerYear: 48,
  workWeekHours: 40,
  sprintCost: 7560,
  runCostPerMonth: 0,
  workflows: [{ id: 'support', people: 10, hoursPerWeek: 20, hourlyCost: 50, conservativePct: 8.5, expectedPct: 15 }],
}

const queries: Query[] = []
beforeEach(() => {
  db.reset()
  queries.length = 0
  emails.length = 0
  resendDown.value = false
  db.respond = (q) => {
    queries.push(q)
    return ok([{ id: 'lead-1' }])
  }
})

describe('POST /api/roi-leads', () => {
  it('saves the lead tagged roi-calculator and emails the recomputed estimate', async () => {
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    const upsert = queries.find((q) => q.table === 'assessment_leads' && q.op === 'upsert')
    expect(upsert?.payload).toMatchObject({ email: 'ada@example.com', company_name: 'Example <Labs>' })
    const source = queries.find((q) => q.table === 'assessment_leads' && q.op === 'update')
    expect(source?.payload).toEqual({ source: 'roi-calculator' })

    const visitor = emails.find((e) => e.to === 'ada@example.com')!
    expect(visitor.subject).toBe('Your workflow estimate from Vibrana')
    // 10 x 20 x 48 = 9,600 h; 816 to 1,440 hours; £40,800 to £72,000
    expect(visitor.html).toContain('820 to 1,400 hours')
    expect(visitor.html).toContain('£41,000 to £72,000 a year')
    // The triage link says it came from this email, so a fit-call request through it counts as entry=email.
    expect(visitor.html).toContain('/ai-build-sprint?track=triage&amp;entry=email#fit-call')

    // One anonymous roi_lead row per estimate, whatever assessment_leads already holds for the address.
    const event = queries.find((q) => q.table === 'funnel_events' && q.op === 'insert')
    expect(event?.payload).toEqual({ event: 'roi_lead', entry_point: 'roi', location: null })

    const admin = emails.find((e) => e.to === 'admin@vibrana.test')!
    expect(admin.replyTo).toBe('ada@example.com')
    expect(admin.html).toContain('roi-calculator')
    expect(admin.html).toContain('Example &lt;Labs&gt;')
    expect(admin.html).not.toContain('Example <Labs>')
  })

  it('rejects an empty estimate, an unknown workflow and a bad email without saving', async () => {
    const empty = await post({ ...valid, workflows: [{ ...valid.workflows[0], people: 0 }] })
    expect(empty.status).toBe(400)
    const unknown = await post({ ...valid, workflows: [{ ...valid.workflows[0], id: 'payroll' }] })
    expect(unknown.status).toBe(400)
    const badEmail = await post({ ...valid, email: 'not-an-email' })
    expect(badEmail.status).toBe(400)
    const outOfRange = await post({ ...valid, workflows: [{ ...valid.workflows[0], expectedPct: 140 }] })
    expect(outOfRange.status).toBe(400)
    expect(queries).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('drops a filled honeypot silently', async () => {
    const res = await post({ ...valid, _gotcha: 'spam' })
    expect(await res.json()).toEqual({ success: true })
    expect(queries).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('tells the visitor when their email could not be sent', async () => {
    resendDown.value = true
    const res = await post(valid)
    expect(res.status).toBe(502)
  })
})
