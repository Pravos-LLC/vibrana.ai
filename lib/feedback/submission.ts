// Validation and consent gating for client feedback, built from the form config so a new client
// form needs no new schema code. Pure functions: the route handler and the tests both use them.
import { z } from 'zod'
import type { FeedbackConsentOptionId, FeedbackFormConfig, FeedbackQuestion } from '@/src/feedback-content'

/** Hard cap on the request body, in characters. A full response is well under 10 KB. */
export const MAX_BODY_CHARS = 32_000

export type ConsentFlags = Record<FeedbackConsentOptionId, boolean>

function cleanText(max: number) {
  return z
    .string()
    .max(max)
    .transform((value) => value.trim())
}

function questionSchema(question: FeedbackQuestion): z.ZodType {
  switch (question.kind) {
    case 'score':
      return z.number().int().min(0).max(10)
    case 'ratings': {
      const shape: Record<string, z.ZodType> = {}
      for (const item of question.items) shape[item.id] = z.number().int().min(1).max(5).optional()
      return z.object(shape).strict()
    }
    case 'text':
      return cleanText(question.maxLength)
    case 'fields': {
      const shape: Record<string, z.ZodType> = {}
      for (const field of question.fields) shape[field.id] = cleanText(question.maxLength).optional()
      return z.object(shape).strict()
    }
    case 'chips':
      return z
        .object({
          choices: z
            .array(z.enum(question.options.map((o) => o.id) as [string, ...string[]]))
            .max(question.options.length),
          text: cleanText(question.maxLength).optional(),
        })
        .strict()
  }
}

export function buildSubmissionSchema(form: FeedbackFormConfig) {
  const answerShape: Record<string, z.ZodType> = {}
  for (const question of form.questions) {
    answerShape[question.id] = question.id === form.scoreQuestionId ? questionSchema(question) : questionSchema(question).optional()
  }

  const consentShape = Object.fromEntries(form.consent.options.map((o) => [o.id, z.boolean()])) as Record<
    FeedbackConsentOptionId,
    z.ZodBoolean
  >

  return z.object({
    slug: z.literal(form.slug),
    // Client-generated, so a retry after a lost response cannot save the same answers twice.
    submissionId: z.string().uuid(),
    r: z.string().max(64).nullish(),
    answers: z.object(answerShape).strict(),
    // Present only when the respondent was shown the consent screen.
    consent: z
      .object({
        version: z.string().max(100),
        flags: z.object(consentShape).strict(),
        draftQuote: z.boolean().optional(),
        referrals: cleanText(form.consent.referralMaxLength).optional(),
      })
      .strict()
      .nullish(),
  })
}

export type FeedbackSubmission = z.infer<ReturnType<typeof buildSubmissionSchema>>

/**
 * Lowest score at which the database accepts a consent record (client_feedback_consent_gate in
 * supabase/migrations/20261029000000_client_feedback.sql). A form's consent.minScore must be at
 * least this; tests/feedback/consent-copy.test.ts checks the migration text still says the same number.
 */
export const CONSENT_DB_MIN_SCORE = 8

export type ConsentOutcome =
  | { status: 'none' }
  | { status: 'stale' }
  /** A consent block arrived with a score below the threshold. The real form never sends one. */
  | { status: 'forbidden' }
  | {
      status: 'recorded'
      flags: ConsentFlags
      version: string
      snapshot: string
      anyGiven: boolean
      draftQuote: boolean
      referrals: string | null
    }

/**
 * Every consent-related string the respondent sees, in screen order: the welcome-screen privacy
 * line, then the consent screen's heading, intro, group label, each checkbox, the draft-quote box
 * with its aside, and the referral prompt with its placeholder. Stored with every consent record.
 */
export function consentCopy(form: FeedbackFormConfig): string[] {
  const c = form.consent
  return [
    c.privacyLine,
    c.heading,
    c.intro,
    c.groupLabel,
    ...c.options.map((o) => o.label),
    c.draftQuoteLabel,
    c.draftQuoteAside,
    c.referralLabel,
    c.referralPlaceholder,
  ]
}

export function consentSnapshot(form: FeedbackFormConfig): string {
  const c = form.consent
  const lines = [
    `Welcome screen: ${c.privacyLine}`,
    `Consent screen heading: ${c.heading}`,
    `Intro: ${c.intro}`,
    `Group label: ${c.groupLabel}`,
    ...c.options.map((o) => `[ ] ${o.label}`),
    `[ ] ${c.draftQuoteLabel} (${c.draftQuoteAside})`,
    `${c.referralLabel} (${c.referralPlaceholder})`,
  ]
  return lines.join('\n')
}

/**
 * The gate. Consent only exists for a score at or above the form's minimum. A lower score with a
 * consent block is 'forbidden': the real form never sends one, so the route rejects it.
 * A consent block whose version does not match the live wording is 'stale', and the route rejects
 * it rather than record agreement to words the respondent did not see.
 */
export function evaluateConsent(form: FeedbackFormConfig, score: number, submission: FeedbackSubmission): ConsentOutcome {
  const block = submission.consent
  if (score < form.consent.minScore) return block ? { status: 'forbidden' } : { status: 'none' }
  if (!block) return { status: 'none' }
  if (block.version !== form.consent.version) return { status: 'stale' }
  const flags = block.flags as ConsentFlags
  return {
    status: 'recorded',
    flags,
    version: form.consent.version,
    snapshot: consentSnapshot(form),
    anyGiven: Object.values(flags).some(Boolean),
    draftQuote: block.draftQuote === true,
    referrals: block.referrals ? block.referrals : null,
  }
}

/** Drops empty strings and empty groups so the stored jsonb holds only what was actually said. */
export function compactAnswers(value: unknown): unknown {
  if (typeof value === 'string') return value.trim() === '' ? undefined : value
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value)) {
      const cleaned = compactAnswers(inner)
      if (cleaned === undefined) continue
      if (Array.isArray(cleaned) && cleaned.length === 0) continue
      if (typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned as object).length === 0) continue
      out[key] = cleaned
    }
    return out
  }
  return value
}

/** Short summary for the email subject. */
export function consentHeadline(outcome: ConsentOutcome): string {
  if (outcome.status !== 'recorded' || !outcome.anyGiven) return 'no consent given'
  const f = outcome.flags
  if (f.case_study) return 'case study OK'
  if (f.named_quote) return 'named quote OK'
  if (f.anonymous_quote) return 'anonymous quote OK'
  return 'consent given'
}
