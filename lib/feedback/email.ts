// Notification email to John when client feedback lands. Never sent to the respondent.
import { escapeHtml } from '@/lib/escape-html'
import { FEEDBACK_UI, type FeedbackFormConfig, type FeedbackQuestion } from '@/src/feedback-content'
import { consentHeadline, type ConsentOutcome } from './submission'

export type NotificationInput = {
  form: FeedbackFormConfig
  id: string
  /** From the optional contact step; null when the respondent stayed anonymous. */
  contactName: string | null
  score: number
  answers: Record<string, unknown>
  consent: ConsentOutcome
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function feedbackSubject(input: Pick<NotificationInput, 'form' | 'contactName' | 'score' | 'consent'>): string {
  const who = input.contactName ? oneLine(input.contactName) : 'an anonymous respondent'
  const base = `${input.form.clientName} feedback from ${who}: ${input.score}/10`
  return input.score >= input.form.consent.minScore ? `${base}, ${consentHeadline(input.consent)}` : base
}

type Row = { label: string; value: string }

function answerRows(question: FeedbackQuestion, raw: unknown): Row[] {
  if (raw === undefined || raw === null) return []
  switch (question.kind) {
    case 'score':
      return [{ label: question.prompt, value: `${String(raw)}/10` }]
    case 'ratings': {
      const map = raw as Record<string, number>
      const parts = question.items.filter((i) => map[i.id] !== undefined).map((i) => `${i.label}: ${map[i.id]}/5`)
      return parts.length ? [{ label: question.prompt, value: parts.join('\n') }] : []
    }
    case 'text':
      return typeof raw === 'string' && raw ? [{ label: question.prompt, value: raw }] : []
    case 'contact': {
      const value = raw as { name?: string; email?: string }
      const parts = [value.name, value.email].filter((part): part is string => typeof part === 'string' && part !== '')
      return parts.length ? [{ label: question.prompt, value: parts.join('\n') }] : []
    }
    case 'chips': {
      const value = raw as { choices?: string[]; text?: string }
      const labels = (value.choices ?? []).map((id) => question.options.find((o) => o.id === id)?.label ?? id)
      const parts = [...labels, ...(value.text ? [`Note: ${value.text}`] : [])]
      return parts.length ? [{ label: question.prompt, value: parts.join('\n') }] : []
    }
  }
}

export function notificationRows(input: NotificationInput): Row[] {
  const rows: Row[] = []
  for (const question of input.form.questions) rows.push(...answerRows(question, input.answers[question.id]))
  return rows
}

function consentLines(input: NotificationInput): string[] {
  const { consent, form } = input
  if (consent.status !== 'recorded') {
    return [input.score >= form.consent.minScore ? 'Consent screen not completed.' : 'Consent screen not shown (score below threshold).']
  }
  return [`Quote anonymously: ${consent.anonymousQuote ? 'Yes' : 'No'}`, `Consent wording version: ${consent.version}`]
}

export function feedbackEmailText(input: NotificationInput): string {
  const who = input.contactName ?? 'Anonymous respondent'
  return [
    `${input.form.clientName} feedback: ${input.score}/10`,
    `From: ${who}`,
    '',
    ...notificationRows(input).flatMap((r) => [r.label, r.value, '']),
    'Consent',
    ...consentLines(input),
    '',
    `Row ${input.id}`,
  ].join('\n')
}

export function feedbackEmailHtml(input: NotificationInput): string {
  const who = input.contactName ?? 'Anonymous respondent'
  const rows = notificationRows(input)
    .map(
      (r) => `<tr><td style="padding:14px 0;border-top:1px solid #e4e4e7;">
<div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;margin-bottom:4px;">${escapeHtml(r.label)}</div>
<div style="font-size:15px;line-height:1.55;color:#18181b;white-space:pre-wrap;">${escapeHtml(r.value)}</div>
</td></tr>`,
    )
    .join('')
  const consent = consentLines(input)
    .map((line) => `<div style="font-size:14px;line-height:1.6;color:#3f3f46;">${escapeHtml(line)}</div>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
<tr><td style="height:4px;background:linear-gradient(135deg,#7c3aed,#3b82f6,#2dd4bf);border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px;">
<div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6d28d9;">${escapeHtml(FEEDBACK_UI.email.heading)}</div>
<div style="font-size:40px;line-height:1.1;font-weight:600;color:#18181b;margin-top:10px;">${input.score}<span style="font-size:20px;color:#71717a;">/10</span></div>
<div style="font-size:15px;color:#3f3f46;margin-top:6px;">${escapeHtml(input.form.clientName)} &middot; ${escapeHtml(input.form.projectName)}</div>
<div style="font-size:15px;color:#18181b;margin-top:2px;"><strong>${escapeHtml(who)}</strong></div>
</td></tr>
<tr><td style="padding:8px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
<tr><td style="padding:8px 32px 8px;"><div style="border-top:1px solid #e4e4e7;padding-top:14px;">
<div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;margin-bottom:6px;">Consent</div>${consent}</div></td></tr>
<tr><td style="padding:16px 32px 28px;font-size:12px;color:#a1a1aa;">${escapeHtml(FEEDBACK_UI.email.footer)}<br>Row ${escapeHtml(input.id)}</td></tr>
</table></td></tr></table></body></html>`
}
