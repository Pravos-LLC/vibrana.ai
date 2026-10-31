import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// The route talks to Supabase and Resend. Both are mocked so this test never touches
// the production database or sends email. whitepaper_leads is an in-memory table with
// the real UNIQUE(email) constraint and Postgres-like row semantics: each statement
// (upsert, conditional update) applies atomically, but every call yields an async hop
// first so concurrent requests genuinely interleave.
type Row = { email: string; source: string | null; whitepaper_sent: boolean }
const table: Row[] = []
const emails: { to: string; subject: string; html: string }[] = []
let sendFails = false

const hop = () => new Promise((resolve) => setTimeout(resolve, 5))

vi.mock('@/lib/supabase', () => {
  const from = () => ({
    // Plain lookup, kept so a check-then-send implementation can be exercised by the
    // concurrency test (the claim-based route doesn't read before writing).
    select: () => ({
      eq: (_col: string, email: string) => ({
        maybeSingle: async () => {
          await hop()
          const hit = table.find((r) => r.email === email)
          return { data: hit ? { ...hit } : null, error: null }
        },
      }),
    }),
    upsert: async (row: { email: string; source: string }, opts: { ignoreDuplicates?: boolean }) => {
      await hop()
      const hit = table.find((r) => r.email === row.email)
      if (hit && !opts.ignoreDuplicates) Object.assign(hit, row)
      if (!hit) table.push({ email: row.email, source: row.source, whitepaper_sent: false })
      return { error: null }
    },
    update: (patch: Partial<Row>) => {
      const filters: [keyof Row, unknown][] = []
      const run = async () => {
        await hop()
        const hits = table.filter((r) => filters.every(([col, value]) => r[col] === value))
        hits.forEach((r) => Object.assign(r, patch))
        return { data: hits.map((r) => ({ email: r.email })), error: null }
      }
      const chain = {
        eq: (col: keyof Row, value: unknown) => {
          filters.push([col, value])
          return chain
        },
        select: () => run(),
        then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject),
      }
      return chain
    },
  })
  return { supabase: { from } }
})

vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'hello@vibrana.ai',
  sendEmailWithRetry: async (message: { to: string; subject: string; html: string }) => {
    await hop()
    if (sendFails) return { data: null, error: { message: 'boom', name: 'sdk_error' } }
    emails.push(message)
    return { data: { id: 'email-1' }, error: null }
  },
}))

process.env.RESEND_API_KEY = 're_test'
process.env.NEXT_PUBLIC_APP_URL = 'http://127.0.0.1:3002'
const { POST } = await import('@/app/api/whitepaper/route')

function post(body: unknown) {
  return POST(new NextRequest('http://localhost/api/whitepaper', { method: 'POST', body: JSON.stringify(body) }))
}

describe('POST /api/whitepaper', () => {
  beforeEach(() => {
    table.length = 0
    emails.length = 0
    sendFails = false
  })

  it.each([{}, { email: '' }, { email: 'not-an-email' }, { email: 42 }, { email: `${'a'.repeat(250)}@x.io` }])(
    'rejects an invalid email %# with 400 and saves nothing',
    async (body) => {
      const response = await post(body)
      expect(response.status).toBe(400)
      expect(table).toHaveLength(0)
      expect(emails).toHaveLength(0)
    },
  )

  it('saves the lead, sends the PDF link, and marks it sent', async () => {
    const response = await post({ email: ' Ada@Example.com ', source: 'assessment-results' })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(table).toEqual([{ email: 'ada@example.com', source: 'assessment-results', whitepaper_sent: true }])
    expect(emails).toHaveLength(1)
    expect(emails[0].to).toBe('ada@example.com')
    expect(emails[0].html).toContain('http://127.0.0.1:3002/downloads/public-demo-guide.txt')
    expect(emails[0].html).toContain('Public demo download')
    expect(emails[0].html).toContain('Use independent local services and synthetic data for this public demo.')
  })

  it('treats a repeat request as a no-op with an identical response: one row, one email', async () => {
    const first = await post({ email: 'ada@example.com', source: 'assessment-results' })
    const again = await post({ email: 'ADA@example.com', source: 'assessment-results' })

    expect(again.status).toBe(200)
    expect(await again.json()).toEqual(await first.json())
    expect(table).toHaveLength(1)
    expect(emails).toHaveLength(1)
  })

  it('sends exactly one email when many first requests for the same address arrive at once', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => post({ email: 'ada@example.com', source: 'assessment-results' })),
    )

    expect(responses.map((r) => r.status)).toEqual(Array(10).fill(200))
    expect(table).toHaveLength(1)
    expect(table[0].whitepaper_sent).toBe(true)
    expect(emails).toHaveLength(1)
  })

  it('releases the claim when the send fails, with the same response, and the next request retries', async () => {
    sendFails = true
    const failed = await post({ email: 'ada@example.com' })

    expect(failed.status).toBe(200)
    expect(await failed.json()).toEqual({ success: true })
    expect(table).toEqual([{ email: 'ada@example.com', source: 'website', whitepaper_sent: false }])

    sendFails = false
    await post({ email: 'ada@example.com' })
    expect(table).toHaveLength(1)
    expect(table[0].whitepaper_sent).toBe(true)
    expect(emails).toHaveLength(1)
  })

  it('never renders request input into the email HTML', async () => {
    await post({ email: 'ada@example.com', source: '<script>alert(1)</script>' })

    expect(emails[0].html).not.toContain('<script>')
    expect(emails[0].html).not.toContain('ada@example.com')
    // Non-assessment sources get the generic email without the report note.
    expect(emails[0].html).not.toContain('AI Readiness Report')
  })
})
