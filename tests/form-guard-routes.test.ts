import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, ok } from './helpers/fake-supabase'

// The spam guard on every public write endpoint. Supabase, Resend and the rate-limit
// RPC are faked. The real guard, token signing and validation run. Bots get the normal
// success response with nothing saved, mailed or scraped.
process.env.RESEND_API_KEY = 're_test_placeholder'
process.env.OPENROUTER_API_KEY = 'sk-or-test'
process.env.FIRECRAWL_API_KEY = 'fc-test'
process.env.ADMIN_EMAIL = 'admin@vibrana.test'

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: () => {},
}))
vi.mock('@/lib/supabase', async () => ({ supabase: (await import('./helpers/fake-supabase')).db.client }))

const sent = vi.hoisted(() => [] as { to: string }[])
vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: async (message: { to: string }) => {
        sent.push(message)
        return { data: { id: 'resend-1' }, error: null }
      },
    }
  },
}))
vi.mock('@/lib/resend', () => ({
  FROM_EMAIL: 'Vibrana <hello@vibrana.ai>',
  sendEmail: async (message: { to: string }) => {
    sent.push(message)
    return { data: { id: 'email-1' }, error: null }
  },
  sendEmailWithRetry: async (message: { to: string }) => {
    sent.push(message)
    return { data: { id: 'email-1' }, error: null }
  },
}))
vi.mock('@/lib/whitepaper-email', () => ({
  sendWhitepaperEmail: async (to: string) => {
    sent.push({ to })
    return true
  },
}))

// Fake rate-limit RPC: counts hits per bucket and answers like public.form_rate_limit_hit.
const hits = vi.hoisted(() => new Map<string, number>())
const rpcDown = vi.hoisted(() => ({ value: false }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (_name: string, args: { p_bucket: string; p_max: number }) => {
      if (rpcDown.value) return { data: null, error: { message: 'function does not exist' } }
      const n = (hits.get(args.p_bucket) ?? 0) + 1
      hits.set(args.p_bucket, n)
      return { data: n <= args.p_max, error: null }
    },
  }),
}))

const { issueFormToken } = await import('@/lib/form-guard/server')
const whitepaper = await import('@/app/api/whitepaper/route')
const leads = await import('@/app/api/assessment-leads/route')
const analyze = await import('@/app/api/analyze-company/route')
const assessments = await import('@/app/api/assessments/route')
const enterprise = await import('@/app/api/enterprise-inquiry/route')
const sprint = await import('@/app/api/sprint-inquiries/route')
const formToken = await import('@/app/api/form-token/route')

type Handler = (req: NextRequest) => Promise<Response>
function post(handler: Handler, path: string, body: unknown, headers: Record<string, string> = {}) {
  return handler(new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body), headers }))
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  process.env.FORM_GUARD_SECRET = 'test-secret'
  process.env.SUPABASE_URL = 'https://vibrana.test'
  process.env.SUPABASE_SERVICE_KEY = 'service-key'
  process.env.FORM_GUARD_MIN_FILL_MS = '0'
  db.reset()
  db.respond = (q) => (q.single || q.table === 'companies' ? ok({ id: 'row-1' }) : ok([{ id: 'row-1' }]))
  sent.length = 0
  hits.clear()
  rpcDown.value = false
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})

const token = () => issueFormToken()!
const answers = { l_owner: 70, l_in_use: 100, d_digital: 40, d_quality: 70, t_ai_tool: 70, ta_access: 40, g_policy: 0, c_weekly: 100 }

const endpoints: {
  name: string
  handler: Handler
  path: string
  body: () => Record<string, unknown>
  /** What a dropped bot must get back, so it can't tell it was dropped. */
  status: number
}[] = [
  { name: 'whitepaper', handler: whitepaper.POST, path: '/api/whitepaper', status: 200, body: () => ({ email: 'ada@example.com' }) },
  { name: 'assessment-leads', handler: leads.POST, path: '/api/assessment-leads', status: 200, body: () => ({ email: 'ada@example.com' }) },
  { name: 'analyze-company', handler: analyze.POST, path: '/api/analyze-company', status: 200, body: () => ({ website: 'https://acme.test' }) },
  {
    name: 'assessments',
    handler: assessments.POST,
    path: '/api/assessments',
    status: 200,
    body: () => ({ companyData: { name: 'Acme', website: 'https://acme.test', email: 'cto@acme.test' }, answers }),
  },
  {
    name: 'enterprise-inquiry',
    handler: enterprise.POST,
    path: '/api/enterprise-inquiry',
    status: 200,
    body: () => ({
      contactName: 'Grace',
      email: 'grace@example.com',
      companyName: 'Example Co',
      teamSize: '50-200',
      revenueBand: '$10-50M',
      departmentFocus: 'finance',
      timeline: 'This quarter',
      goals: 'Put agents into our weekly finance close without breaking audit.',
    }),
  },
  {
    name: 'company-brain-lab',
    handler: enterprise.POST,
    path: '/api/enterprise-inquiry',
    status: 200,
    body: () => ({
      intent: 'Company Brain Lab founding cohort',
      contactName: 'Grace',
      email: 'grace@example.com',
      companyName: 'Example Co',
      teamSize: '50–99',
      implementationOwner: 'Ada, Head of Operations',
      workflow: 'Quote-to-cash, from signed order to first invoice.',
      importance: 'Quote turnaround drops from two days to two hours.',
      access: 'CRM, billing system, and the ops lead who runs the handoff.',
      commitment: 'Founder 2 hours a week, owner 8 hours a week',
    }),
  },
  {
    name: 'sprint-inquiries',
    handler: sprint.POST,
    path: '/api/sprint-inquiries',
    status: 200,
    body: () => ({
      name: 'Ada',
      email: 'ada@example.com',
      companyName: 'Acme',
      track: 'workflow',
      desiredOutcome: 'Quote turnaround drops from two days to two hours.',
    }),
  },
]

describe.each(endpoints)('$name guard', ({ handler, path, body, status }) => {
  const expectNothingHappened = () => {
    expect(db.calls.filter((c) => c.op !== 'select')).toHaveLength(0)
    expect(sent).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  }

  it('drops a filled honeypot with the normal response and does nothing', async () => {
    const response = await post(handler, path, { ...body(), _gotcha: 'http://spam.example', _ft: token() })
    expect(response.status).toBe(status)
    expectNothingHappened()
  })

  it('drops a request with no render token', async () => {
    const response = await post(handler, path, body())
    expect(response.status).toBe(status)
    expectNothingHappened()
  })

  it('drops a forged render token', async () => {
    const response = await post(handler, path, { ...body(), _ft: `v1.${Date.now() - 60_000}.abcdefghijkl.forged` })
    expect(response.status).toBe(status)
    expectNothingHappened()
  })

  it('drops a submit faster than the minimum fill time', async () => {
    process.env.FORM_GUARD_MIN_FILL_MS = '600000'
    const response = await post(handler, path, { ...body(), _ft: token() })
    expect(response.status).toBe(status)
    expectNothingHappened()
  })
})

describe('what a real visitor gets', () => {
  it('whitepaper: saves the lead and mails the address once, normalized', async () => {
    const response = await post(whitepaper.POST, '/api/whitepaper', { email: '  Ada@Example.COM ', _gotcha: '', _ft: token() })
    expect(response.status).toBe(200)
    expect(db.find('whitepaper_leads', 'upsert')[0].payload).toMatchObject({ email: 'ada@example.com' })
    expect(sent.map((m) => m.to)).toEqual(['ada@example.com'])
  })

  it.each(['ada@', 'ada@example', 'a b@example.com', 'ada@example..com', '<script>@example.com'])(
    'rejects the invalid address %s with 400 and stores nothing',
    async (email) => {
      const response = await post(whitepaper.POST, '/api/whitepaper', { email, _ft: token() })
      expect(response.status).toBe(400)
      expect(db.calls).toHaveLength(0)
      expect(sent).toHaveLength(0)
    },
  )

  it('enterprise inquiry: an over-long email is a 400, not a stored row', async () => {
    const body = endpoints.find((e) => e.name === 'enterprise-inquiry')!.body()
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', { ...body, email: `${'a'.repeat(70)}@example.com`, _ft: token() })
    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('enterprise inquiry: stores a lowercased address and emails it', async () => {
    const body = endpoints.find((e) => e.name === 'enterprise-inquiry')!.body()
    const response = await post(enterprise.POST, '/api/enterprise-inquiry', { ...body, email: ' Grace@Example.com ', _ft: token() })
    expect(response.status).toBe(200)
    expect(db.find('engagement_inquiries', 'insert')[0].payload).toMatchObject({ email: 'grace@example.com' })
    expect(sent.map((m) => m.to)).toContain('grace@example.com')
  })

  it('sprint inquiry: a valid submit is saved and the confirmation goes to the normalized address', async () => {
    const body = endpoints.find((e) => e.name === 'sprint-inquiries')!.body()
    const response = await post(sprint.POST, '/api/sprint-inquiries', { ...body, email: 'Ada@Example.com', _ft: token() })
    expect(response.status).toBe(200)
    expect(sent.map((m) => m.to)).toContain('ada@example.com')
  })

  it('sprint inquiry: the existing honeypot still returns a visible 400', async () => {
    const body = endpoints.find((e) => e.name === 'sprint-inquiries')!.body()
    const response = await post(sprint.POST, '/api/sprint-inquiries', { ...body, botField: 'x', _ft: token() })
    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('assessment: a dropped bot still gets a plausible report, with no id, save or email', async () => {
    const body = endpoints.find((e) => e.name === 'assessments')!.body()
    const response = await post(assessments.POST, '/api/assessments', { ...body, _gotcha: 'x', _ft: token() })
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.report.overallScore).toEqual(expect.any(Number))
    expect(json.assessmentId).toBeUndefined()
    expect(db.calls).toHaveLength(0)
    expect(sent).toHaveLength(0)
  })

  it('assessment: a real submit saves the normalized address', async () => {
    const body = endpoints.find((e) => e.name === 'assessments')!.body()
    const companyData = { name: ' Acme ', website: 'https://acme.test', email: ' CTO@Acme.test ' }
    await post(assessments.POST, '/api/assessments', { ...body, companyData, _ft: token() })
    expect(db.find('assessments', 'insert')[0].payload).toMatchObject({ email: 'cto@acme.test', company_name: 'Acme' })
  })

  it('an expired token is a visible 400 so a real visitor can refresh', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const stale = token()
      vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000)
      const response = await post(whitepaper.POST, '/api/whitepaper', { email: 'ada@example.com', _ft: stale })
      expect(response.status).toBe(400)
      expect((await response.json()).error).toMatch(/expired/i)
      expect(sent).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('rate limits', () => {
  it('stops mailing one address after its daily cap, without telling the sender', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      // A fresh token each time so only the email bucket can trip.
      const response = await post(assessments.POST, '/api/assessments', {
        ...endpoints.find((e) => e.name === 'assessments')!.body(),
        _ft: token(),
      }, { 'x-forwarded-for': `203.0.113.${i}` })
      statuses.push(response.status)
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 200])
    expect(db.find('assessments', 'insert')).toHaveLength(4)
  })

  it('counts name+1@ and name+2@ as one inbox', async () => {
    for (let i = 0; i < 4; i++) {
      await post(whitepaper.POST, '/api/whitepaper', { email: `ada+${i}@example.com`, _ft: token() }, { 'x-forwarded-for': `203.0.113.${i}` })
    }
    // Whitepaper caps one inbox at 2 a day: only the first two plus-variants were mailed.
    expect(sent).toHaveLength(2)
  })

  it('answers 429 once one network passes its hourly cap', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      const response = await post(
        whitepaper.POST,
        '/api/whitepaper',
        { email: `person${i}@example.com`, _ft: token() },
        { 'x-forwarded-for': '198.51.100.7' },
      )
      statuses.push(response.status)
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true)
    expect(statuses.slice(10)).toEqual([429, 429])
  })

  it('fails open when the rate-limit function is missing', async () => {
    rpcDown.value = true
    const response = await post(whitepaper.POST, '/api/whitepaper', { email: 'ada@example.com', _ft: token() })
    expect(response.status).toBe(200)
    expect(sent.map((m) => m.to)).toEqual(['ada@example.com'])
  })

  it('never puts a raw IP or email into a bucket name', async () => {
    await post(whitepaper.POST, '/api/whitepaper', { email: 'ada@example.com', _ft: token() }, { 'x-forwarded-for': '198.51.100.9' })
    const buckets = [...hits.keys()].join('\n')
    expect(buckets).toContain('whitepaper:email:')
    expect(buckets).not.toContain('ada@example.com')
    expect(buckets).not.toContain('198.51.100.9')
  })
})

describe('GET /api/form-token', () => {
  it('issues a signed token and never caches it', async () => {
    const response = await formToken.GET()
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect((await response.json()).token).toMatch(/^v1\.\d+\.[\w-]+\.[\w-]+$/)
  })

  it('is unavailable rather than unsigned when no secret exists', async () => {
    process.env.FORM_GUARD_SECRET = ''
    process.env.SUPABASE_SERVICE_KEY = ''
    expect((await formToken.GET()).status).toBe(503)
  })
})
