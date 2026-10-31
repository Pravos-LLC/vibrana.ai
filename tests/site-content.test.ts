import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.doUnmock('@/src/site-content/generated.json'); vi.resetModules(); vi.unstubAllEnvs() })
describe('website display data port', () => {
  it('uses public sample defaults without configured display values', async () => {
    const { siteContent, productionSite } = await import('@/src/site-content')
    expect(productionSite).toBe(false)
    expect(siteContent('missing', { heading: 'Sample' })).toEqual({ heading: 'Sample' })
  })
  it('uses only emitted display values while preserving false and empty values', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'synthetic')
    vi.doMock('@/src/site-content/generated.json', () => ({ default: { schema: 1, production: true, binding: { VERCEL_GIT_COMMIT_SHA: 'synthetic' }, content: { hero: { heading: 'Synthetic production' }, enabled: false, caption: '' } } }))
    const { siteContent, productionSite } = await import('@/src/site-content')
    expect(productionSite).toBe(true)
    expect(siteContent('hero', { heading: 'Sample' })).toEqual({ heading: 'Synthetic production' })
    expect(siteContent('enabled', true)).toBe(false)
    expect(siteContent('caption', 'Sample')).toBe('')
  })
})
