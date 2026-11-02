// Validation and consent gating for client feedback, built from the form config so a new client
// form needs no new schema code. Pure functions: the route handler and the tests both use them.
import { z } from 'zod'
import type { FeedbackAttributionId, FeedbackFormConfig, FeedbackQuestion } from '@/src/feedback-content'

/** Hard cap on the request body, in characters. A full response is well under 10 KB. */
export const MAX_BODY_CHARS = 32_000

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
    case 'contact':
      // Optional follow-up details. Empty strings are fine; a non-empty email must look like one.
      return z
        .object({
          name: cleanText(question.nameMaxLength).optional(),
          email: cleanText(question.emailMaxLength)
            .refine((value) => value === '' || z.email().safeParse(value).success, { message: 'invalid email' })
            .optional(),
        })
        .strict()
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

  return z.object({
    slug: z.literal(form.slug),
    // Client-generated, so a retry after a lost response cannot save the same answers twice.
    submissionId: z.string().uuid(),
    answers: z.object(answerShape).strict(),
    // Present only when the respondent answered the testimonial question. `anonymous_quote` is the
    // retired v3 shape: it still parses so an older open tab gets the "form was updated" message
    // (its version no longer matches) instead of a bare validation error.
    consent: z
      .object({
        version: z.string().max(100),
        testimonial: z.boolean().optional(),
        attribution: z.enum(['named', 'company', 'anonymous']).optional(),
        text: cleanText(form.consent.testimonialMaxLength).optional(),
        anonymous_quote: z.boolean().optional(),
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
  /** Right wording version, but a shape the real form never sends (a Yes with no credit choice or no email). */
  | { status: 'invalid' }
  | {
      status: 'recorded'
      testimonial: boolean
      attribution?: FeedbackAttributionId
      text?: string
      version: string
      snapshot: string
    }

/**
 * Every consent-related string the respondent sees, in screen order: the welcome-screen privacy
 * line, the testimonial question and its Yes / No options, the testimonial step, and the email note.
 * Stored with every consent record.
 */
export function consentCopy(form: FeedbackFormConfig): string[] {
  const c = form.consent
  return [
    c.privacyLine,
    c.heading,
    c.yesLabel,
    c.noLabel,
    c.testimonialPrompt,
    c.testimonialHint,
    c.testimonialPlaceholder,
    c.attributionLabel,
    ...c.attributions.map((a) => a.label),
    c.emailNote,
  ]
}

export function consentSnapshot(form: FeedbackFormConfig): string {
  const c = form.consent
  const lines = [
    `Welcome screen: ${c.privacyLine}`,
    `Testimonial question: ${c.heading}`,
    `Answer options: ${c.yesLabel} / ${c.noLabel}`,
    `Testimonial prompt: ${c.testimonialPrompt}`,
    `Testimonial note: ${c.testimonialHint}`,
    `Testimonial placeholder: ${c.testimonialPlaceholder}`,
    `Credit question: ${c.attributionLabel}`,
    `Credit options: ${c.attributions.map((a) => a.label).join(' / ')}`,
    `Contact step note: ${c.emailNote}`,
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
  if (typeof block.testimonial !== 'boolean') return { status: 'invalid' }
  const snapshot = consentSnapshot(form)
  if (!block.testimonial) return { status: 'recorded', testimonial: false, version: form.consent.version, snapshot }
  // A Yes needs a credit choice, and an email: the wording is always confirmed with the person before it is used.
  const contact = submission.answers[contactQuestionId(form)] as { email?: string } | undefined
  if (!block.attribution || !contact?.email) return { status: 'invalid' }
  return {
    status: 'recorded',
    testimonial: true,
    attribution: block.attribution,
    ...(block.text ? { text: block.text } : {}),
    version: form.consent.version,
    snapshot,
  }
}

function contactQuestionId(form: FeedbackFormConfig): string {
  return form.questions.find((q) => q.kind === 'contact')?.id ?? 'contact'
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
  if (outcome.status !== 'recorded') return 'no testimonial answer'
  return `testimonial: ${outcome.testimonial ? 'yes' : 'no'}`
}

/** Most links a response may carry across all of its free text. Real feedback rarely has any. */
export const MAX_LINKS = 2

const LINK_PATTERN = /(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]{1,63}\.(?:com|net|org|io|co|ru|xyz|top|biz|info|shop|click|online|site|link)\/\S*/gi

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out))
  return out
}

/**
 * Link spam is the commonest abuse of an open text form. Counts links in every free-text answer,
 * the contact fields and the testimonial text. The route answers with a visible 400 so a real
 * person who pasted several links can remove them and send again, instead of losing the response.
 */
export function countLinks(submission: Pick<FeedbackSubmission, 'answers' | 'consent'>): number {
  const text = collectStrings([submission.answers, submission.consent?.text]).join('\n')
  return text.match(LINK_PATTERN)?.length ?? 0
}
