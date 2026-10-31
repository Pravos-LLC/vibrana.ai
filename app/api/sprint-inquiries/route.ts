import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { escapeHtml } from '@/lib/escape-html'
import { FROM_EMAIL, sendEmail } from '@/lib/resend'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { isValidEmail, normalizeEmail } from '@/lib/form-guard/validation'
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content'
import { sprintInquirySchema, type SprintInquiry, type SprintTrackId } from '@/src/lib/sprint-inquiry'
import { SPRINT_FIT_CALL_URL, SPRINT_TRACK_NAMES } from '@/src/ai-build-sprint-content'
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

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = sprintInquirySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check the form fields' }, { status: 400 })
    }

    const input = parsed.data
    const email = normalizeEmail(input.email)
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 })
    }

    // The schema already rejects a filled botField. This adds the signed fill-time token,
    // BotID and rate limits. Bots and over-limit senders get a success response with nothing saved or mailed.
    const guard = await guardSubmission({
      config: FORM_GUARDS.sprintInquiries,
      headers: request.headers,
      ...guardFieldsFromBody(raw),
      email,
    })
    if (guard.action === 'drop') return NextResponse.json({ success: true })
    if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({ name: input.companyName, website: input.companyWebsite || null }, { onConflict: 'name' })
      .select('id')
      .single()

    if (companyError) {
      console.error('Sprint company upsert error:', companyError)
      return NextResponse.json({ error: 'We couldn’t save the company details. Please try again.' }, { status: 500 })
    }

    const source = input.utm_source || 'vibrana-website'
    const metadata = {
      desired_outcome: input.desiredOutcome,
      internal_owner: input.internalOwner || null,
      start_window: input.startWindow || null,
      budget_band: input.budgetBand || null,
      form_version: 'fit-call-v1',
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_content: input.utm_content,
      referrer: input.referrer,
      // Front door (docs/funnel-measurement.md): the sprint page unless the form said otherwise.
      entry_point: parseEntryPoint(raw?.entry) ?? 'sprint',
    }

    const { data: inquiry, error: inquiryError } = await supabase
      .from('engagement_inquiries')
      .insert({
        company_id: company.id,
        company_name: input.companyName,
        contact_name: input.name,
        email,
        team_size: NOT_COLLECTED,
        revenue_band: NOT_COLLECTED,
        department_focus: DEPARTMENT_FOCUS[input.track],
        timeline: input.startWindow || NOT_COLLECTED,
        goals: input.desiredOutcome,
        status: 'new',
        source,
        intent: 'ai_build_sprint',
        track: input.track,
        role: input.role || null,
        website: input.companyWebsite || null,
        metadata,
      })
      .select('id')
      .single()

    if (inquiryError) {
      console.error('Sprint inquiry insert error:', inquiryError)
      return NextResponse.json({ error: 'We couldn’t save your request. Please try again.' }, { status: 500 })
    }

    const [adminResult, confirmationResult] = await Promise.all([
      sendEmail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `[Sprint fit call: ${SPRINT_TRACK_NAMES[input.track]}] ${input.name} at ${input.companyName}`,
        html: adminEmail(input, inquiry.id),
      }),
      sendEmail({
        from: FROM_EMAIL,
        to: email,
        subject: 'Your Vibrana fit-call request is in',
        html: confirmationEmail(input.name, input.track),
      }),
    ])

    if (adminResult.error) console.error('Sprint admin email failed:', adminResult.error)
    if (confirmationResult.error) console.error('Sprint confirmation email failed:', confirmationResult.error)

    return NextResponse.json({ success: true, inquiryId: inquiry.id })
  } catch (error) {
    console.error('Sprint inquiry error:', error)
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
      <p style="white-space:pre-wrap;line-height:1.6;background:#f4f4f5;padding:16px;border-radius:8px">${escapeHtml(input.desiredOutcome)}</p>
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
