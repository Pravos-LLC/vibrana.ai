/**
 * "Email me this" emails for the Workflow ROI calculator: the estimate to the visitor and a
 * notification to the team. Every user-entered value goes through escapeHtml.
 */
import { escapeHtml } from '@/lib/escape-html'
import { absoluteUrl } from '@/src/lib/site'
import { ROI_CTA, ROI_LEAD_EMAIL, ROI_RESULT, ROI_WORKFLOWS, ROI_ASSUMPTIONS } from '@/src/roi-calculator-content'
import { calculate, formatHours, formatMoney, formatMonths, type Assumptions, type Currency, type RoiResult, type WorkflowInput } from './calc'
import { ROI_ENTRY_POINT } from './lead'
import { withEntry } from '@/src/lib/funnel/entry'

const WRAP = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1a1530;line-height:1.5"
const CELL = 'padding:8px 10px 8px 0;border-bottom:1px solid #e5e5e5;vertical-align:top'
const fill = (t: string, v: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '')
const pctText = (n: number) => `${Number(n.toFixed(1))}%`

/** The payback line and, when the low end has no payback, the note that says so. */
export function paybackParts(result: RoiResult): { text: string; note: string | null } {
  const fast = formatMonths(result.paybackMonths.fastest)
  const slow = formatMonths(result.paybackMonths.slowest)
  const unit = (m: string) => (m === '1' ? ROI_RESULT.month : ROI_RESULT.months)
  if (fast && slow) {
    return { text: fill(fast === slow ? ROI_RESULT.paybackSame : ROI_RESULT.paybackRange, { fast, slow, unit: unit(fast) }), note: null }
  }
  if (fast) return { text: fill(ROI_RESULT.paybackNoLow, { fast, unit: unit(fast) }), note: ROI_RESULT.paybackNoLowNote }
  return { text: ROI_RESULT.paybackNone, note: null }
}

export function paybackText(result: RoiResult): string {
  const { text, note } = paybackParts(result)
  return note ? `${text}. ${note}` : text
}

export function estimateEmailHtml(inputs: WorkflowInput[], assumptions: Assumptions): string {
  const e = ROI_LEAD_EMAIL
  const c: Currency = assumptions.currency
  const result = calculate(inputs, assumptions)
  const byId = new Map(inputs.map((w) => [w.id, w]))
  const rows = result.workflows
    .map((r) => {
      const w = byId.get(r.id)!
      return `<tr>
        <td style="${CELL}">${escapeHtml(ROI_WORKFLOWS[r.id].name)}</td>
        <td style="${CELL}">${escapeHtml(`${w.people} x ${w.hoursPerWeek} x ${formatMoney(w.hourlyCost, c)}`)}</td>
        <td style="${CELL}">${escapeHtml(`${pctText(Math.min(w.conservativePct, w.expectedPct))} to ${pctText(Math.max(w.conservativePct, w.expectedPct))}`)}</td>
        <td style="${CELL}">${escapeHtml(`${formatHours(r.hoursFreed.conservative)} to ${formatHours(r.hoursFreed.expected)}`)}</td>
      </tr>`
    })
    .join('')
  const line = (label: string, value: string) => `<p style="margin:6px 0"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
  const triage = absoluteUrl(withEntry(ROI_CTA.primaryHref, 'email'))
  return `
    <div style="${WRAP}">
      <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(e.preheader)}</span>
      <p>${escapeHtml(e.greeting)}</p>
      <p>${escapeHtml(e.intro)}</p>
      <h2 style="font-size:16px;margin:20px 0 8px">${escapeHtml(e.workflowsHeading)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <th align="left" style="${CELL}">${escapeHtml(e.columns.workflow)}</th>
          <th align="left" style="${CELL}">${escapeHtml(e.columns.inputs)}</th>
          <th align="left" style="${CELL}">${escapeHtml(e.columns.saved)}</th>
          <th align="left" style="${CELL}">${escapeHtml(e.columns.hours)}</th>
        </tr>
        ${rows}
      </table>
      ${line(ROI_RESULT.hoursLabel, fill(ROI_RESULT.hoursRange, { low: formatHours(result.totals.hoursFreed.conservative), high: formatHours(result.totals.hoursFreed.expected) }))}
      ${line(e.value, fill(ROI_RESULT.valueRange, { low: formatMoney(result.totals.timeValue.conservative, c), high: formatMoney(result.totals.timeValue.expected, c) }))}
      <p style="margin:6px 0;color:#5b5670;font-size:13px">${escapeHtml(ROI_RESULT.valueNote)}</p>
      ${result.startWith ? line(e.start, ROI_WORKFLOWS[result.startWith].name) : ''}
      ${line(e.payback, paybackText(result))}
      <h2 style="font-size:16px;margin:20px 0 8px">${escapeHtml(e.assumptions)}</h2>
      ${line(ROI_ASSUMPTIONS.weeks, String(assumptions.weeksPerYear))}
      ${line(ROI_ASSUMPTIONS.sprint, formatMoney(assumptions.sprintCost, c))}
      ${line(e.run, formatMoney(assumptions.runCostPerMonth ?? 0, c))}
      <p style="margin:6px 0;color:#5b5670;font-size:13px">${escapeHtml(ROI_RESULT.measure)}</p>
      <p style="margin:24px 0 8px">${escapeHtml(e.ctaLead)}</p>
      <p style="margin:0 0 12px"><a href="${escapeHtml(triage)}" style="background:#7c3aed;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block">${escapeHtml(e.cta)}</a></p>
      <p style="margin:0 0 24px"><a href="${escapeHtml(ROI_CTA.secondaryHref)}" style="color:#7c3aed">${escapeHtml(e.call)}</a></p>
      <p>${escapeHtml(e.signoff)}</p>
    </div>`
}

export function adminEmailHtml(input: { email: string; company: string; inputs: WorkflowInput[]; assumptions: Assumptions }): string {
  const a = ROI_LEAD_EMAIL.admin
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5b5670">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
  return `
    <div style="${WRAP}">
      <h2 style="margin:0 0 12px">${escapeHtml(a.heading)}</h2>
      <table style="border-collapse:collapse">
        ${row(a.email, input.email)}
        ${row(a.company, input.company || '-')}
        ${row(a.entry, ROI_ENTRY_POINT)}
      </table>
      <hr style="margin:20px 0;border:none;border-top:1px solid #e5e5e5"/>
      ${estimateEmailHtml(input.inputs, input.assumptions)}
    </div>`
}
