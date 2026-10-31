import { NextRequest, NextResponse, after } from 'next/server'
import { Resend } from 'resend'
import { saveAssessment, claimAssessmentNotification, releaseAssessmentNotificationClaim } from '@/src/lib/assessment/db'
import { evaluate, validAnswers, type EUProfile } from '@/src/lib/eu-ai-act/engine'
import { EU_AI_ACT_INSTRUMENT_VERSION } from '@/src/eu-ai-act-questions-content'
import { EU_OBLIGATIONS } from '@/src/eu-ai-act-obligations-content'
import { EU_EMAIL } from '@/src/eu-ai-act-readiness-content'
import { INQUIRY_OPTIONS } from '@/src/enterprise-content'
import { adminHtml, followUpHtml, footerHtml, resultsEmailHtml } from '@/lib/eu-ai-act/email'
import { computeQualitySignals, parseAssessmentTiming } from '@/lib/assessment/quality-signals'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { LIMITS, cleanText, isValidEmail, normalizeEmail } from '@/lib/form-guard/validation'
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content'
import { parseEntryPoint } from '@/src/lib/funnel/entry'
import { cancelResendEmail, isOptedOut, listUnsubscribeHeaders, recordScheduledEmails, unsubscribePageUrl, type ScheduledSend } from '@/lib/unsubscribe'

// The EU AI Act Readiness assessment (docs/eu-ai-act-assessment-methodology.md). Scoring is a
// pure rules engine, so there is no model call: save, email the results, schedule two follow-ups.

const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = resendApiKey ? new Resend(resendApiKey) : null
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'john@vibrana.ai'
const FROM = 'Vibrana <hello@vibrana.ai>'
const CLAIM_SCOPE = 'eu-ai-act'
const DAY_MS = 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company, answers, startedAt } = body ?? {}

    if (!company || !validAnswers(answers)) {
      return NextResponse.json({ error: 'Invalid assessment payload' }, { status: 400 })
    }
    const email = normalizeEmail(company.email)
    const name = cleanText(company.name, LIMITS.companyName)
    const website = cleanText(company.website, LIMITS.url)
    const teamSize = (INQUIRY_OPTIONS.teamSizes as readonly string[]).includes(company.teamSize) ? (company.teamSize as string) : null
    const revenueBand = (INQUIRY_OPTIONS.revenueBands as readonly string[]).includes(company.revenueBand) ? (company.revenueBand as string) : null
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 })
    }
    if (!name || website === null || !teamSize || !revenueBand) {
      return NextResponse.json({ error: 'Company details are missing or invalid' }, { status: 400 })
    }

    const profile = evaluate(answers, { teamSize, revenueBand })

    // The engine is pure and cheap, so a dropped bot still gets plausible results back, but no
    // saved row and no email.
    const guard = await guardSubmission({ config: FORM_GUARDS.assessments, headers: request.headers, ...guardFieldsFromBody(body), email })
    if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })
    if (guard.action === 'drop') return NextResponse.json({ success: true, assessmentId: undefined, profile })

    const timing = parseAssessmentTiming(startedAt)
    const entryPoint = parseEntryPoint(body.entryPoint)
    const { success, data } = await saveAssessment({
      assessment_type: 'eu-ai-act',
      company_name: name,
      website: website || '',
      linkedin: '',
      email,
      team_size: teamSize,
      revenue_band: revenueBand,
      answers,
      instrument_version: EU_AI_ACT_INSTRUMENT_VERSION,
      compliance_profile: profile,
      dimension_scores: Object.fromEntries(profile.sectionScores.map((s) => [s.title, s.score ?? 0])),
      overall_score: profile.readinessScore,
      readiness_level: profile.readinessLevel,
      blockers: profile.obligations.filter((o) => o.status === 'gap').map((o) => o.id),
      recommendations: profile.obligations.map((o) => ({ id: o.id, status: o.status, appliesFrom: o.appliesFrom })),
      status: 'delivered',
      started_at: timing.started_at,
      completed_at: timing.completed_at,
      duration_seconds: timing.duration_seconds,
      // Exposure codes (100/70/40/0) are not scores, so quality signals read the scored answers only.
      quality_signals: computeQualitySignals({ answers: scoredOnly(answers), durationSeconds: timing.duration_seconds }),
      entry_point: entryPoint,
    })
    if (!success) return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 })
    const assessmentId: string | undefined = data?.[0]?.id

    after(async () => {
      try {
        await sendAdmin({ name, email, teamSize, revenueBand, profile, assessmentId, durationSeconds: timing.duration_seconds, entry: entryPoint })
      } catch (err) {
        console.error('EU AI Act admin notification error:', err)
      }
      // Same rule as the AI Readiness route: only the request that wins the claim emails, so a
      // resubmission cannot email-bomb an address; release it only when nothing went out.
      if (!(await claimAssessmentNotification(email, CLAIM_SCOPE))) return
      const resultsSent = await sendResults(email, name, profile)
      const followUps = await scheduleFollowUps(email, name, assessmentId)
      if (!resultsSent && !followUps.anySucceeded) await releaseAssessmentNotificationClaim(email, CLAIM_SCOPE)
    })

    return NextResponse.json({ success: true, assessmentId, profile })
  } catch (error) {
    console.error('EU AI Act assessment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function scoredOnly(answers: Record<string, number>): Record<string, number> {
  const scored = new Set(EU_OBLIGATIONS.flatMap((o) => o.questions))
  return Object.fromEntries(Object.entries(answers).filter(([id, s]) => scored.has(id) && s >= 0))
}

async function sendAdmin(p: { name: string; email: string; teamSize: string; revenueBand: string; profile: EUProfile; assessmentId?: string; durationSeconds: number | null; entry: string | null }) {
  if (!resend) return
  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: EU_EMAIL.admin.subject(p.name),
    html: adminHtml({ company: p.name, email: p.email, teamSize: p.teamSize, revenueBand: p.revenueBand, profile: p.profile, assessmentId: p.assessmentId, durationSeconds: p.durationSeconds, entry: p.entry }),
  })
  if (error) console.error('EU AI Act admin email error:', error.name)
}

async function sendResults(email: string, company: string, profile: EUProfile): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY is not configured. Skipping EU AI Act results email.')
    return false
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: email, cc: 'hello@vibrana.ai', subject: EU_EMAIL.subject, html: resultsEmailHtml(company, profile) })
    if (error) console.error('EU AI Act results email error:', error.name)
    return !error
  } catch (err) {
    console.error('EU AI Act results email exception:', err)
    return false
  }
}

async function scheduleFollowUps(email: string, company: string, assessmentId?: string): Promise<{ anySucceeded: boolean }> {
  if (!resend || (await isOptedOut(email))) return { anySucceeded: false }
  const unsubscribeUrl = unsubscribePageUrl(email)
  const headers = listUnsubscribeHeaders(email)
  if (!unsubscribeUrl || !headers) {
    console.error('EU AI Act follow-ups skipped: no unsubscribe secret')
    return { anySucceeded: false }
  }
  const footer = footerHtml(unsubscribeUrl)
  const sends: ScheduledSend[] = []
  let failures = 0
  for (const [i, f] of EU_EMAIL.followUps.entries()) {
    const when = new Date(Date.now() + f.day * DAY_MS)
    try {
      const { data, error } = await resend.emails.send({ from: FROM, to: email, subject: f.subject(company), scheduledAt: when.toISOString(), html: followUpHtml(i, footer), headers })
      if (data?.id) sends.push({ resendId: data.id, step: `day${f.day}`, scheduledFor: when })
      if (error) failures++
    } catch {
      failures++
    }
  }
  // A send nobody can find again is a send nobody can unsubscribe from: cancel it.
  if (sends.length && !(await recordScheduledEmails({ email, sequence: 'eu-ai-act-nurture', assessmentId, sends }))) {
    for (const s of sends) await cancelResendEmail(s.resendId)
    return { anySucceeded: false }
  }
  if (failures) console.error(`EU AI Act follow-ups: ${failures} of ${EU_EMAIL.followUps.length} failed`)
  return { anySucceeded: sends.length > 0 }
}
