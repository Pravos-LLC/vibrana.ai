import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route talks to Supabase and Resend. Both are mocked so this test never touches
// the production database or sends email.
const inserts: Record<string, unknown>[] = []
const emails: { to: string; subject: string; html: string }[] = []

vi.mock('@/lib/supabase', () => {
  const from = (table: string) => ({
    upsert: () => ({ select: () => ({ single: async () => ({ data: { id: 'company-1' }, error: null }) }) }),
    insert: (row: Record<string, unknown>) => {
      inserts.push({ table, ...row })
      return { select: () => ({ single: async () => ({ data: { id: 'inquiry-1' }, error: null }) }) }
    },
  })
  return { supabase: { from } }
})

vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'hello@vibrana.ai',
  sendEmail: async (message: { to: string; subject: string; html: string }) => {
    emails.push(message)
    return { error: null }
  },
}))

const { POST } = await import('@/app/api/sprint-inquiries/route')

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/sprint-inquiries', { method: 'POST', body: JSON.stringify(body) }))
}

const fitCall = {
  name: 'Ada Founder',
  email: 'Ada@Example.com',
  companyName: 'Example Labs',
  track: 'people',
  desiredOutcome: 'Managers run their weekly reporting with AI.',
  botField: '',
  utm_source: 'linkedin',
  utm_campaign: 'sprint-test',
}

describe('POST /api/sprint-inquiries', () => {
  beforeEach(() => {
    inserts.length = 0
    emails.length = 0
  })

  it('saves a fit-call request with attribution and sends both emails', async () => {
    const response = await post(fitCall)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, inquiryId: 'inquiry-1' })
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({
      table: 'engagement_inquiries',
      email: 'ada@example.com',
      intent: 'ai_build_sprint',
      track: 'people',
      department_focus: 'AI people and culture',
      timeline: 'Not collected',
      role: null,
      source: 'linkedin',
      goals: fitCall.desiredOutcome,
    })
    expect(inserts[0].metadata).toMatchObject({ utm_source: 'linkedin', utm_campaign: 'sprint-test', form_version: 'fit-call-v1', entry_point: 'sprint' })
    expect(emails.map((email) => email.subject)).toEqual([
      '[Sprint fit call: People & culture sprint] Ada Founder at Example Labs',
      'Your Vibrana fit-call request is in',
    ])
    expect(emails[1].html).toContain('https://calendar.app.google/2DswLVndhkpMVx7K7')
  })

  it('records the front door the form sent, falling back to sprint for an unknown one', async () => {
    await post({ ...fitCall, entry: 'email' })
    await post({ ...fitCall, entry: 'nowhere' })
    expect(inserts.map((row) => (row.metadata as { entry_point: string }).entry_point)).toEqual(['email', 'sprint'])
  })

  it('keeps the original department_focus values for product and workflow', async () => {
    await post({ ...fitCall, track: 'product' })
    await post({ ...fitCall, track: 'workflow' })

    expect(inserts.map((row) => row.department_focus)).toEqual(['AI product build', 'AI workflow build'])
  })

  it('still stores the retired application fields when an old client sends them', async () => {
    await post({ ...fitCall, track: 'workflow', role: 'COO', internalOwner: 'Mina', startWindow: '30-60-days', budgetBand: '25-50k', faxNumber: '' })

    expect(inserts[0]).toMatchObject({ role: 'COO', timeline: '30-60-days' })
    expect(inserts[0].metadata).toMatchObject({ internal_owner: 'Mina', start_window: '30-60-days', budget_band: '25-50k' })
  })

  it('rejects a bot that fills the honeypot without saving or emailing', async () => {
    const response = await post({ ...fitCall, botField: 'http://spam.example' })

    expect(response.status).toBe(400)
    expect(inserts).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('escapes user input in the admin email', async () => {
    await post({ ...fitCall, name: '<script>x</script>' })

    expect(emails[0].html).not.toContain('<script>')
  })
})
