import { describe, expect, it } from 'vitest'
import { SAMPLEB544654A4D1A_PST_FORM as form } from '@/src/feedback-content'
import {
  buildSubmissionSchema,
  compactAnswers,
  consentHeadline,
  consentSnapshot,
  evaluateConsent,
} from '@/lib/feedback/submission'
import { resolveRecipient, sanitizeToken, tokenFor } from '@/lib/feedback/recipients'
import { feedbackSubject } from '@/lib/feedback/email'

const schema = buildSubmissionSchema(form)
const id = '3f2b9c1e-8a4d-4c57-9f01-2b6e7a1d5c90'

const allFlags = (value: boolean) => ({
  anonymous_quote: value,
  named_quote: value,
  include_company: value,
  case_study: value,
  promote: value,
  testimonial_chat: value,
})

function body(overrides: Record<string, unknown> = {}, score = 9) {
  return { slug: 'sample-feedback', submissionId: id, r: 'reviewerone', answers: { overall: score }, ...overrides }
}

describe('submission schema', () => {
  it('accepts a score on its own', () => {
    expect(schema.safeParse(body()).success).toBe(true)
  })

  it('requires the score and bounds it to 0 to 10', () => {
    expect(schema.safeParse(body({ answers: {} })).success).toBe(false)
    expect(schema.safeParse(body({}, 11)).success).toBe(false)
    expect(schema.safeParse(body({}, -1)).success).toBe(false)
    expect(schema.safeParse(body({}, 7.5)).success).toBe(false)
    expect(schema.safeParse(body({}, 0)).success).toBe(true)
    expect(schema.safeParse(body({}, 10)).success).toBe(true)
  })

  it('rejects unknown answer keys, out-of-range ratings, unknown chips and oversized text', () => {
    expect(schema.safeParse(body({ answers: { overall: 9, sneaky: 'x' } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, ratings: { quality: 6 } } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, next: { choices: ['nope'] } } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, went_well: 'x'.repeat(2001) } })).success).toBe(false)
  })

  it('rejects a bad submission id and the wrong slug', () => {
    expect(schema.safeParse(body({ submissionId: 'abc' })).success).toBe(false)
    expect(schema.safeParse(body({ slug: 'other' })).success).toBe(false)
  })

  it('trims text answers', () => {
    const parsed = schema.parse(body({ answers: { overall: 9, went_well: '  good  ' } }))
    expect(parsed.answers.went_well).toBe('good')
  })

  it('compacts empty answers away', () => {
    expect(compactAnswers({ overall: 9, went_well: '', next: { choices: [], text: '' }, numbers: { partner_records: '1200', hours_saved_per_week: '' } })).toEqual({
      overall: 9,
      numbers: { partner_records: '1200' },
    })
  })
})

describe('consent gating', () => {
  const consentBlock = (flags = allFlags(true)) => ({ consent: { version: form.consent.version, flags, draftQuote: true, referrals: 'Someone' } })

  it.each([0, 3, 7])('a score of %i with a consent block is forbidden, never recorded', (score) => {
    const submission = schema.parse(body(consentBlock(), score))
    expect(evaluateConsent(form, score, submission)).toEqual({ status: 'forbidden' })
  })

  it.each([0, 3, 7])('a score of %i without a consent block has no consent', (score) => {
    expect(evaluateConsent(form, score, schema.parse(body({}, score)))).toEqual({ status: 'none' })
  })

  it.each([8, 9, 10])('a score of %i records consent with the wording version and snapshot', (score) => {
    const submission = schema.parse(body(consentBlock(), score))
    const outcome = evaluateConsent(form, score, submission)
    expect(outcome.status).toBe('recorded')
    if (outcome.status !== 'recorded') return
    expect(outcome.version).toBe(form.consent.version)
    expect(outcome.snapshot).toBe(consentSnapshot(form))
    expect(outcome.anyGiven).toBe(true)
    expect(outcome.draftQuote).toBe(true)
    for (const option of form.consent.options) expect(outcome.snapshot).toContain(option.label)
  })

  it('records an all-unticked screen as no consent given', () => {
    const submission = schema.parse(body(consentBlock(allFlags(false)), 9))
    const outcome = evaluateConsent(form, 9, submission)
    expect(outcome.status === 'recorded' && outcome.anyGiven).toBe(false)
    expect(consentHeadline(outcome)).toBe('no consent given')
  })

  it('a high score without a consent block records nothing', () => {
    expect(evaluateConsent(form, 9, schema.parse(body()))).toEqual({ status: 'none' })
  })

  it('rejects consent shown under a different wording version', () => {
    const submission = schema.parse(body({ consent: { version: 'old', flags: allFlags(true) } }, 9))
    expect(evaluateConsent(form, 9, submission)).toEqual({ status: 'stale' })
  })

  it('requires all six flags to be explicit booleans', () => {
    const { case_study: _omit, ...partial } = allFlags(true)
    void _omit
    expect(schema.safeParse(body({ consent: { version: form.consent.version, flags: partial } })).success).toBe(false)
  })
})

describe('recipient tokens', () => {
  const reviewerone = tokenFor('sample-feedback', 'ReviewerOne')!
  it('uses unguessable tokens: 12+ characters, none equal to a first name', () => {
    for (const name of ['ReviewerOne', 'ReviewerTwo', 'ReviewerThree']) {
      const token = tokenFor('sample-feedback', name)!
      expect(token.length).toBeGreaterThanOrEqual(12)
      expect(token).not.toBe(name.toLowerCase())
    }
    expect(new Set(['ReviewerOne', 'ReviewerTwo', 'ReviewerThree'].map((n) => tokenFor('sample-feedback', n))).size).toBe(3)
  })

  it('maps known tokens to a display name, case-insensitively', () => {
    expect(resolveRecipient('sample-feedback', reviewerone)).toEqual({ token: reviewerone, recipient: { name: 'ReviewerOne' } })
    expect(resolveRecipient('sample-feedback', reviewerone.toUpperCase()).recipient?.name).toBe('ReviewerOne')
    expect(resolveRecipient('sample-feedback', [reviewerone, 'x']).recipient?.name).toBe('ReviewerOne')
  })

  it('first names are no longer valid tokens: they resolve to nobody', () => {
    for (const guess of ['reviewerone', 'reviewertwo', 'reviewerthree']) expect(resolveRecipient('sample-feedback', guess).recipient).toBeNull()
  })

  it('treats unknown tokens as anonymous', () => {
    expect(resolveRecipient('sample-feedback', 'stranger').recipient).toBeNull()
  })

  it('does not resolve inherited object keys or other forms tokens', () => {
    expect(resolveRecipient('sample-feedback', 'constructor').recipient).toBeNull()
    expect(resolveRecipient('other-form', reviewerone).recipient).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(sanitizeToken('<script>')).toBeNull()
    expect(sanitizeToken('a'.repeat(33))).toBeNull()
    expect(sanitizeToken(undefined)).toBeNull()
    expect(sanitizeToken('')).toBeNull()
  })
})

describe('email subject', () => {
  const caseStudy = evaluateConsent(form, 9, schema.parse(body({ consent: { version: form.consent.version, flags: allFlags(true) } })))
  it('names the respondent, score and consent headline', () => {
    expect(feedbackSubject({ form, respondentName: 'ReviewerOne', score: 9, consent: caseStudy })).toBe('Sampleb544654a4d1a feedback from ReviewerOne: 9/10, case study OK')
  })
  it('omits the consent headline below the threshold and handles anonymous', () => {
    expect(feedbackSubject({ form, respondentName: null, score: 6, consent: { status: 'none' } })).toBe(
      'Sampleb544654a4d1a feedback from an anonymous respondent: 6/10',
    )
  })
  it('never contains an em dash or a newline', () => {
    const subject = feedbackSubject({ form, respondentName: 'A\nB', score: 9, consent: caseStudy })
    expect(subject).not.toMatch(/—|\n/)
  })
})
