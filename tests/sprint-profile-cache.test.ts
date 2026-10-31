import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanyProfile } from '@/src/lib/simulator/api'
const state = vi.hoisted(() => ({ cached: null as CompanyProfile | null, page: vi.fn(), classify: vi.fn(), budget: vi.fn(), save: vi.fn() }))
vi.mock('@/src/lib/simulator/server/db', () => ({ getCachedProfile: async () => state.cached, budgetHit: state.budget, saveProfile: state.save, assetPublicUrl: (v: string | null) => v ? `https://project.supabase.co/storage/v1/object/public/simulator-screens/${v}` : null, sweepExpiredAssets: async () => 0 }))
vi.mock('@/src/lib/simulator/profile/assets', () => ({ storeLogo: async () => null, storeScreenshot: async () => null }))
vi.mock('@/src/lib/simulator/profile/scrape', () => ({ scrapeHomepage: state.page }))
vi.mock('@/src/lib/simulator/profile/classify', async real => ({ ...await real<typeof import('@/src/lib/simulator/profile/classify')>(), classifyPage: state.classify }))
const { buildProfile } = await import('@/src/lib/simulator/profile')
const cached: CompanyProfile = { domain: 'example.com', sector: 'professional-services', confidence: .8, alternatives: [], functionMix: { support: .1, sales: .1, marketing: .1, operations: .2, finance: .1, legal: .1, people: .1, software: .2 }, signals: { mentionsAi: false, b2b: true }, source: 'firecrawl', title: 'Example', summary: null, offerings: [], name: 'Example', aiRole: null, levers: [], hqCountry: null, logoUrl: 'https://project.supabase.co/storage/v1/object/public/simulator-screens/logos/example.com.png', screenshotUrl: null }
beforeEach(() => { state.cached = { ...cached }; state.page.mockReset(); state.classify.mockReset(); state.budget.mockReset(); state.save.mockReset(); state.budget.mockResolvedValue(true); state.page.mockResolvedValue({ markdown: 'A professional services business.', source: 'firecrawl', meta: { description: 'Advisory services for growing companies.' } }); state.classify.mockResolvedValue(null) })
describe('sprint company description enrichment', () => {
  it('keeps ordinary logo-only cache lookups free, but refreshes them for sprint descriptions', async () => {
    expect((await buildProfile('example.com')).ok).toBe(true)
    expect(state.page).not.toHaveBeenCalled()
    const result = await buildProfile('example.com', { requireSummary: true })
    expect(state.page).toHaveBeenCalledWith('https://example.com/', { paid: true })
    expect(result.ok && result.profile.summary).toBe('Advisory services for growing companies.')
    expect(result.ok && result.profile.logoUrl).toBe(cached.logoUrl)
  })
  it('reuses a complete cached company description without another crawl', async () => {
    state.cached = { ...cached, summary: 'Advisory services for growing companies.' }
    const result = await buildProfile('example.com', { requireSummary: true })
    expect(result.ok && result.profile.summary).toBe('Advisory services for growing companies.')
    expect(state.page).not.toHaveBeenCalled()
  })
  it('preserves the existing profile if a refresh fails', async () => {
    state.page.mockResolvedValue(null)
    const result = await buildProfile('example.com', { requireSummary: true })
    expect(result.ok && result.profile.logoUrl).toBe(cached.logoUrl)
    expect(result.ok && result.profile.summary).toBeNull()
  })
  it('can use a public-page description without inventing a summary when model budget is exhausted', async () => {
    state.budget.mockImplementation(async kind => kind === 'scrapes')
    const result = await buildProfile('example.com', { requireSummary: true })
    expect(result.ok && result.profile.summary).toBe('Advisory services for growing companies.')
    expect(state.classify).not.toHaveBeenCalled()
  })
})
