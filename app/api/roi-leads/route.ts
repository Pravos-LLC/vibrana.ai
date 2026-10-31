import { NextRequest, NextResponse } from 'next/server'
import { saveLead } from '@/src/lib/assessment/db'
import { FROM_EMAIL, sendEmail } from '@/lib/resend'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { isValidEmail, normalizeEmail } from '@/lib/form-guard/validation'
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content'
import { calculate, type Assumptions, type WorkflowInput } from '@/src/lib/roi/calc'
import { adminEmailHtml, estimateEmailHtml } from '@/src/lib/roi/email'
import { ROI_ENTRY_POINT, roiLeadSchema } from '@/src/lib/roi/lead'
import { ROI_EMAIL, ROI_LEAD_EMAIL } from '@/src/roi-calculator-content'
import { parseEntryPoint } from '@/src/lib/funnel/entry'
import { recordFunnelEvent } from '@/src/lib/funnel/db'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@vibrana.ai'

/**
 * "Email me this" on the Workflow ROI calculator. Saves the lead through the same
 * assessment_leads pattern as the assessment and simulator (source `roi-calculator`),
 * recomputes the estimate from the submitted inputs, and emails it to the visitor
 * with a copy to the team.
 */
export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = roiLeadSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || ROI_EMAIL.errors.fallback }, { status: 400 })
    }
    const input = parsed.data
    const email = normalizeEmail(input.email)
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 })
    }

    // Bots and over-limit senders get the normal success response; nothing is saved or mailed.
    const guard = await guardSubmission({
      config: FORM_GUARDS.roiLeads,
      headers: request.headers,
      ...guardFieldsFromBody(raw),
      email,
    })
    if (guard.action === 'drop') return NextResponse.json({ success: true })
    if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })

    const inputs: WorkflowInput[] = input.workflows
    const assumptions: Assumptions = {
      currency: input.currency,
      weeksPerYear: input.weeksPerYear,
      workWeekHours: input.workWeekHours,
      sprintCost: input.sprintCost,
      runCostPerMonth: input.runCostPerMonth,
    }
    if (!(calculate(inputs, assumptions).totals.hoursFreed.expected > 0)) {
      return NextResponse.json({ error: ROI_EMAIL.errors.empty }, { status: 400 })
    }

    const domain = email.split('@')[1] || ''
    const company = input.companyName || domain.split('.')[0] || 'Unknown'
    const saved = await saveLead({
      email,
      company_name: company,
      website: domain ? `https://${domain}` : '',
      linkedin: '',
      source: ROI_ENTRY_POINT,
    })
    if (!saved.success) console.error('ROI lead save failed:', saved.error)
    // Counted per estimate in funnel_events: assessment_leads keeps one row and the first source per address.
    await recordFunnelEvent('roi_lead', parseEntryPoint(raw?.entry) ?? 'roi')

    const [visitor, admin] = await Promise.all([
      sendEmail({ from: FROM_EMAIL, to: email, subject: ROI_LEAD_EMAIL.subject, html: estimateEmailHtml(inputs, assumptions) }),
      sendEmail({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: email,
        subject: `[${ROI_LEAD_EMAIL.admin.subject}] ${company}`,
        html: adminEmailHtml({ email, company: input.companyName, inputs, assumptions }),
      }),
    ])
    if (admin.error) console.error('ROI admin email failed:', admin.error)
    if (visitor.error) {
      console.error('ROI estimate email failed:', visitor.error)
      return NextResponse.json({ error: ROI_EMAIL.errors.fallback }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ROI lead error:', error)
    return NextResponse.json({ error: ROI_EMAIL.errors.fallback }, { status: 500 })
  }
}
