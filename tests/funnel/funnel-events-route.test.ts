import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, fail } from '../helpers/fake-supabase'

vi.mock('@/lib/supabase', async () => ({ supabase: (await import('../helpers/fake-supabase')).db.client }))

const { POST } = await import('@/app/api/funnel-events/route')

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(new NextRequest('http://localhost/api/funnel-events', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
}

beforeEach(() => db.reset())

describe('POST /api/funnel-events', () => {
  it('counts a call click with its front door and location, nothing else', async () => {
    const res = await post({ event: 'call_click', entry: 'landing', location: 'readiness-hero', email: 'x@y.test' })
    expect(res.status).toBe(204)
    expect(db.find('funnel_events', 'insert').map((q) => q.payload)).toEqual([{ event: 'call_click', entry_point: 'landing', location: 'readiness-hero' }])
  })

  it.each([
    [{ event: 'roi_lead', entry: 'roi', location: 'report' }],
    [{ event: 'call_click', entry: 'twitter', location: 'report' }],
    [{ event: 'call_click', entry: 'direct', location: 'somewhere-else' }],
    [{ event: 'call_click', entry: 'direct' }],
    ['not json'],
    [JSON.stringify({ event: 'call_click', entry: 'direct', location: 'report', pad: 'x'.repeat(600) })],
  ])('rejects %j without writing', async (body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
    expect(db.find('funnel_events')).toHaveLength(0)
  })

  it('refuses a cross-site request and a non-JSON body without writing', async () => {
    const ok = { event: 'call_click', entry: 'direct', location: 'report' }
    expect((await post(ok, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect((await post(ok, { 'content-type': 'text/plain' })).status).toBe(415)
    expect((await post(ok, { 'sec-fetch-site': 'same-origin' })).status).toBe(204)
    expect(db.find('funnel_events', 'insert')).toHaveLength(1)
  })

  it('still answers 204 when the insert fails', async () => {
    db.respond = () => fail('XX000', 'down')
    const res = await post({ event: 'call_click', entry: 'direct', location: 'report' })
    expect(res.status).toBe(204)
  })
})
