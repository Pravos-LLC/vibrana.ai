import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, fail, ok, type Query } from './helpers/fake-supabase'

// One-click unsubscribe for the scheduled assessment follow-up emails: the signed
// token, POST /api/unsubscribe (RFC 8058 one-click and the /unsubscribe page's
// button), the Resend cancel calls for stored ids, and the rate limit. Supabase,
// Resend and the rate-limit RPC are faked; the token, guard and route run for real.
process.env.RESEND_API_KEY = 're_test_placeholder'
process.env.RESEND_ADMIN_API_KEY = 're_admin_test_placeholder'

vi.mock('@/lib/supabase', async () => ({ supabase: (await import('./helpers/fake-supabase')).db.client }))

const resendCalls = vi.hoisted(() => ({ cancel: [] as string[], get: [] as string[], cancelKeys: [] as (string | undefined)[] }))
const resendState = vi.hoisted(() => ({
  cancelError: new Set<string>(),
  lastEvent: new Map<string, string>(),
}))
vi.mock('resend', () => ({
  Resend: class {
    constructor(private key?: string) {}
    emails = {
      send: async () => ({ data: { id: 'unused' }, error: null }),
      cancel: async (id: string) => {
        resendCalls.cancel.push(id)
        resendCalls.cancelKeys.push(this.key)
        return resendState.cancelError.has(id)
          ? { data: null, error: { name: 'validation_error', message: 'cannot cancel' } }
          : { data: { object: 'email', id }, error: null }
      },
      get: async (id: string) => {
        resendCalls.get.push(id)
        return { data: { id, last_event: resendState.lastEvent.get(id) ?? 'scheduled' }, error: null }
      },
    }
  },
}))

// Fake rate-limit RPC, like tests/form-guard-routes.test.ts.
const hits = vi.hoisted(() => new Map<string, number>())
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: async (_name: string, args: { p_bucket: string; p_max: number }) => {
      const n = (hits.get(args.p_bucket) ?? 0) + 1
      hits.set(args.p_bucket, n)
      return { data: n <= args.p_max, error: null }
    },
  }),
}))

const { signUnsubscribeToken, verifyUnsubscribeToken } = await import('@/lib/unsubscribe/token')
const lib = await import('@/lib/unsubscribe')
const route = await import('@/app/api/unsubscribe/route')
const { FORM_GUARDS } = await import('@/lib/form-guard/server')

const SECRET = 'unsubscribe-test-secret'

describe('unsubscribe token', () => {
  it('round-trips the address it was signed for', () => {
    const token = signUnsubscribeToken('cto+news@acme.test', SECRET)
    expect(token).toMatch(/^u1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(verifyUnsubscribeToken(token, SECRET)).toBe('cto+news@acme.test')
  })

  it('rejects a token whose address was swapped for another one', () => {
    const [version, , sig] = signUnsubscribeToken('cto@acme.test', SECRET).split('.')
    const other = Buffer.from('ceo@acme.test').toString('base64url')
    expect(verifyUnsubscribeToken(`${version}.${other}.${sig}`, SECRET)).toBeNull()
  })

  it('rejects a changed signature, a different secret and malformed input', () => {
    const token = signUnsubscribeToken('cto@acme.test', SECRET)
    const flipped = token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')
    expect(verifyUnsubscribeToken(flipped, SECRET)).toBeNull()
    expect(verifyUnsubscribeToken(token, 'another-secret')).toBeNull()
    for (const bad of [undefined, null, 42, '', 'u1.abc', 'v1.a.b', `u2.${token.slice(3)}`, `${token}.extra`, 'u1.a b.c', 'x'.repeat(700)]) {
      expect(verifyUnsubscribeToken(bad, SECRET)).toBeNull()
    }
  })

  it('does not expire: a link must keep working while the email sits in an inbox', () => {
    vi.useFakeTimers()
    try {
      const token = signUnsubscribeToken('cto@acme.test', SECRET)
      vi.setSystemTime(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)
      expect(verifyUnsubscribeToken(token, SECRET)).toBe('cto@acme.test')
    } finally {
      vi.useRealTimers()
    }
  })
})

// --- the route --------------------------------------------------------------

type Row = { resend_id: string; email: string; status: string }

let optOuts: Map<string, string>
let scheduled: Row[]

function statefulDb() {
  db.respond = (q: Query) => {
    const emailFilter = q.filters.find(([col, op]) => col === 'email' && op === 'eq')?.[2]
    if (q.table === 'email_opt_outs') {
      if (q.op === 'upsert') {
        const { email, source } = q.payload as { email: string; source: string }
        if (!optOuts.has(email)) optOuts.set(email, source)
        return ok(null)
      }
      if (q.op === 'select') return ok(optOuts.has(emailFilter as string) ? { email: emailFilter } : null)
    }
    if (q.table === 'scheduled_emails') {
      if (q.op === 'select') {
        const status = q.filters.find(([col]) => col === 'status')?.[2]
        return ok(scheduled.filter((r) => r.email === emailFilter && r.status === status))
      }
      if (q.op === 'update') {
        const id = q.filters.find(([col]) => col === 'resend_id')?.[2]
        const row = scheduled.find((r) => r.resend_id === id)
        if (row) row.status = (q.payload as { status: string }).status
        return ok(null)
      }
    }
    return ok()
  }
}

function oneClick(token: string | null, headers: Record<string, string> = {}) {
  const url = `https://www.vibrana.ai/api/unsubscribe${token ? `?t=${token}` : ''}`
  return route.POST(new NextRequest(url, {
    method: 'POST',
    body: 'List-Unsubscribe=One-Click',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
  }))
}

function pageButton(token: string, headers: Record<string, string> = {}) {
  const body = new URLSearchParams({ t: token })
  return route.POST(new NextRequest('https://www.vibrana.ai/api/unsubscribe', {
    method: 'POST',
    body: body.toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
  }))
}

beforeEach(() => {
  process.env.UNSUBSCRIBE_SECRET = SECRET
  process.env.FORM_GUARD_SECRET = 'form-guard-secret'
  process.env.SUPABASE_URL = 'https://vibrana.test'
  process.env.SUPABASE_SERVICE_KEY = 'service-key'
  db.reset()
  hits.clear()
  resendCalls.cancel.length = 0
  resendCalls.get.length = 0
  resendCalls.cancelKeys.length = 0
  resendState.cancelError.clear()
  resendState.lastEvent.clear()
  optOuts = new Map()
  scheduled = [
    { resend_id: 're_day2', email: 'cto@acme.test', status: 'sent' },
    { resend_id: 're_day5', email: 'cto@acme.test', status: 'scheduled' },
    { resend_id: 're_day10', email: 'cto@acme.test', status: 'scheduled' },
    { resend_id: 're_day14', email: 'cto@acme.test', status: 'scheduled' },
    { resend_id: 're_other', email: 'someone@else.test', status: 'scheduled' },
  ]
  statefulDb()
})

describe('POST /api/unsubscribe (RFC 8058 one-click)', () => {
  it('records the opt-out and cancels every send still scheduled for that address', async () => {
    const response = await oneClick(lib.unsubscribeToken('cto@acme.test'))

    expect(response.status).toBe(200)
    expect(optOuts.get('cto@acme.test')).toBe('one-click')
    expect(resendCalls.cancel).toEqual(['re_day5', 're_day10', 're_day14'])
    expect(scheduled.map((r) => r.status)).toEqual(['sent', 'canceled', 'canceled', 'canceled', 'scheduled'])
  })

  it('cancels with the full-access key: the sending key gets 401 restricted_api_key from Resend', async () => {
    await oneClick(lib.unsubscribeToken('cto@acme.test'))

    expect(resendCalls.cancelKeys).toEqual(['re_admin_test_placeholder', 're_admin_test_placeholder', 're_admin_test_placeholder'])
  })

  it('covers the whole inbox: a +tag address cancels sends stored for the plain one', async () => {
    const response = await oneClick(lib.unsubscribeToken('CTO+news@acme.test'))

    expect(response.status).toBe(200)
    expect(optOuts.has('cto@acme.test')).toBe(true)
    expect(resendCalls.cancel).toEqual(['re_day5', 're_day10', 're_day14'])
  })

  it('is idempotent: a second request cancels nothing new and still succeeds', async () => {
    const token = lib.unsubscribeToken('cto@acme.test')
    await oneClick(token)
    const again = await oneClick(token)

    expect(again.status).toBe(200)
    expect(resendCalls.cancel).toHaveLength(3)
  })

  it('marks a send that already went out as sent, and still reports success', async () => {
    resendState.cancelError.add('re_day5')
    resendState.lastEvent.set('re_day5', 'delivered')

    const response = await oneClick(lib.unsubscribeToken('cto@acme.test'))

    expect(response.status).toBe(200)
    expect(resendCalls.get).toEqual(['re_day5'])
    expect(scheduled.find((r) => r.resend_id === 're_day5')?.status).toBe('sent')
  })

  it('answers 500 when a pending send could not be canceled, and leaves it marked scheduled', async () => {
    resendState.cancelError.add('re_day10')

    const response = await oneClick(lib.unsubscribeToken('cto@acme.test'))

    expect(response.status).toBe(500)
    expect(optOuts.has('cto@acme.test')).toBe(true)
    expect(scheduled.find((r) => r.resend_id === 're_day10')?.status).toBe('scheduled')
  })

  it('answers 500 when the opt-out cannot be stored, and cancels nothing', async () => {
    db.respond = (q: Query) => (q.table === 'email_opt_outs' ? fail('500', 'db down') : ok())

    const response = await oneClick(lib.unsubscribeToken('cto@acme.test'))

    expect(response.status).toBe(500)
    expect(resendCalls.cancel).toEqual([])
  })

  it('rejects a forged or missing token without touching anything', async () => {
    const forged = signUnsubscribeToken('cto@acme.test', 'not-our-secret')
    for (const token of [forged, null]) {
      const response = await oneClick(token)
      expect(response.status).toBe(400)
    }
    expect(db.calls).toHaveLength(0)
    expect(resendCalls.cancel).toEqual([])
  })

  it('rate-limits one IP like the other public endpoints (form-guard)', async () => {
    const ipLimit = FORM_GUARDS.unsubscribe.limits.find((l) => l.key === 'ip')!.max
    const headers = { 'x-real-ip': '203.0.113.9' }
    const statuses: number[] = []
    for (let i = 0; i <= ipLimit; i += 1) {
      statuses.push((await oneClick(lib.unsubscribeToken(`person${i}@acme.test`), headers)).status)
    }
    expect(statuses.slice(0, ipLimit).every((s) => s === 200)).toBe(true)
    expect(statuses[ipLimit]).toBe(429)
  })

  it('past the per-address limit, says done only when the opt-out is really stored', async () => {
    const emailLimit = FORM_GUARDS.unsubscribe.limits.find((l) => l.key === 'email')!.max
    const token = lib.unsubscribeToken('cto@acme.test')
    for (let i = 0; i < emailLimit; i += 1) await oneClick(token, { 'x-real-ip': `198.51.100.${i}` })
    expect((await oneClick(token, { 'x-real-ip': '198.51.100.200' })).status).toBe(200)

    optOuts.clear()
    expect((await oneClick(token, { 'x-real-ip': '198.51.100.201' })).status).toBe(429)
  })
})

describe('the /unsubscribe page button', () => {
  it('unsubscribes and redirects back to the page with status=done', async () => {
    const token = lib.unsubscribeToken('cto@acme.test')!
    const response = await pageButton(token)

    expect(response.status).toBe(303)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/unsubscribe')
    expect(location.searchParams.get('status')).toBe('done')
    expect(location.searchParams.get('t')).toBe(token)
    expect(optOuts.get('cto@acme.test')).toBe('link')
    expect(resendCalls.cancel).toHaveLength(3)
  })

  it('redirects a bad token to the friendly invalid state', async () => {
    const response = await pageButton('u1.bm9wZQ.forged')

    expect(response.status).toBe(303)
    expect(new URL(response.headers.get('location')!).searchParams.get('status')).toBe('invalid')
  })

  it('redirects to the error state when canceling failed', async () => {
    resendState.cancelError.add('re_day14')
    const response = await pageButton(lib.unsubscribeToken('cto@acme.test')!)

    expect(new URL(response.headers.get('location')!).searchParams.get('status')).toBe('error')
  })
})

describe('GET /api/unsubscribe', () => {
  it('only redirects to the confirmation page; a link scanner cannot unsubscribe anyone', async () => {
    const token = lib.unsubscribeToken('cto@acme.test')!
    const response = await route.GET(new NextRequest(`https://www.vibrana.ai/api/unsubscribe?t=${token}`))

    expect(response.status).toBe(303)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/unsubscribe')
    expect(location.searchParams.get('t')).toBe(token)
    expect(db.calls).toHaveLength(0)
    expect(resendCalls.cancel).toEqual([])
  })
})

describe('links and headers', () => {
  it('point at the canonical host, so a one-click POST never meets a redirect', () => {
    const headers = lib.listUnsubscribeHeaders('cto@acme.test')!
    expect(headers['List-Unsubscribe']).toMatch(/^<https:\/\/www\.vibrana\.ai\/api\/unsubscribe\?t=u1\.[^>]+>$/)
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(lib.unsubscribePageUrl('cto@acme.test')).toMatch(/^https:\/\/www\.vibrana\.ai\/unsubscribe\?t=u1\./)
  })
})
