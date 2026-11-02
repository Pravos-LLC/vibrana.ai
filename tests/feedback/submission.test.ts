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
  const version = form.consent.version
  const withEmail = (score: number) => ({ overall: score, contact: { email: 'rob@example.com' } })
  const yes = (score = 9, extra: Record<string, unknown> = {}) => ({
    answers: withEmail(score),
    consent: { version, testimonial: true, attribution: 'named', text: 'Great team to work with.', ...extra },
  })
  const no = () => ({ consent: { version, testimonial: false } })

  it.each([0, 3, 7])('a score of %i with a consent block is forbidden, never recorded', (score) => {
    const submission = schema.parse(body(no(), score))
    expect(evaluateConsent(form, score, submission)).toEqual({ status: 'forbidden' })
  })

  it.each([0, 3, 7])('a score of %i without a consent block has no consent', (score) => {
    expect(evaluateConsent(form, score, schema.parse(body({}, score)))).toEqual({ status: 'none' })
  })

  it.each([8, 9, 10])('a score of %i records the testimonial answer with the wording version and snapshot', (score) => {
    const outcome = evaluateConsent(form, score, schema.parse(body(yes(score), score)))
    expect(outcome.status).toBe('recorded')
    if (outcome.status !== 'recorded') return
    expect(outcome.version).toBe(version)
    expect(outcome.snapshot).toBe(consentSnapshot(form))
    expect(outcome.testimonial).toBe(true)
    expect(outcome.attribution).toBe('named')
    expect(outcome.text).toBe('Great team to work with.')
    expect(outcome.snapshot).toContain(form.consent.heading)
    expect(outcome.snapshot).toContain(`${form.consent.yesLabel} / ${form.consent.noLabel}`)
    expect(outcome.snapshot).toContain(form.consent.testimonialPrompt)
    expect(outcome.snapshot).toContain(form.consent.contactNote)
  })

  it('records a No answer as answered but not given, with no attribution or text', () => {
    const outcome = evaluateConsent(form, 9, schema.parse(body(no(), 9)))
    expect(outcome).toMatchObject({ status: 'recorded', testimonial: false })
    expect(outcome).not.toHaveProperty('attribution')
    expect(outcome).not.toHaveProperty('text')
  })

  it('a Yes may leave the testimonial text empty (the team drafts one) but needs a credit choice', () => {
    const empty = evaluateConsent(form, 9, schema.parse(body(yes(9, { text: '' }))))
    expect(empty).toMatchObject({ status: 'recorded', testimonial: true, attribution: 'named' })
    expect(empty).not.toHaveProperty('text')
    const noCredit = evaluateConsent(form, 9, schema.parse(body({ ...yes(9), consent: { version, testimonial: true } })))
    expect(noCredit).toEqual({ status: 'invalid' })
  })

  it('a Yes is the permission: it records without an email', () => {
    const noEmail = { answers: { overall: 9 }, consent: { version, testimonial: true, attribution: 'anonymous' } }
    expect(evaluateConsent(form, 9, schema.parse(body(noEmail)))).toMatchObject({ status: 'recorded', testimonial: true, attribution: 'anonymous' })
    const blank = { answers: { overall: 9, contact: { email: '' } }, consent: { version, testimonial: true, attribution: 'anonymous' } }
    expect(evaluateConsent(form, 9, schema.parse(body(blank)))).toMatchObject({ status: 'recorded', testimonial: true })
  })

  it('a legacy form whose wording promised email confirmation (emailNote) still needs an email on a Yes', () => {
    const legacy = { ...form, consent: { ...form.consent, emailNote: 'We need your email so we can send you the wording to approve.' } }
    const noEmail = { answers: { overall: 9 }, consent: { version, testimonial: true, attribution: 'anonymous' } }
    expect(evaluateConsent(legacy, 9, schema.parse(body(noEmail)))).toEqual({ status: 'invalid' })
    const withEmail = { answers: { overall: 9, contact: { email: 'rob@example.com' } }, consent: { version, testimonial: true, attribution: 'anonymous' } }
    expect(evaluateConsent(legacy, 9, schema.parse(body(withEmail)))).toMatchObject({ status: 'recorded', testimonial: true })
  })

  it('leaves optional consent notes a form does not set out of the recorded wording', () => {
    const bare = { ...form, consent: { ...form.consent, testimonialHint: undefined, emailNote: undefined, contactNote: undefined } }
    expect(consentSnapshot(bare)).not.toContain('Testimonial note:')
    expect(consentSnapshot(bare)).not.toContain('Contact step note:')
    const full = { ...form, consent: { ...form.consent, testimonialHint: 'A hint', emailNote: 'A note' } }
    expect(consentSnapshot(full)).toContain('Testimonial note: A hint')
    expect(consentSnapshot(full)).toContain('Contact step note: A note')
  })

  it('a high score without a consent block records nothing', () => {
    expect(evaluateConsent(form, 9, schema.parse(body()))).toEqual({ status: 'none' })
  })

  it('treats a consent block under another wording version, including the retired v3 shape, as stale', () => {
    expect(evaluateConsent(form, 9, schema.parse(body({ consent: { version: 'old', testimonial: true } }, 9)))).toEqual({ status: 'stale' })
    expect(evaluateConsent(form, 9, schema.parse(body({ consent: { version: 'sample-feedback-consent-2026-10-31-v3', anonymous_quote: true } }, 9)))).toEqual({ status: 'stale' })
  })

  it('requires explicit types and rejects unknown credit choices or oversized text', () => {
    expect(schema.safeParse(body({ consent: { version, testimonial: 'yes' } }, 9)).success).toBe(false)
    expect(schema.safeParse(body({ consent: { version, testimonial: true, attribution: 'everyone' } }, 9)).success).toBe(false)
    expect(schema.safeParse(body({ consent: { version, testimonial: true, attribution: 'named', text: 'x'.repeat(form.consent.testimonialMaxLength + 1) } }, 9)).success).toBe(false)
    expect(evaluateConsent(form, 9, schema.parse(body({ consent: { version } }, 9)))).toEqual({ status: 'invalid' })
  })
})

describe('email subject', () => {
  const quoteYes = evaluateConsent(form, 9, schema.parse(body({ answers: { overall: 9, contact: { email: 'rob@example.com' } }, consent: { version: form.consent.version, testimonial: true, attribution: 'named' } })))
  const quoteNo = evaluateConsent(form, 9, schema.parse(body({ consent: { version: form.consent.version, testimonial: false } })))
  it('names the respondent, score and testimonial answer', () => {
    expect(feedbackSubject({ form, contactName: 'Rob', score: 9, consent: quoteYes })).toBe(
      'Sample organization feedback from Rob: 9/10, testimonial: yes',
    )
    expect(feedbackSubject({ form, contactName: 'Rob', score: 9, consent: quoteNo })).toBe(
      'Sample organization feedback from Rob: 9/10, testimonial: no',
    )
  })
  it('handles a skipped testimonial question, anonymous respondents and low scores', () => {
    expect(feedbackSubject({ form, contactName: null, score: 9, consent: { status: 'none' } })).toBe(
      'Sample organization feedback from an anonymous respondent: 9/10, no testimonial answer',
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
