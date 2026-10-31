import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { escapeHtml } from '@/lib/escape-html'
import { FROM_EMAIL, sendEmail } from '@/lib/resend'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { isValidEmail, normalizeEmail } from '@/lib/form-guard/validation'
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content'
import { sprintInquirySchema, type SprintInquiry, type SprintTrackId } from '@/src/lib/sprint-inquiry'
import { SPRINT_FIT_CALL_URL, SPRINT_TRACK_NAMES } from '@/src/ai-build-sprint-content'
import { FIT } from '@/src/sprint-fit-content'
import { FIT_VERSION, evaluateFit, fitBriefText } from '@/src/lib/sprint-fit'
import { BRIEF_CONTENT } from '@/src/sprint-brief-content'
import { buildSprintBrief, type SprintBrief } from '@/src/lib/sprint-brief'
import { normalizeWebsite } from '@/src/lib/simulator/profile/domain'
import { getCachedProfile } from '@/src/lib/simulator/server/db'
import { enrichSprintNarrative } from '@/src/lib/sprint-fit/narrative'
import { renderSprintBriefEmail } from '@/src/lib/sprint-brief-export'
import { parseEntryPoint } from '@/src/lib/funnel/entry'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@vibrana.ai'
const NOT_COLLECTED = 'Not collected'

/** `department_focus` keeps the original values for product/workflow so existing reporting still groups correctly. */
const DEPARTMENT_FOCUS: Record<SprintTrackId, string> = {
  product: 'AI product build',
  workflow: 'AI workflow build',
  governance: 'AI governance and policy',
  people: 'AI people and culture',
  triage: 'Workflow triage',
  'not-sure': 'Sprint track undecided',
}

/** A stable UUID primary key provides cross-process duplicate protection without a new table. */
function submissionReceipt(email: string, submissionId: string): string {
  const hex = createHash('sha256').update(`vibrana.ai/sprint-brief/v2\0${email}\0${submissionId}`).digest('hex')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`
}
function fingerprint(input: SprintInquiry): string {
  return createHash('sha256').update(JSON.stringify({ name: input.name, role: input.role, track: input.track, answers: input.fitCheck, company: input.briefRequest?.company, businessCase: input.briefRequest?.businessCase })).digest('hex')
}
type SavedMetadata = Record<string, unknown> & { brief_snapshot?: SprintBrief; input_fingerprint?: string; email_delivered?: boolean }

async function readSaved(id: string, email: string) {
  return supabase.from('engagement_inquiries').select('id,metadata').eq('id', id).eq('email', email).maybeSingle()
}
async function sendSavedBrief(email: string, id: string, brief: SprintBrief): Promise<boolean> {
  try {
    const result = await sendEmail({ from: FROM_EMAIL, to: email, subject: BRIEF_CONTENT.emailSubject, html: renderSprintBriefEmail(brief), idempotencyKey: `sprint-brief/${id}` })
    if (result.error) console.error('Sprint brief email failed')
    return !result.error
  } catch { console.error('Sprint brief email failed'); return false }
}
async function savedResponse(id: string, email: string, metadata: SavedMetadata, input: SprintInquiry) {
  if (!metadata.brief_snapshot || metadata.input_fingerprint !== fingerprint(input)) return NextResponse.json({ error: 'This submission has changed. Please create a new brief.' }, { status: 409 })
  let emailDelivered = metadata.email_delivered === true
  // Resend retains idempotency keys for 24 hours; keep explicit retries inside that window.
  const age = Date.now() - new Date(metadata.brief_snapshot.createdAt).getTime()
  if (!emailDelivered && input.resendEmail && age >= 0 && age < 23 * 60 * 60 * 1000) {
    emailDelivered = await sendSavedBrief(email, id, metadata.brief_snapshot)
    if (emailDelivered) await supabase.from('engagement_inquiries').update({ metadata: { ...metadata, email_delivered: true } }).eq('id', id).eq('email', email)
  }
  return NextResponse.json({ success: true, inquiryId: id, brief: metadata.brief_snapshot, emailDelivered })
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = sprintInquirySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check the form fields' }, { status: 400 })
    const input = parsed.data
    const email = normalizeEmail(input.email)
    if (!isValidEmail(email)) return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 })
    const guard = await guardSubmission({ config: FORM_GUARDS.sprintInquiries, headers: request.headers, ...guardFieldsFromBody(raw), email })
    if (guard.action === 'drop') return NextResponse.json({ success: true })
    if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })

    const id = input.briefRequest ? submissionReceipt(email, input.briefRequest.submissionId) : undefined
    if (id) {
      const saved = await readSaved(id, email)
      if (saved.error) return NextResponse.json({ error: 'We could not check your saved brief. Please try again.' }, { status: 500 })
      if (saved.data) return savedResponse(id, email, saved.data.metadata as SavedMetadata, input)
    }

    let brief: SprintBrief | undefined
    if (input.briefRequest && input.fitCheck) {
      const site = normalizeWebsite(input.briefRequest.company.website)
      if (input.briefRequest.company.website && !site) return NextResponse.json({ error: 'Enter a public company website or choose no website.' }, { status: 400 })
      const profile = site ? await getCachedProfile(site.domain).catch(() => null) : null
      // The client can correct company facts, but cannot supply trusted website provenance or image URLs.
      const confirmed = { ...input.briefRequest, company: { ...input.briefRequest.company, name: input.briefRequest.company.name || input.name, website: site?.url ?? '' } }
      brief = await enrichSprintNarrative(buildSprintBrief(input.fitCheck, confirmed, profile))
    }
    const companyName = brief?.company.name ?? input.companyName
    const website = brief?.company.website ?? input.companyWebsite
    // An unnamed founder has no company record to merge by name. The contact name
    // remains a prepared-for display value on the brief and inquiry only.
    const hasCompany = input.briefRequest ? Boolean(input.briefRequest.company.name) : Boolean(input.companyName)
    let companyId: string | null = null
    if (hasCompany) {
      const { data: company, error: companyError } = await supabase.from('companies')
        .upsert({ name: companyName, website: website || null }, { onConflict: 'name' }).select('id').single()
      if (companyError || !company) {
        console.error('Sprint company save failed')
        return NextResponse.json({ error: 'We couldn’t save the company details. Please try again.' }, { status: 500 })
      }
      companyId = company.id
    }
    const metadata: SavedMetadata = {
      desired_outcome: input.desiredOutcome, internal_owner: input.internalOwner || null,
      start_window: input.startWindow || null, budget_band: input.budgetBand || null,
      form_version: brief?.version ?? (input.fitCheck ? FIT_VERSION : 'fit-call-v1'),
      ...(input.fitCheck ? { fit_check: input.fitCheck, fit_route: evaluateFit(input.fitCheck).route } : {}),
      ...(brief ? { brief_snapshot: brief, input_fingerprint: fingerprint(input), email_delivered: false } : {}),
      utm_source: input.utm_source, utm_medium: input.utm_medium, utm_campaign: input.utm_campaign, utm_content: input.utm_content, referrer: input.referrer,
      entry_point: parseEntryPoint(raw?.entry) ?? 'sprint',
    }
    const { data: inquiry, error: inquiryError } = await supabase.from('engagement_inquiries').insert({
      ...(id ? { id } : {}), company_id: companyId, company_name: companyName, contact_name: input.name, email,
      team_size: NOT_COLLECTED, revenue_band: NOT_COLLECTED, department_focus: DEPARTMENT_FOCUS[input.track],
      timeline: input.startWindow || NOT_COLLECTED, goals: input.desiredOutcome, status: 'new', source: input.utm_source || 'vibrana-website',
      intent: 'ai_build_sprint', track: input.track, role: input.role || null, website: website || null, metadata,
    }).select('id').single()
    if (inquiryError || !inquiry) {
      // A concurrent request won the primary-key race. Return its immutable saved snapshot.
      if (id && inquiryError?.code === '23505') {
        const saved = await readSaved(id, email)
        if (saved.data) return savedResponse(id, email, saved.data.metadata as SavedMetadata, input)
      }
      console.error('Sprint inquiry save failed')
      return NextResponse.json({ error: 'We couldn’t save your request. Please try again.' }, { status: 500 })
    }
    const [adminResult, confirmationResult] = await Promise.all([
      sendEmail({ from: FROM_EMAIL, to: ADMIN_EMAIL, replyTo: email,
        subject: `[Sprint fit call: ${SPRINT_TRACK_NAMES[input.track]}] ${input.name} at ${companyName}`,
        html: `${adminEmail(input, inquiry.id)}${brief ? renderSprintBriefEmail(brief) : ''}`,
        ...(id ? { idempotencyKey: `sprint-brief-admin/${id}` } : {}),
      }),
      brief ? sendSavedBrief(email, inquiry.id, brief).then(ok => ({ error: ok ? null : true })) : sendEmail({ from: FROM_EMAIL, to: email,
        subject: input.fitCheck ? FIT.result.emailSubject : 'Your Vibrana fit-call request is in',
        html: input.fitCheck ? fitConfirmationEmail(input.fitCheck) : confirmationEmail(input.name, input.track),
      }),
    ])
    if (adminResult.error) console.error('Sprint admin email failed')
    if (confirmationResult.error) console.error('Sprint confirmation email failed')
    if (brief) {
      const emailDelivered = !confirmationResult.error
      if (emailDelivered) {
        const updated = await supabase.from('engagement_inquiries').update({ metadata: { ...metadata, email_delivered: true } }).eq('id', inquiry.id).eq('email', email)
        if (updated.error) console.error('Sprint email delivery receipt save failed')
      }
      return NextResponse.json({ success: true, inquiryId: inquiry.id, brief, emailDelivered })
    }
    return NextResponse.json({ success: true, inquiryId: inquiry.id })
  } catch {
    console.error('Sprint inquiry request failed')
    return NextResponse.json({ error: 'We couldn’t save your request. Please try again.' }, { status: 500 })
  }
}

function adminEmail(input: SprintInquiry, inquiryId: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#0f0f11">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#7c3aed">AI Build Sprint fit-call request</p>
      <h1 style="font-size:28px;margin:8px 0 24px">${escapeHtml(input.name)} · ${escapeHtml(input.companyName)}</h1>
      <table style="width:100%;border-collapse:collapse">
        ${row('Inquiry', inquiryId)}
        ${row('Track', `${SPRINT_TRACK_NAMES[input.track]} (${input.track})`)}
        ${row('Email', input.email)}
        ${input.role ? row('Role', input.role) : ''}
        ${input.companyWebsite ? row('Website', input.companyWebsite) : ''}
        ${input.internalOwner ? row('Internal owner', input.internalOwner) : ''}
        ${input.startWindow ? row('Start window', input.startWindow) : ''}
        ${input.budgetBand ? row('Budget', input.budgetBand) : ''}
        ${row('Source', input.utm_source || 'Direct')}
        ${row('Campaign', input.utm_campaign || 'None')}
      </table>
      <h2 style="font-size:16px;margin-top:24px">What should work differently after ten days</h2>
      <p style="white-space:pre-wrap;line-height:1.6;background:#f4f4f5;padding:16px;border-radius:8px">${escapeHtml(input.fitCheck ? fitBriefText(input.fitCheck) : input.desiredOutcome)}</p>
    </div>`
}

function confirmationEmail(name: string, track: SprintTrackId) {
  const heading = track === 'not-sure' ? 'Your fit-call request is in.' : `Your ${SPRINT_TRACK_NAMES[track]} fit-call request is in.`
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f0f11">
      <p>Hi ${escapeHtml(name)},</p>
      <h1 style="font-size:26px">${escapeHtml(heading)}</h1>
      <p style="line-height:1.6">We'll read what you want to work differently and come to the call with a view on scope, readiness and the right track. The next step is a 30-minute fit call.</p>
      <p style="margin:28px 0"><a href="${SPRINT_FIT_CALL_URL}" style="background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:8px">Book the fit call</a></p>
      <p style="line-height:1.6;color:#6b6375">Please do not email confidential data or credentials. We normally reply within two working days.</p>
      <p style="margin-top:24px">John and the Vibrana team</p>
    </div>`
}

function row(label: string, value: string) {
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-weight:600;width:150px">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid #e5e5e5">${escapeHtml(value)}</td></tr>`
}

function fitConfirmationEmail(answers: NonNullable<SprintInquiry['fitCheck']>) {
  return `<div style="font-family:system-ui,sans-serif;max-width:680px;margin:auto;padding:28px"><h1>${escapeHtml(FIT.result.title)}</h1><p>${escapeHtml(FIT.result.emailIntro)}</p><pre style="font:15px/1.7 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(fitBriefText(answers))}</pre><p><a href="${SPRINT_FIT_CALL_URL}">${escapeHtml(FIT.result.call)}</a></p></div>`
}
