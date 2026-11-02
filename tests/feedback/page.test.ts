import { afterEach, expect, it, vi } from 'vitest'
import { SAMPLE_FEEDBACK_FORM as sample } from '@/src/feedback-content'

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('@/src/views/FeedbackForm', () => ({ FeedbackForm: () => null }))
const { default: FeedbackPage, dynamic, metadata } = await import('@/app/feedback/[slug]/page')
afterEach(() => vi.unstubAllEnvs())

it('renders only the requested current server form and stays dynamic/noindex', async () => {
  const form = { ...structuredClone(sample), slug: 'configured-example', clientName: 'Configured sample' }
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('FEEDBACK_FORMS_JSON', JSON.stringify({ schema: 1, forms: { [form.slug]: form } }))
  const page = await FeedbackPage({ params: Promise.resolve({ slug: form.slug }) })
  expect(page.props.form).toEqual(form)
  expect(dynamic).toBe('force-dynamic')
  expect(metadata.robots).toEqual({ index: false, follow: false })
  await expect(FeedbackPage({ params: Promise.resolve({ slug: sample.slug }) })).rejects.toThrow('NOT_FOUND')
  vi.stubEnv('VERCEL_ENV', 'preview')
  await expect(FeedbackPage({ params: Promise.resolve({ slug: form.slug }) })).rejects.toThrow('NOT_FOUND')
})

it('serves the built-in general form at /feedback in every environment, with no private configuration', async () => {
  const { default: GeneralFeedbackPage, dynamic: generalDynamic, metadata: generalMetadata } = await import('@/app/feedback/page')
  for (const env of ['production', 'preview', 'development']) {
    vi.stubEnv('VERCEL_ENV', env)
    vi.stubEnv('FEEDBACK_FORMS_JSON', '{not valid json')
    const page = GeneralFeedbackPage()
    expect(page.props.form.slug).toBe('feedback')
    expect(page.props.form.clientName).toBe('Vibrana')
  }
  expect(generalDynamic).toBe('force-dynamic')
  expect(generalMetadata.robots).toEqual({ index: false, follow: false })
})
