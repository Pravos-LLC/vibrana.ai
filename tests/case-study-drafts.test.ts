import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { draftsVisible, getAllCaseStudies, getRoutableCaseStudies } from '@/src/lib/case-studies'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('@/src/views/CaseStudyPage', () => ({ default: () => null }))
vi.mock('@/src/components/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/src/components/case-studies/CaseStudyMockPreview', () => ({ CaseStudyMockPreview: () => null }))
vi.mock('@/src/components/product-mocks', () => ({ CASE_STUDY_MOCKS: { 'sample-review-draft': { overview: () => null } } }))

import Page, { generateMetadata, generateStaticParams } from '@/app/case-studies/[slug]/page'
import PreviewPage, { generateStaticParams as previewParams } from '@/app/case-studies/previews/[study]/[screen]/page'

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('draft case studies', () => {
  it('requires explicit local development review', () => {
    expect(draftsVisible()).toBe(false)
    vi.stubEnv('NODE_ENV', 'development')
    expect(draftsVisible()).toBe(false)
    vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '1')
    expect(draftsVisible()).toBe(true)
  })

  it.each(['production', 'preview', 'development', 'unknown'])('denies hosted %s even with the review flag', (environment) => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '1')
    vi.stubEnv('VERCEL_ENV', environment)
    expect(draftsVisible()).toBe(false)
  })

  it('denies production Node builds without a Vercel environment', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '1')
    expect(draftsVisible()).toBe(false)
  })

  it('denies Vercel when only its platform marker is set', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '1')
    vi.stubEnv('VERCEL', '1')
    expect(draftsVisible()).toBe(false)
  })

  it('returns 404 without draft metadata, static pages or artifact previews', async () => {
    const drafts = getAllCaseStudies().filter((cs) => !cs.published)
    expect(drafts.length).toBeGreaterThan(0)
    expect(drafts.some(({ slug }) => slug === 'sample-review-draft')).toBe(true)
    for (const draft of drafts) {
      expect(getRoutableCaseStudies().map((cs) => cs.slug)).not.toContain(draft.slug)
      expect(generateStaticParams().map((cs) => cs.slug)).not.toContain(draft.slug)
      const params = Promise.resolve({ slug: draft.slug })
      await expect(Page({ params })).rejects.toThrow('NOT_FOUND')
      expect(await generateMetadata({ params })).toEqual({})
    }
    expect(previewParams()).toEqual([])
    await expect(PreviewPage({ params: Promise.resolve({ study: 'sample-review-draft', screen: 'overview' }) })).rejects.toThrow('NOT_FOUND')
  })

  it('allows local draft review with no structured-data publication', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VIBRANA_CASE_STUDY_DRAFTS', '1')
    expect(generateStaticParams().map(({ slug }) => slug)).toContain('sample-review-draft')
    const params = Promise.resolve({ slug: 'sample-review-draft' })
    expect((await generateMetadata({ params })).robots).toEqual({ index: false, follow: false })
    await expect(Page({ params })).resolves.toBeDefined()
    await expect(PreviewPage({ params: Promise.resolve({ study: 'sample-review-draft', screen: 'overview' }) })).resolves.toBeDefined()
  })
})
