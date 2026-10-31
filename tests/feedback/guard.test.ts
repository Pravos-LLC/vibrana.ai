import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Runs the REAL form guard with a secret set, so the token, min-fill and rate-limit layers are live.
// Supabase and Resend are mocked: nothing here touches a database or sends mail.
const inserts: Record<string, unknown>[] = []
let rpcAllowed = true
let rpcFailKey: string | null = null

vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ insert: async (row: Record<string, unknown>) => (inserts.push(row), { error: null }) }) },
}))
vi.mock('@/lib/resend', () => ({ FROM_EMAIL: 'x@example.test', sendEmail: async () => ({ data: { id: 'e' }, error: null }) }))
// The guard's rate-limit client calls supabase.rpc('form_rate_limit_hit', { p_bucket }).
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (_fn: string, args: { p_bucket: string }) => ({
      data: rpcFailKey && args.p_bucket.includes(rpcFailKey) ? false : rpcAllowed,
      error: null,
    }),
  }),
}))

const { POST } = await import('@/app/api/feedback/route')
const { issueFormToken } = await import('@/lib/form-guard/server')

const id = '3f2b9c1e-8a4d-4c57-9f01-2b6e7a1d5c90'
const answers = { overall: 9, went_well: 'Saved us a day a week.' }

function post(extra: Record<string, unknown>) {
  return POST(
    new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ slug: 'sample-feedback', submissionId: id, answers, ...extra }),
      headers: { 'x-real-ip': '203.0.113.9' },
    }),
  )
}

describe('feedback route with the form guard live', () => {
  beforeEach(() => {
    vi.stubEnv('FORM_GUARD_SECRET', 'test-secret')
    vi.stubEnv('SUPABASE_URL', 'http://localhost:1')
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'fake')
    vi.stubEnv('FEEDBACK_NOTIFY_EMAIL', '')
    vi.useFakeTimers({ toFake: ['Date'] })
    inserts.length = 0
    rpcAllowed = true
    rpcFailKey = null
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('REGRESSION: a missing token is NOT reported as a save, so the form keeps the draft', async () => {
    const res = await post({})
    const body = await res.json()
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(body.saved).not.toBe(true)
    expect(body.success).not.toBe(true)
    expect(body.error).toEqual(expect.any(String))
    expect(inserts).toHaveLength(0)
  })

  it('REGRESSION: a too-fast submit is a retryable error, and the same answers save once the token has aged', async () => {
    const token = issueFormToken()!
    const early = await post({ _ft: token })
    expect(early.status).toBe(503)
    expect((await early.json()).retryable).toBe(true)
    expect(inserts).toHaveLength(0)

    vi.setSystemTime(Date.now() + 10_000)
    const retry = await post({ _ft: token })
    expect(retry.status).toBe(200)
    expect((await retry.json()).saved).toBe(true)
    expect(inserts).toHaveLength(1)
  })

  it('a forged token is a retryable error and saves nothing', async () => {
    const res = await post({ _ft: 'v1.1700000000000.abcdefghijkl.forged' })
    expect(res.status).toBe(503)
    expect(inserts).toHaveLength(0)
  })

  it('an expired token asks for a refresh with a visible 400', async () => {
    const token = issueFormToken()!
    vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000)
    const res = await post({ _ft: token })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/refresh/i)
    expect(inserts).toHaveLength(0)
  })

  it('an over-limit IP gets a visible 429, never a fake success', async () => {
    const token = issueFormToken()!
    vi.setSystemTime(Date.now() + 10_000)
    rpcFailKey = 'client-feedback:ip:'
    const res = await post({ _ft: token })
    expect(res.status).toBe(429)
    expect((await res.json()).saved).not.toBe(true)
    expect(inserts).toHaveLength(0)
  })

  it('an over-limit token is a retryable error, never a fake success', async () => {
    const token = issueFormToken()!
    vi.setSystemTime(Date.now() + 10_000)
    rpcFailKey = 'client-feedback:token:'
    const res = await post({ _ft: token })
    expect(res.status).toBe(503)
    expect((await res.json()).saved).not.toBe(true)
    expect(inserts).toHaveLength(0)
  })

  it('a filled honeypot is still a silent success for the bot, with nothing saved and no saved flag', async () => {
    const token = issueFormToken()!
    vi.setSystemTime(Date.now() + 10_000)
    const res = await post({ _ft: token, _gotcha: 'bot' })
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.saved).not.toBe(true)
    expect(inserts).toHaveLength(0)
  })

  it('a crafted request with a score under 8 and a consent block is rejected and saves nothing', async () => {
    const token = issueFormToken()!
    vi.setSystemTime(Date.now() + 10_000)
    const { SAMPLE_FEEDBACK_FORM: form } = await import('@/src/feedback-content')
    const res = await post({ _ft: token, answers: { overall: 6 }, consent: { version: form.consent.version, anonymous_quote: true } })
    expect(res.status).toBe(400)
    expect(inserts).toHaveLength(0)
  })
})
