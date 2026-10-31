import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { escapeHtml } from '@/lib/escape-html'
import { sendEmail, FROM_EMAIL } from '@/lib/resend'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { isValidEmail, normalizeEmail } from '@/lib/form-guard/validation'
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content'
import { COMPANY_BRAIN_LAB_INTENT, COMPANY_BRAIN_LAB_LIMITS } from '@/lib/company-brain-lab-application'
import { COMPANY_BRAIN_LAB } from '@/src/company-brain-lab-content'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@vibrana.ai'

const enterpriseInquirySchema = z.object({
  intent: z.string().max(120).optional().default('Not specified'),
  contactName: z.string().min(1, 'Contact name is required').max(120, 'Name is too long'),
  email: z.string().trim().email('A valid work email is required').max(255, 'Email is too long'),
  companyName: z.string().min(1, 'Company name is required').max(160, 'Company name is too long'),
  teamSize: z.string().min(1, 'Team size is required').max(80, 'Team size is too long'),
  revenueBand: z.string().min(1, 'Revenue band is required').max(80, 'Revenue band is too long'),
  departmentFocus: z.string().min(1, 'Department focus is required').max(200, 'Department focus is too long'),
  timeline: z.string().min(1, 'Timeline is required').max(80, 'Timeline is too long'),
  goals: z.string().min(20, 'Please provide more detail on goals').max(4000, 'Goals are too long'),
})

// The Company Brain Lab application asks for six long-form answers. They get their own
// fields and limits here instead of being squeezed into departmentFocus/goals by the client.
const labFields = COMPANY_BRAIN_LAB.application.fields
const labMessages = COMPANY_BRAIN_LAB.application.validation
const LAB_LABELS = {
  implementationOwner: labFields.owner,
  workflow: labFields.workflow,
  importance: labFields.importance,
  access: labFields.access,
  commitment: labFields.commitment,
  constraints: labFields.constraints,
} as const

function labAnswer(field: keyof typeof COMPANY_BRAIN_LAB_LIMITS) {
  const { min, max } = COMPANY_BRAIN_LAB_LIMITS[field]
  const label = LAB_LABELS[field]
  const base = z.string().trim().max(max, labMessages.tooLong(label, max))
  if (min === 0) return base.optional().default('')
  return base.min(min, min === 1 ? labMessages.required(label) : labMessages.tooShort(label, min))
}

const companyBrainLabSchema = z.object({
  intent: z.literal(COMPANY_BRAIN_LAB_INTENT),
  contactName: enterpriseInquirySchema.shape.contactName,
  email: enterpriseInquirySchema.shape.email,
  companyName: enterpriseInquirySchema.shape.companyName,
  teamSize: enterpriseInquirySchema.shape.teamSize,
  implementationOwner: labAnswer('implementationOwner'),
  workflow: labAnswer('workflow'),
  importance: labAnswer('importance'),
  access: labAnswer('access'),
  commitment: labAnswer('commitment'),
  constraints: labAnswer('constraints'),
})

type InquiryRecord = z.infer<typeof enterpriseInquirySchema>
type ParseResult = { ok: true; data: InquiryRecord; lab?: z.infer<typeof companyBrainLabSchema> } | { ok: false; error: string }

/** Validates either inquiry shape and returns the row every inquiry is stored as. */
function parseInquiry(body: unknown): ParseResult {
  const isLab = typeof body === 'object' && body !== null && (body as { intent?: unknown }).intent === COMPANY_BRAIN_LAB_INTENT

  if (!isLab) {
    const parsed = enterpriseInquirySchema.safeParse(body)
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: parsed.error.issues[0].message }
  }

  const parsed = companyBrainLabSchema.safeParse(body)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const lab = parsed.data
  const record = COMPANY_BRAIN_LAB.application.record
  return {
    ok: true,
    lab,
    data: {
      intent: lab.intent,
      contactName: lab.contactName,
      email: lab.email,
      companyName: lab.companyName,
      teamSize: lab.teamSize,
      revenueBand: record.revenueBand,
      departmentFocus: record.departmentFocus,
      timeline: record.timeline,
      goals: (Object.keys(LAB_LABELS) as (keyof typeof LAB_LABELS)[])
        .map((field) => `${LAB_LABELS[field]}: ${lab[field] || record.noneStated}`)
        .join('\n\n'),
    },
  }
}

const SUCCESS_BODY = {
  success: true,
  message: 'Thanks. We will review your inquiry and respond with next steps shortly.',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = parseInquiry(body)

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const data = parsed.data
    const normalizedEmail = normalizeEmail(data.email)
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 })
    }

    // Bots and over-limit senders get the normal success response: nothing saved, nothing mailed.
    const guard = await guardSubmission({
      config: FORM_GUARDS.enterpriseInquiry,
      headers: req.headers,
      ...guardFieldsFromBody(body),
      email: normalizedEmail,
    })
    if (guard.action === 'drop') return NextResponse.json(SUCCESS_BODY)
    if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert(
        {
          name: data.companyName,
          company_size: data.teamSize,
          // Lab applications don't ask for revenue; never overwrite a known band with a placeholder.
          ...(parsed.lab ? {} : { revenue_band: data.revenueBand }),
        },
        { onConflict: 'name' }
      )
      .select('id')
      .single()

    if (companyError) {
      console.error('Company upsert error:', companyError)
      return NextResponse.json({ error: 'Failed to save company information' }, { status: 500 })
    }

    const { error: inquiryError } = await supabase.from('engagement_inquiries').insert({
      company_id: company.id,
      company_name: data.companyName,
      contact_name: data.contactName,
      email: normalizedEmail,
      team_size: data.teamSize,
      revenue_band: data.revenueBand,
      department_focus: data.departmentFocus,
      timeline: data.timeline,
      goals: data.goals,
      source: 'website',
      intent: data.intent === 'AI builder sprint' ? 'ai_build_sprint' : 'ai_native_transformation',
      metadata: parsed.lab
        ? {
            submitted_intent: data.intent,
            company_brain_lab: {
              implementation_owner: parsed.lab.implementationOwner,
              workflow: parsed.lab.workflow,
              importance: parsed.lab.importance,
              access: parsed.lab.access,
              commitment: parsed.lab.commitment,
              constraints: parsed.lab.constraints,
            },
          }
        : { submitted_intent: data.intent },
    })

    if (inquiryError) {
      console.error('Inquiry insert error:', inquiryError)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    const adminHtml = getAdminNotificationHtml(data)
    const confirmationHtml = parsed.lab
      ? getLabConfirmationHtml(data.contactName, data.companyName)
      : getConfirmationHtml(data.contactName, data.companyName)

    const [adminResult, confirmationResult] = await Promise.all([
      sendEmail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[Vibrana Inquiry — ${data.intent}] from ${data.contactName} at ${data.companyName}`,
        html: adminHtml,
      }),
      sendEmail({
        from: FROM_EMAIL,
        to: normalizedEmail,
        subject: parsed.lab ? COMPANY_BRAIN_LAB.application.confirmationEmail.subject : `We received your Vibrana inquiry`,
        html: confirmationHtml,
      }),
    ])

    if (adminResult.error) {
      console.error('Enterprise admin notification failed:', adminResult.error)
    }

    if (confirmationResult.error) {
      console.error('Enterprise confirmation failed:', confirmationResult.error)
    }

    return NextResponse.json(SUCCESS_BODY)
  } catch (error) {
    console.error('Enterprise inquiry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getAdminNotificationHtml(data: InquiryRecord) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">New enterprise inquiry</h1>
      <div style="margin-bottom: 16px; padding: 10px 14px; background: #f0fdf4; border-left: 4px solid #7c3aed; font-weight: 600; font-size: 14px;">
        ${escapeHtml(data.intent)}
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Contact', escapeHtml(data.contactName))}
        ${row('Email', `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`)}
        ${row('Company', escapeHtml(data.companyName))}
        ${row('Team size', escapeHtml(data.teamSize))}
        ${row('Revenue band', escapeHtml(data.revenueBand))}
        ${row('Department focus', escapeHtml(data.departmentFocus))}
        ${row('Timeline', escapeHtml(data.timeline))}
      </table>
      <h2 style="font-size: 16px; margin-top: 24px;">Goals</h2>
      <div style="border-left: 4px solid #7c3aed; padding: 12px 16px; background: #f6f6f6; color: #333; white-space: pre-wrap;">
        ${escapeHtml(data.goals)}
      </div>
    </div>
  `
}

function getLabConfirmationHtml(contactName: string, companyName: string) {
  const email = COMPANY_BRAIN_LAB.application.confirmationEmail
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">${escapeHtml(email.heading)}</h1>
      <p>${escapeHtml(email.greeting(contactName))}</p>
      ${email.paragraphs(companyName).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n      ')}
      <p style="margin-top: 24px;">${escapeHtml(email.signoff)}</p>
    </div>
  `
}

function getConfirmationHtml(contactName: string, companyName: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 24px; margin-bottom: 16px;">Inquiry received</h1>
      <p>Hi ${escapeHtml(contactName)},</p>
      <p>Thanks for reaching out about AI transformation support for ${escapeHtml(companyName)}.</p>
      <p>We have your inquiry and will follow up with next steps after reviewing the context you shared.</p>
      <p style="margin-top: 24px;">Vibrana</p>
    </div>
  `
}

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600; width: 160px;">${label}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e5e5;">${value}</td>
    </tr>
  `
}
