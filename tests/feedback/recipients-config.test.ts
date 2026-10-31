import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SAMPLEB544654A4D1A_PST_FORM as form } from '@/src/feedback-content'
import { resolveRecipient, tokenFor } from '@/lib/feedback/recipients'

const privateToken = 'f'.repeat(16)
const fixture = (forms: unknown) => JSON.stringify({ schema: 1, forms })
const configured = () => fixture({ [form.slug]: { [privateToken]: { name: 'Private Fixture', role: 'Reviewer' } } })

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', '')
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('server feedback recipient configuration', () => {
  it('uses only synthetic defaults in local development and tests', () => {
    const token = tokenFor(form.slug, 'ReviewerOne')
    expect(token).toBe('demo-reviewer-01')
    expect(resolveRecipient(form.slug, token).recipient?.name).toBe('ReviewerOne')
  })

  it.each(['production', 'preview', 'development'])('denies default named invites on hosted %s', (environment) => {
    vi.stubEnv('VERCEL_ENV', environment)
    expect(tokenFor(form.slug, 'ReviewerOne')).toBeNull()
    expect(resolveRecipient(form.slug, 'demo-reviewer-01')).toEqual({ token: null, recipient: null })
  })

  it('denies defaults in production without any platform marker', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(resolveRecipient(form.slug, 'demo-reviewer-01')).toEqual({ token: null, recipient: null })
  })

  it('rejects a configured public demo token in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', fixture({ [form.slug]: { 'demo-reviewer-01': { name: 'Sample' } } }))
    expect(() => resolveRecipient(form.slug, 'demo-reviewer-01')).toThrow('Invalid FEEDBACK_RECIPIENTS_JSON configuration')
  })

  it('resolves a real configured form using synthetic private-env input only', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', configured())
    expect(resolveRecipient(form.slug, privateToken.toUpperCase())).toEqual({ token: privateToken, recipient: { name: 'Private Fixture', role: 'Reviewer' } })
    expect(tokenFor(form.slug, 'Private Fixture')).toBe(privateToken)
    expect(resolveRecipient('unknown-form', privateToken)).toEqual({ token: null, recipient: null })
    expect(resolveRecipient(form.slug, 'demo-reviewer-01')).toEqual({ token: null, recipient: null })
    expect(resolveRecipient(form.slug, 'constructor')).toEqual({ token: null, recipient: null })
  })

  it.each([
    '{', '[]', '{"schema":2,"forms":{}}', '{"schema":1,"forms":{},"extra":true}',
    fixture({ constructor: {} }), fixture({ example: [] }),
    fixture({ example: { short: { name: 'Sample' } } }),
    fixture({ example: { [privateToken]: { name: 'Sample', email: 'unused@example.test' } } }),
    fixture({ example: { [privateToken]: { name: 'Unsafe\nName' } } }),
    fixture({ example: { [privateToken]: { name: 'Sample', role: '' } } }),
  ])('rejects malformed configuration without reflecting its contents', (raw) => {
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', raw)
    expect(() => resolveRecipient(form.slug, privateToken)).toThrow(/^Invalid FEEDBACK_RECIPIENTS_JSON configuration$/)
  })

  it('bounds config size and rereads mode/config changes without stale identity caching', () => {
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', ' '.repeat(32768) + '{}')
    expect(() => tokenFor(form.slug, 'ReviewerOne')).toThrow('Invalid FEEDBACK_RECIPIENTS_JSON configuration')
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', configured())
    expect(tokenFor(form.slug, 'Private Fixture')).toBe(privateToken)
    vi.stubEnv('FEEDBACK_RECIPIENTS_JSON', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(tokenFor(form.slug, 'Private Fixture')).toBeNull()
  })

  it('rejects browser execution before reading private configuration', () => {
    vi.stubGlobal('window', {})
    expect(() => tokenFor(form.slug, 'ReviewerOne')).toThrow('Feedback recipients are server-only')
  })
})
