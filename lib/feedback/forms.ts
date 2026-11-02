import 'server-only'

import { z } from 'zod'
import { FEEDBACK_FORMS, FEEDBACK_UI, GENERAL_FEEDBACK_FORM, type FeedbackFormConfig } from '@/src/feedback-content'
import { CONSENT_DB_MIN_SCORE } from './submission'

const RESERVED = new Set(['__proto__', 'constructor', 'prototype', 'intro', 'consent', 'done'])
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/).refine((v) => !RESERVED.has(v))
const idSchema = z.string().regex(/^[a-z][a-z0-9_]{0,63}$/).refine((v) => !RESERVED.has(v))
const text = (max: number) => z.string().min(1).max(max)
  .refine((v) => v.trim() === v && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))
const item = z.object({ id: idSchema, label: text(300) }).strict()
const items = z.array(item).min(1).max(30).refine((v) => new Set(v.map((entry) => entry.id)).size === v.length)
const base = { id: idSchema, prompt: text(2000), hint: text(2000).optional() }
const question = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('score'), lowLabel: text(300), highLabel: text(300) }).strict(),
  z.object({ ...base, kind: z.literal('ratings'), items, lowLabel: text(300), highLabel: text(300) }).strict(),
  z.object({ ...base, kind: z.literal('text'), placeholder: text(500), maxLength: z.number().int().min(1).max(10_000) }).strict(),
  z.object({ ...base, kind: z.literal('chips'), options: items, textLabel: text(300), textPlaceholder: text(500), maxLength: z.number().int().min(1).max(10_000) }).strict(),
  z.object({ ...base, kind: z.literal('contact'), nameLabel: text(300), emailLabel: text(300), namePlaceholder: text(300), emailPlaceholder: text(300), nameMaxLength: z.number().int().min(1).max(120), emailMaxLength: z.number().int().min(1).max(254) }).strict(),
])
const httpsUrl = text(2048).refine((value) => {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password }
  catch { return false }
})
const formSchema = z.object({
  slug: slugSchema,
  clientName: text(200),
  projectName: text(300),
  scoreQuestionId: idSchema,
  questions: z.array(question).min(2).max(30),
  consent: z.object({
    version: text(100),
    minScore: z.number().int().min(CONSENT_DB_MIN_SCORE).max(10),
    privacyLine: text(2000),
    heading: text(2000),
    yesLabel: text(300),
    noLabel: text(300),
  }).strict(),
  thankYou: z.object({ connectUrl: httpsUrl }).strict().optional(),
}).strict().superRefine((form, ctx) => {
  const ids = form.questions.map((q) => q.id)
  const scores = form.questions.filter((q) => q.kind === 'score')
  const contacts = form.questions.filter((q) => q.kind === 'contact')
  if (new Set(ids).size !== ids.length || scores.length !== 1 || scores[0]?.id !== form.scoreQuestionId
    || form.questions[0]?.id !== form.scoreQuestionId || contacts.length !== 1
    || contacts[0]?.id !== 'contact' || form.questions.at(-1)?.id !== 'contact') {
    ctx.addIssue({ code: 'custom', message: 'Invalid question structure' })
  }
})
const envelopeSchema = z.object({ schema: z.literal(1), forms: z.record(slugSchema, formSchema) }).strict()

export class FeedbackFormsConfigurationError extends Error {
  constructor() { super('Invalid FEEDBACK_FORMS_JSON configuration') }
}

function localSamplesAllowed(): boolean {
  return (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
    && !process.env.VERCEL && !process.env.VERCEL_ENV
}

/** Shared, uncached server lookup: page and POST validate the same current envelope. */
export function getFeedbackForm(slug: unknown): FeedbackFormConfig | null {
  if (typeof window !== 'undefined') throw new Error('Feedback forms are server-only')
  if (!slugSchema.safeParse(slug).success) return null
  const key = slug as string
  if (key === GENERAL_FEEDBACK_FORM.slug) return GENERAL_FEEDBACK_FORM
  // Private form configuration is never consumed by a hosted preview/development deployment.
  if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production')
    || (process.env.VERCEL && process.env.VERCEL_ENV !== 'production')) return null
  const raw = process.env.FEEDBACK_FORMS_JSON
  if (!raw?.trim()) return localSamplesAllowed() && Object.hasOwn(FEEDBACK_FORMS, key) ? FEEDBACK_FORMS[key] : null
  if (raw.length > 131_072) throw new FeedbackFormsConfigurationError()
  let value: unknown
  try { value = JSON.parse(raw) } catch { throw new FeedbackFormsConfigurationError() }
  const parsed = envelopeSchema.safeParse(value)
  if (!parsed.success || Object.keys(parsed.data.forms).length > 25) throw new FeedbackFormsConfigurationError()
  for (const [name, form] of Object.entries(parsed.data.forms)) {
    if (name !== form.slug || !FEEDBACK_UI.intro.body.includes(form.consent.privacyLine)) throw new FeedbackFormsConfigurationError()
  }
  return Object.hasOwn(parsed.data.forms, key) ? parsed.data.forms[key] : null
}
