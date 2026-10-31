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

it('retains the EU question formatter when its display data comes from JSON', async () => {
  vi.doMock('@/src/site-content/generated.json', () => ({ default: {
    schema: 1, production: false,
    content: { 'eu-ai-act-readiness-content.EU_METHOD': { heading: 'Synthetic configured heading', sections: [], principles: [] } },
  } }))
  const { EU_METHOD } = await import('@/src/eu-ai-act-readiness-content')
  expect(EU_METHOD.heading).toBe('Synthetic configured heading')
  expect(EU_METHOD.sections).toEqual([])
  expect(EU_METHOD.questionsLabel(4)).toBe('4 questions')
})
