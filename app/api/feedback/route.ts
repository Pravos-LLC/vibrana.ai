import { createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FROM_EMAIL, sendEmail } from '@/lib/resend'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission, withinGlobalBudget } from '@/lib/form-guard/server'
import { FeedbackFormsConfigurationError, getFeedbackForm } from '@/lib/feedback/forms'
import {
  MAX_BODY_CHARS,
  buildSubmissionSchema,
  MAX_LINKS,
  compactAnswers,
  countLinks,
  evaluateConsent,
} from '@/lib/feedback/submission'
import { feedbackEmailHtml, feedbackEmailText, feedbackSubject } from '@/lib/feedback/email'

export const dynamic = 'force-dynamic'

const SAVE_FAILED = 'We could not save your answers. Please try again.'
const NOT_VERIFIED = 'We could not confirm this submission yet. Please try again in a moment.'
const TOO_BUSY = 'We are receiving a lot of responses right now. Please try again in a little while.'
const NO_LINKS = 'Please remove the links from your answers and send again.'

/** Shared budgets for a flood spread over many IPs. Far above anything a real respondent group reaches. */
const SAVES_PER_DAY = 200
const EMAILS_PER_HOUR = 20

function hashUserAgent(ua: string | null): string | null {
  if (!ua) return null
  const key = process.env.FORM_GUARD_SECRET || process.env.SUPABASE_SERVICE_KEY || 'client-feedback'
  return createHmac('sha256', key).update('feedback-ua\0').update(ua).digest('hex').slice(0, 32)
}

/**
 * Saves one response. The row is written first and is the source of truth: a failed email is
 * logged and never turns into an error for the respondent, while a failed write is reported so the
 * form can offer a retry. The client supplies the row id, so a retry cannot double-save.
 */
export async function POST(request: NextRequest) {
  // The form posts from its own page. A browser always sends Origin on a cross-site POST, so a different
  // host is another site's script, not this form. (Scripts can forge the header; BotID and the guard below
  // are the real defence. This only turns away the lazy cross-site case.)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host) {
    let originHost = ''
    try { originHost = new URL(origin).host } catch { /* treated as a mismatch */ }
    if (originHost !== host) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_CHARS * 4) {
    return NextResponse.json({ error: 'That response is too long.' }, { status: 413 })
  }
  const text = await request.text()
  if (text.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: 'That response is too long.' }, { status: 413 })
  }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  let form
  try { form = getFeedbackForm((raw as { slug?: unknown } | null)?.slug) }
  catch (error) {
    if (error instanceof FeedbackFormsConfigurationError) return NextResponse.json({ error: SAVE_FAILED }, { status: 503 })
    throw error
  }
  if (!form) return NextResponse.json({ error: 'Unknown form.' }, { status: 404 })

  const parsed = buildSubmissionSchema(form).safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Some answers were not valid. Please check and try again.' }, { status: 400 })
  }
  const submission = parsed.data

  // Honeypot, signed fill-time token, BotID and IP limits. Bots get a success with nothing saved.
  const guard = await guardSubmission({
    config: FORM_GUARDS.clientFeedback,
    headers: request.headers,
    ...guardFieldsFromBody(raw),
  })
  if (guard.action === 'drop') {
    // Only a filled honeypot is a bot we can wave through. Every other drop (token missing or not yet
    // old enough, rate limit, BotID) can hit a real respondent, so it is a retryable error: the form
    // keeps the answers and the person is never told "thank you" for something that was not saved.
    if (guard.reason === 'honeypot') return NextResponse.json({ success: true })
    return NextResponse.json({ error: NOT_VERIFIED, retryable: true }, { status: 503 })
  }
  if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })

  if (countLinks(submission) > MAX_LINKS) {
    return NextResponse.json({ error: NO_LINKS }, { status: 400 })
  }
  const score = submission.answers[form.scoreQuestionId] as number
  const consent = evaluateConsent(form, score, submission)
  if (consent.status === 'forbidden') {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  if (consent.status === 'invalid') {
    return NextResponse.json({ error: 'Please choose how to credit you and add your email so we can confirm the wording.' }, { status: 400 })
  }
  if (consent.status === 'stale') {
    return NextResponse.json(
      { error: 'This form was updated while you were filling it in. Please refresh the page and try again.' },
      { status: 409 },
    )
  }

  // Last check before anything is written (only requests that would be saved spend it): a shared daily budget, so a flood across many IPs cannot grow the table.
  if (!(await withinGlobalBudget(FORM_GUARDS.clientFeedback.endpoint, 'save', SAVES_PER_DAY, 24 * 60 * 60))) {
    console.warn('[feedback] daily save budget reached')
    return NextResponse.json({ error: TOO_BUSY, retryable: true }, { status: 429 })
  }

  const answers = compactAnswers(submission.answers) as Record<string, unknown>
  const contact = (answers.contact ?? {}) as { name?: unknown; email?: unknown }
  const contactName = typeof contact.name === 'string' && contact.name ? contact.name : null

  const row = {
    id: submission.submissionId,
    slug: form.slug,
    answers,
    overall_score: score,
    consent:
      consent.status === 'recorded'
        ? {
            testimonial: consent.testimonial,
            ...(consent.attribution ? { attribution: consent.attribution } : {}),
            ...(consent.text ? { text: consent.text } : {}),
          }
        : null,
    consent_text_version: consent.status === 'recorded' ? consent.version : null,
    consent_text_snapshot: consent.status === 'recorded' ? consent.snapshot : null,
    consent_at: consent.status === 'recorded' && consent.testimonial ? new Date().toISOString() : null,
    user_agent_hash: hashUserAgent(request.headers.get('user-agent')),
  }

  const { error } = await supabase.from('client_feedback').insert(row)
  if (error) {
    // 23505: this id is already saved, so the first attempt worked and only its response was lost.
    if (error.code === '23505') return NextResponse.json({ success: true, saved: true })
    console.error('[feedback] insert failed')
    return NextResponse.json({ error: SAVE_FAILED }, { status: 500 })
  }

  const notifyTo = process.env.FEEDBACK_NOTIFY_EMAIL || process.env.ADMIN_EMAIL
  // The row is already saved. Past the hourly budget the notification is skipped, so a flood cannot turn
  // into a mailbox flood (or a Resend bill); the saved rows are still there to read.
  if (notifyTo && !(await withinGlobalBudget(FORM_GUARDS.clientFeedback.endpoint, 'notify', EMAILS_PER_HOUR, 60 * 60))) {
    console.warn('[feedback] hourly notification budget reached; saved without an email')
  } else if (!notifyTo) {
    console.warn('[feedback] FEEDBACK_NOTIFY_EMAIL is not set; saved without a notification email.')
  } else {
    try {
      const input = {
        form,
        id: row.id,
        contactName,
        score,
        answers,
        consent,
      }
      const result = await sendEmail({
        suppressErrorDetails: true,
        from: FROM_EMAIL,
        to: notifyTo,
        subject: feedbackSubject(input),
        html: feedbackEmailHtml(input),
        text: feedbackEmailText(input),
        tags: [{ name: 'type', value: 'client-feedback' }],
      })
      if (result.error) console.error('[feedback] notification email failed')
    } catch {
      console.error('[feedback] notification email threw')
    }
  }

  return NextResponse.json({ success: true, saved: true })
}
