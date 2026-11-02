import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GENERAL_FEEDBACK_FORM, SAMPLE_FEEDBACK_FORM as sample } from '@/src/feedback-content'
import { getFeedbackForm } from '@/lib/feedback/forms'

function envelope() {
  const form = { ...structuredClone(sample), slug: 'configured-example', clientName: 'Configured sample', thankYou: { connectUrl: 'https://example.com/connect' } }
  return { schema: 1, forms: { [form.slug]: form } }
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('FEEDBACK_FORMS_JSON', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('general feedback form', () => {
  it('is built in, always available, and ignores hosted configuration', () => {
    expect(getFeedbackForm('feedback')).toBe(GENERAL_FEEDBACK_FORM)
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(getFeedbackForm('feedback')).toBe(GENERAL_FEEDBACK_FORM)
    vi.stubEnv('FEEDBACK_FORMS_JSON', '{not valid json')
    expect(getFeedbackForm('feedback')).toBe(GENERAL_FEEDBACK_FORM)
  })

  it('shares the questions and consent wording of the sample form', () => {
    expect(GENERAL_FEEDBACK_FORM.questions).toEqual(sample.questions)
    expect(GENERAL_FEEDBACK_FORM.consent).toEqual(sample.consent)
  })
})

describe('shared server-only feedback form envelope', () => {
  it('uses synthetic samples only in explicit local development/test', () => {
    expect(getFeedbackForm(sample.slug)).toEqual(sample)
    vi.stubEnv('NODE_ENV', 'production')
    expect(getFeedbackForm(sample.slug)).toBeNull()
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(getFeedbackForm(sample.slug)).toBeNull()
  })

  it('loads validated hosted configuration without sample fallback or invitation identity', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const config = envelope()
    vi.stubEnv('FEEDBACK_FORMS_JSON', JSON.stringify(config))
    expect(getFeedbackForm('configured-example')).toEqual(config.forms['configured-example'])
    expect(getFeedbackForm(sample.slug)).toBeNull()
    expect(getFeedbackForm('constructor')).toBeNull()
    expect(getFeedbackForm(['configured-example'])).toBeNull()
    expect(getFeedbackForm('unknown-example')).toBeNull()
  })

  it('does not consume even malformed private configuration in hosted previews', () => {
    vi.stubEnv('FEEDBACK_FORMS_JSON', '{PRIVATE_CANARY')
    for (const environment of ['preview', 'development', '']) {
      vi.stubEnv('VERCEL', '1')
      vi.stubEnv('VERCEL_ENV', environment)
      expect(getFeedbackForm(sample.slug)).toBeNull()
    }
  })

  it('rereads current envelope on every lookup, with no stale named configuration cache', () => {
    vi.stubEnv('FEEDBACK_FORMS_JSON', JSON.stringify(envelope()))
    expect(getFeedbackForm('configured-example')?.clientName).toBe('Configured sample')
    vi.stubEnv('FEEDBACK_FORMS_JSON', JSON.stringify({ schema: 1, forms: {} }))
    expect(getFeedbackForm('configured-example')).toBeNull()
  })

  it('rejects malformed/oversized/unknown envelope data without including values in errors', () => {
    for (const value of ['{SECRET_CANARY', 'x'.repeat(131_073), JSON.stringify({ schema: 2, forms: {} }), JSON.stringify({ schema: 1, forms: {}, recipients: 'SECRET_CANARY' }), JSON.stringify({ schema: 1, forms: { constructor: sample } })]) {
      vi.stubEnv('FEEDBACK_FORMS_JSON', value)
      expect(() => getFeedbackForm(sample.slug)).toThrow('Invalid FEEDBACK_FORMS_JSON configuration')
      try { getFeedbackForm(sample.slug) } catch (error) { expect(String(error)).not.toContain('SECRET_CANARY') }
    }
  })

  it('rejects mismatched slugs, unsafe redirects, invalid consent gates and question structures', () => {
    const mutations = [
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.slug = 'different-example' },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.thankYou = { connectUrl: 'javascript:alert(1)' } },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.consent.minScore = 7 },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.consent.privacyLine = 'A different unrendered promise' },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.scoreQuestionId = 'missing' },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.questions[1].id = form.questions[0].id },
      (form: typeof sample & { thankYou?: { connectUrl: string } }) => { form.questions.pop() },
    ]
    for (const mutate of mutations) {
      const config = envelope()
      mutate(config.forms['configured-example'])
      vi.stubEnv('FEEDBACK_FORMS_JSON', JSON.stringify(config))
      expect(() => getFeedbackForm('configured-example')).toThrow('Invalid FEEDBACK_FORMS_JSON configuration')
    }
  })

  it('rejects browser execution even if the server-only framework guard were bypassed', () => {
    vi.stubGlobal('window', {})
    try { expect(() => getFeedbackForm(sample.slug)).toThrow('Feedback forms are server-only') }
    finally { vi.unstubAllGlobals() }
  })
})
