import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ action: 'allow', buildProfile: vi.fn() }))
vi.mock('@/lib/form-guard/server', () => ({ FORM_GUARDS: { sprintFitProfile: {} }, guardFieldsFromBody: () => ({}), guardSubmission: async () => state.action === 'reject' ? { action: 'reject', status: 429, message: 'Try later' } : { action: state.action } }))
vi.mock('@/src/lib/simulator/profile', () => ({ buildProfile: state.buildProfile }))
const { POST } = await import('@/app/api/sprint-fit/profile/route')
const post = (body: unknown) => POST(new NextRequest('http://localhost/api/sprint-fit/profile', { method: 'POST', body: JSON.stringify(body) }))
beforeEach(() => { state.action = 'allow'; state.buildProfile.mockReset(); state.buildProfile.mockResolvedValue({ ok: false, reason: 'manual', domain: 'example.com' }) })
describe('sprint company profile', () => {
  it('reuses website research without creating a lead or sending identity', async () => {
    const response = await post({ website: 'https://example.com/about', name: 'Not needed', email: 'private@example.com' })
    expect(response.status).toBe(200); expect(state.buildProfile).toHaveBeenCalledExactlyOnceWith('https://example.com/', { requireSummary: true })
  })
  it('rejects unsafe websites before calling any research service', async () => {
    for (const website of ['http://127.0.0.1', 'http://localhost', 'https://user:pass@example.com', 'https://example.com:8080', '']) {
      const result = await (await post({ website })).json(); expect(result.ok).toBe(false)
    }
    expect(state.buildProfile).not.toHaveBeenCalled()
  })
  it('returns a manual path for bots and preserves visible network limits', async () => {
    state.action = 'drop'; expect((await (await post({ website: 'example.com' })).json()).ok).toBe(false)
    state.action = 'reject'; expect((await post({ website: 'example.com' })).status).toBe(429)
    expect(state.buildProfile).not.toHaveBeenCalled()
  })
  it('rejects malformed or null payloads', async () => {
    expect((await post(null)).status).toBe(400)
    const response = await POST(new NextRequest('http://localhost/api/sprint-fit/profile', { method: 'POST', body: '{bad' }))
    expect(response.status).toBe(400)
  })
})
