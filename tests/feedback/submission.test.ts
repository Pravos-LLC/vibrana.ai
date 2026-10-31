import { describe, expect, it } from 'vitest'
import { SAMPLE_FEEDBACK_FORM as form } from '@/src/feedback-content'
import {
  buildSubmissionSchema,
  compactAnswers,
  consentHeadline,
  consentSnapshot,
  evaluateConsent,
} from '@/lib/feedback/submission'
import { feedbackSubject } from '@/lib/feedback/email'

const schema = buildSubmissionSchema(form)
const id = '3f2b9c1e-8a4d-4c57-9f01-2b6e7a1d5c90'

function body(overrides: Record<string, unknown> = {}, score = 9) {
  return { slug: 'sample-feedback', submissionId: id, answers: { overall: score }, ...overrides }
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

  it('accepts the optional contact fields and rejects a malformed email', () => {
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { name: 'Rob', email: 'rob@example.com' } } })).success).toBe(true)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: {} } })).success).toBe(true)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { email: '' } } })).success).toBe(true)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { email: 'not-an-email' } } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { email: 'rob at example.com' } } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { sneaky: 'x' } } })).success).toBe(false)
  })

  it('caps the contact field lengths', () => {
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { name: 'x'.repeat(121) } } })).success).toBe(false)
    expect(schema.safeParse(body({ answers: { overall: 9, contact: { email: 'x'.repeat(255) } } })).success).toBe(false)
  })

  it('trims text answers', () => {
    const parsed = schema.parse(body({ answers: { overall: 9, went_well: '  good  ' } }))
    expect(parsed.answers.went_well).toBe('good')
  })

  it('compacts empty answers away', () => {
    expect(
      compactAnswers({
        overall: 9,
        went_well: '',
        next: { choices: [], text: '' },
        contact: { name: 'Rob', email: '' },
      }),
    ).toEqual({ overall: 9, contact: { name: 'Rob' } })
  })
})

describe('consent gating', () => {
  const consentBlock = (anonymousQuote = true) => ({ consent: { version: form.consent.version, anonymous_quote: anonymousQuote } })

  it.each([0, 3, 7])('a score of %i with a consent block is forbidden, never recorded', (score) => {
    const submission = schema.parse(body(consentBlock(), score))
    expect(evaluateConsent(form, score, submission)).toEqual({ status: 'forbidden' })
  })

  it.each([0, 3, 7])('a score of %i without a consent block has no consent', (score) => {
    expect(evaluateConsent(form, score, schema.parse(body({}, score)))).toEqual({ status: 'none' })
  })

  it.each([8, 9, 10])('a score of %i records consent with the wording version and snapshot', (score) => {
    const submission = schema.parse(body(consentBlock(true), score))
    const outcome = evaluateConsent(form, score, submission)
    expect(outcome.status).toBe('recorded')
    if (outcome.status !== 'recorded') return
    expect(outcome.version).toBe(form.consent.version)
    expect(outcome.snapshot).toBe(consentSnapshot(form))
    expect(outcome.anonymousQuote).toBe(true)
    expect(outcome.snapshot).toContain(form.consent.heading)
    expect(outcome.snapshot).toContain(`${form.consent.yesLabel} / ${form.consent.noLabel}`)
  })

  it('records a No answer as consent answered but not given', () => {
    const outcome = evaluateConsent(form, 9, schema.parse(body(consentBlock(false), 9)))
    expect(outcome.status === 'recorded' && outcome.anonymousQuote).toBe(false)
  })

  it('a high score without a consent block records nothing', () => {
    expect(evaluateConsent(form, 9, schema.parse(body()))).toEqual({ status: 'none' })
  })

  it('rejects consent shown under a different wording version', () => {
    const submission = schema.parse(body({ consent: { version: 'old', anonymous_quote: true } }, 9))
    expect(evaluateConsent(form, 9, submission)).toEqual({ status: 'stale' })
  })

  it('requires the anonymous_quote flag to be an explicit boolean', () => {
    expect(schema.safeParse(body({ consent: { version: form.consent.version } }, 9)).success).toBe(false)
    expect(schema.safeParse(body({ consent: { version: form.consent.version, anonymous_quote: 'yes' } }, 9)).success).toBe(false)
  })
})

describe('email subject', () => {
  const quoteYes = evaluateConsent(form, 9, schema.parse(body({ consent: { version: form.consent.version, anonymous_quote: true } })))
  const quoteNo = evaluateConsent(form, 9, schema.parse(body({ consent: { version: form.consent.version, anonymous_quote: false } })))
  it('names the respondent, score and quote consent', () => {
    expect(feedbackSubject({ form, contactName: 'Rob', score: 9, consent: quoteYes })).toBe(
      'Sample organization feedback from Rob: 9/10, quote anonymously: yes',
    )
    expect(feedbackSubject({ form, contactName: 'Rob', score: 9, consent: quoteNo })).toBe(
      'Sample organization feedback from Rob: 9/10, quote anonymously: no',
    )
  })
  it('handles a skipped consent screen, anonymous respondents and low scores', () => {
    expect(feedbackSubject({ form, contactName: null, score: 9, consent: { status: 'none' } })).toBe(
      'Sample organization feedback from an anonymous respondent: 9/10, no consent given',
    )
    expect(feedbackSubject({ form, contactName: null, score: 6, consent: { status: 'none' } })).toBe(
      'Sample organization feedback from an anonymous respondent: 6/10',
    )
  })
  it('never contains an em dash or a newline', () => {
    const subject = feedbackSubject({ form, contactName: 'A\nB', score: 9, consent: quoteYes })
    expect(subject).not.toMatch(/—|\n/)
  })
})
