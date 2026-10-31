import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { db, ok } from './helpers/fake-supabase'

// Admin routes are guarded by `Authorization: Bearer <CRON_SECRET>`. Every handler
// must refuse before it reads or writes anything, and must fail closed when the
// secret is unset. The public analysis route must never force a regeneration.
process.env.CRON_SECRET = 'admin-secret'

vi.mock('@/lib/supabase', async () => ({ supabase: (await import('./helpers/fake-supabase')).db.client }))

const analysis = vi.hoisted(() => ({ calls: [] as [string, { force?: boolean } | undefined][] }))
vi.mock('@/lib/assessment/generate-industry-analysis', () => ({
  generateIndustryAnalysisForAssessment: async (id: string, opts?: { force?: boolean }) => {
    analysis.calls.push([id, opts])
    return { success: true, industryAnalysis: 'analysis', cached: !opts?.force }
  },
}))
vi.mock('@/src/lib/assessment/db', () => ({
  getAssessment: async (id: string) => (id === 'known' ? { id, industry_analysis: 'stored analysis' } : null),
}))

const analysisRoute = await import('@/app/api/admin/assessment-analysis/route')
const reviewRoute = await import('@/app/api/admin/assessment-review/route')
const leadsRoute = await import('@/app/api/admin/leads/route')
const publicAnalysisRoute = await import('@/app/api/assessments/[id]/analysis/route')

type Handler = (req: NextRequest) => Promise<Response>
const handlers: [string, string, Handler][] = [
  ['POST', '/api/admin/assessment-analysis', analysisRoute.POST],
  ['GET', '/api/admin/assessment-review', reviewRoute.GET],
  ['GET', '/api/admin/leads', leadsRoute.GET],
  ['PATCH', '/api/admin/leads', leadsRoute.PATCH],
]

function call(handler: Handler, method: string, path: string, authorization?: string, body: unknown = { id: 'known', status: 'won' }) {
  const headers: Record<string, string> = authorization ? { authorization } : {}
  return handler(
    new NextRequest(`http://localhost${path}`, {
      method,
      headers,
      body: method === 'GET' ? undefined : JSON.stringify(body),
    }),
  )
}

describe('admin routes', () => {
  beforeEach(() => {
    db.reset()
    analysis.calls.length = 0
  })

  describe.each(handlers)('%s %s', (method, path, handler) => {
    it.each([
      ['no authorization header', undefined],
      ['a wrong secret', 'Bearer nope'],
      ['the raw secret without Bearer', 'admin-secret'],
    ])('returns 401 for %s and touches nothing', async (_label, authorization) => {
      const response = await call(handler, method, path, authorization)

      expect(response.status).toBe(401)
      expect(db.calls).toHaveLength(0)
      expect(analysis.calls).toHaveLength(0)
    })

    it.each([
      // `Headers` strips a trailing space, so 'Bearer ' silently becomes 'Bearer' —
      // asserting against that string alone would pass even without a secret guard,
      // since 'Bearer ${secret}' with an empty secret never equals the stripped
      // header either. 'Bearer undefined' is the real trap: with CRON_SECRET
      // unset, `${secret}` template-interpolates to the literal string
      // "undefined", so a route missing the `!!secret &&` guard would match it.
      ['Bearer undefined'],
      ['Bearer'],
    ])('fails closed when CRON_SECRET is unset, for %s', async (authorization) => {
      vi.stubEnv('CRON_SECRET', undefined)
      try {
        const response = await call(handler, method, path, authorization)
        expect(response.status).toBe(401)
        expect(db.calls).toHaveLength(0)
        expect(analysis.calls).toHaveLength(0)
      } finally {
        vi.unstubAllEnvs()
      }
    })
  })

  it('lets the correct secret through', async () => {
    db.respond = () => ok([])

    const response = await call(leadsRoute.GET, 'GET', '/api/admin/leads', 'Bearer admin-secret')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ leads: [] })
  })

  it('validates lead updates after auth', async () => {
    const response = await call(leadsRoute.PATCH, 'PATCH', '/api/admin/leads', 'Bearer admin-secret', { id: 'not-a-uuid', status: 'won' })

    expect(response.status).toBe(400)
    expect(db.calls).toHaveLength(0)
  })

  it('the admin analysis route can force a regeneration', async () => {
    await call(analysisRoute.POST, 'POST', '/api/admin/assessment-analysis', 'Bearer admin-secret', { id: 'known', force: true })

    expect(analysis.calls).toEqual([['known', { force: true }]])
  })
})

describe('public /api/assessments/[id]/analysis', () => {
  beforeEach(() => {
    analysis.calls.length = 0
  })

  const params = (id: string) => ({ params: Promise.resolve({ id }) })

  it('GET returns the stored analysis without generating anything', async () => {
    const response = await publicAnalysisRoute.GET(new NextRequest('http://localhost/api/assessments/known/analysis'), params('known'))

    expect(await response.json()).toEqual({ hasAnalysis: true, analysis: 'stored analysis', analysisFailed: false })
    expect(analysis.calls).toHaveLength(0)
  })

  it('GET returns 404 for an unknown assessment', async () => {
    const response = await publicAnalysisRoute.GET(new NextRequest('http://localhost/api/assessments/nope/analysis'), params('nope'))

    expect(response.status).toBe(404)
  })

  it('POST ignores ?force=1, so an anonymous caller cannot wipe and regenerate an analysis', async () => {
    const response = await publicAnalysisRoute.POST(
      new NextRequest('http://localhost/api/assessments/known/analysis?force=1', { method: 'POST' }),
      params('known'),
    )

    expect(response.status).toBe(200)
    expect(analysis.calls).toHaveLength(1)
    expect(analysis.calls[0][1]?.force).toBeFalsy()
  })
})
