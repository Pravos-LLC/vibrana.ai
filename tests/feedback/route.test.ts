import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Supabase and Resend are mocked: this suite never touches a database or sends mail.
const inserts: { table: string; row: Record<string, unknown> }[] = []
const emails: { to: string; subject: string; html: string; text?: string }[] = []
let insertError: { code?: string; message: string } | null = null
let emailBehavior: 'ok' | 'error' | 'throw' = 'ok'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        inserts.push({ table, row })
        return { error: insertError }
      },
    }),
  },
}))

vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'hello@vibrana.ai',
  sendEmail: async (message: { to: string; subject: string; html: string }) => {
    if (emailBehavior === 'throw') throw new Error('resend down')
    if (emailBehavior === 'error') return { data: null, error: { message: 'bad key', name: 'x' } }
    emails.push(message)
    return { data: { id: 'e1' }, error: null }
  },
}))

const { POST } = await import('@/app/api/feedback/route')
const { SAMPLEB544654A4D1A_PST_FORM: form } = await import('@/src/feedback-content')
const { tokenFor } = await import('@/lib/feedback/recipients')
const REVIEWERONE = tokenFor('sample-feedback', 'ReviewerOne')!

const id = '3f2b9c1e-8a4d-4c57-9f01-2b6e7a1d5c90'
const flags = (value: boolean) => ({ anonymous_quote: value, named_quote: false, include_company: value, case_study: value, promote: false, testimonial_chat: false })

function post(body: unknown, raw?: string) {
  return POST(
    new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: raw ?? JSON.stringify(body),
      headers: { 'user-agent': 'vitest-agent' },
    }),
  )
}

const base = (score: number, extra: Record<string, unknown> = {}) => ({
  slug: 'sample-feedback',
  submissionId: id,
  r: REVIEWERONE,
  answers: { overall: score, went_well: 'It saves us hours.' },
  ...extra,
})

describe('POST /api/feedback', () => {
  beforeEach(() => {
    inserts.length = 0
    emails.length = 0
    insertError = null
    emailBehavior = 'ok'
    process.env.FEEDBACK_NOTIFY_EMAIL = 'notify@example.test'
    delete process.env.ADMIN_EMAIL
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('saves a high score with consent, the wording snapshot and hashed user agent, then emails', async () => {
    const res = await post(
      base(9, { consent: { version: form.consent.version, flags: flags(true), draftQuote: true, referrals: 'Their COO' } }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, saved: true })

    expect(inserts).toHaveLength(1)
    const { table, row } = inserts[0]
    expect(table).toBe('client_feedback')
    expect(row).toMatchObject({
      id,
      slug: 'sample-feedback',
      respondent_token: REVIEWERONE,
      respondent_name: 'ReviewerOne',
      overall_score: 9,
      consent_text_version: form.consent.version,
    })
    expect(row.consent).toEqual(flags(true))
    expect(row.consent_text_snapshot).toContain('You may quote me anonymously')
    expect(row.consent_at).toEqual(expect.any(String))
    expect(row.answers).toMatchObject({ overall: 9, follow_up: { draft_quote_requested: true, who_else: 'Their COO' } })
    expect(typeof row.user_agent_hash).toBe('string')
    expect(JSON.stringify(row)).not.toContain('vitest-agent')

    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe('notify@example.test')
    expect(emails[0].subject).toBe('Sampleb544654a4d1a feedback from ReviewerOne: 9/10, case study OK')
    expect(emails[0].html).toContain('It saves us hours.')
  })

  it('rejects a crafted request that carries consent with a score below 8, and saves nothing', async () => {
    const res = await post(base(6, { consent: { version: form.consent.version, flags: flags(true), draftQuote: true, referrals: 'x' } }))
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('saves a low score with no consent fields at all and a plain subject', async () => {
    const res = await post(base(6))
    expect(res.status).toBe(200)
    const { row } = inserts[0]
    expect(row.consent).toBeNull()
    expect(row.consent_text_version).toBeNull()
    expect(row.consent_text_snapshot).toBeNull()
    expect(row.consent_at).toBeNull()
    expect(emails[0].subject).toBe('Sampleb544654a4d1a feedback from ReviewerOne: 6/10')
  })

  it('stores an unticked consent screen without a consent timestamp', async () => {
    await post(base(10, { consent: { version: form.consent.version, flags: flags(false) } }))
    const { row } = inserts[0]
    expect(row.consent).toEqual(flags(false))
    expect(row.consent_at).toBeNull()
    expect(row.consent_text_snapshot).toEqual(expect.any(String))
  })

  it('rejects consent given under outdated wording and saves nothing', async () => {
    const res = await post(base(9, { consent: { version: 'old', flags: flags(true) } }))
    expect(res.status).toBe(409)
    expect(inserts).toHaveLength(0)
  })

  it('treats an unknown token as anonymous and stores nothing from it', async () => {
    await post(base(8, { r: 'stranger' }))
    expect(inserts[0].row).toMatchObject({ respondent_token: null, respondent_name: null })
    expect(emails[0].subject).toContain('anonymous respondent')
  })

  it('returns 400 for invalid answers, 400 for bad JSON, 404 for an unknown form, 413 for an oversized body', async () => {
    expect((await post(base(12))).status).toBe(400)
    expect((await post(null, '{nope')).status).toBe(400)
    expect((await post({ ...base(9), slug: 'nope' })).status).toBe(404)
    expect((await post(null, JSON.stringify({ pad: 'x'.repeat(40_000) }))).status).toBe(413)
    expect(inserts).toHaveLength(0)
  })

  it('silently drops a filled honeypot: success, nothing saved, no email', async () => {
    const res = await post({ ...base(9), _gotcha: 'bot@spam.test' })
    expect(await res.json()).toEqual({ success: true })
    expect(inserts).toHaveLength(0)
    expect(emails).toHaveLength(0)
  })

  it('surfaces a failed database write so the form can retry, and sends no email', async () => {
    insertError = { code: '42P01', message: 'relation does not exist' }
    const res = await post(base(9))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/could not save/i)
    expect(emails).toHaveLength(0)
  })

  it('treats a duplicate id as already saved and does not email twice', async () => {
    insertError = { code: '23505', message: 'duplicate key' }
    const res = await post(base(9))
    expect(res.status).toBe(200)
    expect(emails).toHaveLength(0)
  })

  it.each(['error', 'throw'] as const)('keeps the saved row and reports success when the email %s', async (behavior) => {
    emailBehavior = behavior
    const res = await post(base(9))
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(1)
  })

  it('saves without email when no notify address is configured', async () => {
    delete process.env.FEEDBACK_NOTIFY_EMAIL
    const res = await post(base(9))
    expect(res.status).toBe(200)
    expect(inserts).toHaveLength(1)
    expect(emails).toHaveLength(0)
  })
})
