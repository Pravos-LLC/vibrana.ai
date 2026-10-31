// HTML for the EU AI Act Readiness emails: the results email, the two follow-ups and the admin
// notification. Copy comes from src/eu-ai-act-readiness-content.ts (EU_EMAIL, EU_RESULTS);
// every user-typed value goes through escapeHtml.
import { escapeHtml } from '@/lib/escape-html'
import { EU_OBLIGATIONS } from '@/src/eu-ai-act-obligations-content'
import { EU_EMAIL as E, EU_RESULTS as R, EU_CALL_HREF } from '@/src/eu-ai-act-readiness-content'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { legalCite } from '@/src/lib/eu-ai-act/evidence'
import { actionPlan, nextDate, reportRows, statusTally, STATUS_ORDER, tierTone } from '@/src/lib/eu-ai-act/report'

const SITE = 'https://vibrana.ai'

const wrap = (inner: string) => `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;">
<div style="max-width:640px;margin:0 auto;padding:32px 20px;"><div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px;">${inner}</div></div></body></html>`

function citeLinks(slugs: readonly string[]): string {
  const seen = new Set<string>()
  return slugs
    .map(legalCite)
    .filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)))
    .map((c) => `<a href="${escapeHtml(c.url)}" style="color:#71717a;">${escapeHtml(c.label)}</a>`)
    .join('; ')
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function footerHtml(unsubscribeUrl: string): string {
  return `<p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;">${escapeHtml(E.footer.reason)} <a href="${escapeHtml(unsubscribeUrl)}" style="color:#71717a;">${escapeHtml(E.footer.unsubscribeLabel)}</a>${escapeHtml(E.footer.afterLink)}</p>`
}

// Email-safe palette (literal hex: mail clients strip CSS variables). Same meanings as the page.
const INK = '#18181b'
const INK2 = '#52525b'
const INK3 = '#71717a'
const LINE = '#e4e4e7'
const EU_BLUE = '#003399'
const EU_GOLD = '#ffcc00'
const TONE_HEX: Record<string, string> = { prohibited: '#dc2626', 'high-risk': '#f59e0b', transparency: '#003399', baseline: '#0d9488' }
const STATUS_FILL: Record<string, string> = { met: '#0d9488', partial: '#f59e0b', gap: '#dc2626', unanswered: '#a1a1aa' }
const STATUS_SOFT: Record<string, string> = { met: '#e6f6f4', partial: '#fef3e2', gap: '#fdecec', unanswered: '#f4f4f5' }
const STATUS_TEXT: Record<string, string> = { met: '#0f766e', partial: '#b45309', gap: '#b91c1c', unanswered: '#52525b' }

const pill = (status: string) =>
  `<span style="display:inline-block;background:${STATUS_SOFT[status]};color:${STATUS_TEXT[status]};border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;line-height:16px;">${escapeHtml(R.statusLabels[status as keyof typeof R.statusLabels])}</span>`

/** A horizontal bar as table cells: `pct` filled in `color`, the rest in the track color. */
function barRow(pct: number, color: string, height = 8, track = '#f1f1f3') {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  const cell = (w: number, bg: string) => `<td width="${w}%" style="width:${w}%;background:${bg};height:${height}px;font-size:0;line-height:0;">&nbsp;</td>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-radius:999px;overflow:hidden;"><tr>${p > 0 ? cell(p, color) : ''}${p < 100 ? cell(100 - p, track) : ''}</tr></table>`
}

const section = (title: string, inner: string, intro?: string) => `
    <tr><td style="padding:28px 32px 0;">
      <h2 style="margin:0;font-size:19px;line-height:26px;color:${INK};">${escapeHtml(title)}</h2>
      ${intro ? `<p style="margin:6px 0 0;font-size:14px;line-height:22px;color:${INK2};">${escapeHtml(intro)}</p>` : ''}
      ${inner}
    </td></tr>`

/**
 * The results email: a report in miniature. An EU-blue header with the readiness score and the
 * twelve stars (lit in step with the score), the exposure facts, the status tally as a stacked
 * bar, the next date with its countdown, scores by control area as bars, where to start, then
 * every obligation with its status, date, next step and source line. Tables and inline styles
 * only, no script; the company name is escaped.
 */
export function resultsEmailHtml(company: string, profile: EUProfile): string {
  const rows = reportRows(profile)
  const tally = statusTally(rows)
  const next = nextDate(rows)
  const plan = actionPlan(profile, rows)
  const lit = Math.round((profile.readinessScore / 100) * 12)
  const stars = Array.from({ length: 12 }, (_, i) => `<span style="color:${i < lit ? EU_GOLD : 'rgba(255,255,255,0.25)'};">&#9733;</span>`).join('&#8202;')

  const header = `
    <tr><td style="background:${EU_BLUE};background-image:linear-gradient(135deg,#003399 0%,#00205f 100%);padding:32px;border-radius:16px 16px 0 0;">
      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${EU_GOLD};font-weight:700;">${escapeHtml(E.heading)}</div>
      <div style="font-size:30px;line-height:36px;font-weight:700;color:#ffffff;margin:8px 0 2px;">${escapeHtml(company)}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);">${escapeHtml(R.labels.assessed(formatDate(profile.asOf)))}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr>
        <td style="vertical-align:bottom;white-space:nowrap;padding-right:16px;">
          <span style="font-size:56px;line-height:56px;font-weight:700;color:#ffffff;">${profile.readinessScore}</span>
          <span style="font-size:14px;color:rgba(255,255,255,0.75);">&nbsp;${escapeHtml(R.labels.outOf)}</span>
        </td>
        <td style="vertical-align:bottom;text-align:right;">
          <span style="display:inline-block;background:${EU_GOLD};color:#0b1a4d;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;">${escapeHtml(R.readinessLabels[profile.readinessLevel])}</span>
        </td>
      </tr></table>
      <div style="font-size:12px;color:rgba(255,255,255,0.75);margin:10px 0 6px;">${escapeHtml(R.labels.scoreLabel)}</div>
      ${barRow(profile.readinessScore, EU_GOLD, 10, 'rgba(255,255,255,0.18)')}
      <div style="font-size:20px;line-height:24px;letter-spacing:2px;margin-top:14px;">${stars}</div>
    </td></tr>`

  const facts: [string, string, string?][] = [
    [R.labels.scope, R.scopeLabels[profile.scope]],
    [R.labels.role, R.roleLabels[profile.role]],
    [R.labels.tier, R.tierLabels[profile.riskTier], TONE_HEX[tierTone(profile.riskTier)]],
    [R.labels.size, R.sizeLabels[profile.sizeBand]],
  ]
  const factCell = ([k, v, tone]: [string, string, string?]) =>
    `<td width="50%" style="width:50%;vertical-align:top;padding:14px 16px;border:1px solid ${LINE};${tone ? `border-top:3px solid ${tone};` : ''}">
      <div style="font-size:12px;color:${INK3};">${escapeHtml(k)}</div>
      <div style="font-size:15px;line-height:21px;font-weight:700;color:${INK};margin-top:4px;">${escapeHtml(v)}</div></td>`
  const factsTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:4px;">
      <tr>${factCell(facts[0])}${factCell(facts[1])}</tr><tr>${factCell(facts[2])}${factCell(facts[3])}</tr></table>`

  const total = rows.length || 1
  const present = STATUS_ORDER.filter((st) => tally[st] > 0)
  const tallyBar = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>${present
    .map((st, i) => `<td width="${Math.round((tally[st] / total) * 100)}%" style="background:${STATUS_FILL[st]};height:14px;font-size:0;line-height:0;${i < present.length - 1 ? 'border-right:2px solid #ffffff;' : ''}">&nbsp;</td>`)
    .join('')}</tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>${STATUS_ORDER.map(
      (st) => `<td width="25%" style="width:25%;vertical-align:top;padding-right:8px;"><div style="font-size:24px;line-height:28px;font-weight:700;color:${tally[st] ? INK : '#a1a1aa'};"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${STATUS_FILL[st]};margin-right:6px;vertical-align:middle;"></span>${tally[st]}</div><div style="font-size:12px;color:${INK3};">${escapeHtml(R.statusLabels[st])}</div></td>`,
    ).join('')}</tr></table>`

  const nextBlock = next
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;background:#fff8eb;border-radius:12px;"><tr><td style="padding:18px 20px;">
        <div style="font-size:13px;color:${INK2};">${escapeHtml(R.labels.nextDate)}</div>
        <div style="margin-top:6px;"><span style="font-size:40px;line-height:44px;font-weight:700;color:${INK};">${next.days}</span> <span style="font-size:15px;color:${INK2};">${escapeHtml(R.labels.days)}</span>
        <span style="font-size:14px;font-weight:700;color:${TONE_HEX[next.rows[0].tone] === '#f59e0b' ? '#b45309' : TONE_HEX[next.rows[0].tone]};">&nbsp;&nbsp;${escapeHtml(formatDate(next.date))}</span></div>
        <div style="font-size:14px;line-height:22px;color:${INK};margin-top:6px;">${next.rows.map((r) => escapeHtml(r.def.title)).join('<br/>')}</div>
      </td></tr></table>`
    : ''

  const areaRows = profile.sectionScores
    .map(
      (sc) => `<tr><td style="padding:8px 0 0;font-size:14px;color:${INK};">${escapeHtml(sc.title)}</td><td style="padding:8px 0 0;text-align:right;font-size:14px;font-weight:700;color:${INK};">${sc.score ?? '-'}</td></tr>
      <tr><td colspan="2" style="padding:6px 0 4px;">${barRow(sc.score ?? 0, EU_BLUE, 6)}</td></tr>`,
    )
    .join('')

  const firstSteps = [...plan.now, ...plan.foundations, ...plan.next].slice(0, 3)
  const planRows = firstSteps
    .map(
      (r, i) => `<tr><td style="vertical-align:top;width:34px;padding:12px 0 0;"><div style="width:26px;height:26px;line-height:26px;text-align:center;border-radius:13px;background:${TONE_HEX[r.tone]};color:${r.tone === 'high-risk' ? INK : '#ffffff'};font-size:13px;font-weight:700;">${i + 1}</div></td>
      <td style="vertical-align:top;padding:12px 0 0;"><div style="font-size:15px;font-weight:700;color:${INK};">${escapeHtml(r.def.title)}</div><div style="font-size:14px;line-height:22px;color:${INK2};margin-top:2px;">${escapeHtml(r.def.action)}</div></td></tr>`,
    )
    .join('')

  const obligationRows = rows
    .map(({ result: o, def, tone, days }) => {
      const when = o.appliesFrom ? `${R.labels.applies} ${formatDate(o.appliesFrom)}` : R.labels.undated
      const countdown = days !== null && days > 0 ? ` &middot; <strong style="color:${INK};">${escapeHtml(R.labels.daysLeft(days))}</strong>` : o.inForce ? ` &middot; ${escapeHtml(R.labels.inForceShort)}` : ''
      return `<tr><td style="padding:0 0 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-left:4px solid ${TONE_HEX[tone]};border-radius:10px;"><tr><td style="padding:16px 18px;">
        <div>${pill(o.status)} <span style="font-size:12px;color:${INK3};">&nbsp;${escapeHtml(when)}${countdown}</span></div>
        <div style="font-size:16px;line-height:22px;font-weight:700;color:${INK};margin:8px 0 4px;">${escapeHtml(def.title)}</div>
        <div style="font-size:14px;line-height:22px;color:#3f3f46;">${escapeHtml(def.requirement)}</div>
        ${o.status === 'met' ? '' : `<div style="font-size:14px;line-height:22px;margin-top:8px;background:#fafafa;border-radius:8px;padding:10px 12px;color:${INK};"><strong>${escapeHtml(R.labels.nextStep)}:</strong> ${escapeHtml(def.action)}</div>`}
        <div style="font-size:12px;line-height:18px;margin-top:8px;color:${INK3};">${escapeHtml(E.sourcesLabel)}: ${citeLinks(def.findings)}</div>
      </td></tr></table></td></tr>`
    })
    .join('')

  const flag = profile.prohibitedFlag
    ? `<tr><td style="padding:24px 32px 0;"><div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:14px 16px;font-size:14px;line-height:22px;color:${INK};">${escapeHtml(R.labels.prohibitedFlag)}</div></td></tr>`
    : ''

  const button = (href: string, label: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr><td style="background:#6d28d9;border-radius:8px;"><a href="${href}" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;">
    ${header}
    <tr><td style="padding:24px 32px 0;"><p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">${escapeHtml(E.intro(company))}</p>${factsTable}</td></tr>
    ${flag}
    ${section(R.labels.tally, tallyBar + nextBlock)}
    ${section(R.labels.sections, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${areaRows}</table>`)}
    ${firstSteps.length ? section(E.planTitle, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${planRows}</table>`, E.planIntro) : ''}
    ${section(R.labels.obligations, `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${obligationRows}</table>`, R.labels.obligationsIntro)}
    <tr><td style="padding:12px 32px 0;">
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;">
        <div style="font-size:17px;font-weight:700;color:${INK};">${escapeHtml(R.labels.callTitle)}</div>
        <div style="font-size:14px;line-height:22px;color:${INK2};margin-top:4px;">${escapeHtml(R.labels.callBody)}</div>
        ${button(EU_CALL_HREF, E.callLabel)}
      </div>
      <p style="margin:18px 0 0;font-size:14px;line-height:22px;color:${INK2};">${escapeHtml(E.viewOnlineBody)} <a href="${SITE}/eu-ai-act-readiness/results" style="color:#6d28d9;font-weight:600;">${escapeHtml(E.viewOnline)}</a></p>
    </td></tr>
    <tr><td style="padding:20px 32px 32px;"><p style="font-size:12px;line-height:18px;color:#a1a1aa;margin:0;">${escapeHtml(E.disclaimer)}</p></td></tr>
</table></td></tr></table></body></html>`
}

export function followUpHtml(index: number, footer: string): string {
  const f = E.followUps[index]
  return wrap(`
    <p style="font-size:15px;line-height:24px;color:#3f3f46;">${escapeHtml(f.body)}</p>
    <p style="font-size:12px;color:#71717a;">${escapeHtml(E.sourcesLabel)}: ${citeLinks(f.findings)}</p>
    <p style="margin:20px 0 0;"><a href="${EU_CALL_HREF}" style="color:#6d28d9;font-weight:600;">${escapeHtml(E.callLabel)}</a></p>
    <p style="font-size:12px;color:#a1a1aa;margin:20px 0 0;">${escapeHtml(E.disclaimer)}</p>
    ${footer}`)
}

export function adminHtml(p: { company: string; email: string; teamSize: string; revenueBand: string; profile: EUProfile; assessmentId?: string; durationSeconds: number | null; entry: string | null }): string {
  const gaps = p.profile.obligations.filter((o) => o.status !== 'met').map((o) => EU_OBLIGATIONS.find((d) => d.id === o.id)!.title)
  return wrap(`
    <h1 style="font-size:20px;margin:0 0 12px;">EU AI Act Readiness: ${escapeHtml(p.company)}</h1>
    <p style="font-size:14px;line-height:22px;">${escapeHtml(p.email)} · ${escapeHtml(p.teamSize)} · ${escapeHtml(p.revenueBand)}<br/>
    Scope: <strong>${escapeHtml(p.profile.scope)}</strong> · Role: <strong>${escapeHtml(p.profile.role)}</strong> · Tier: <strong>${escapeHtml(p.profile.riskTier)}</strong> · Size: <strong>${escapeHtml(p.profile.sizeBand)}</strong><br/>
    High-risk: ${escapeHtml(p.profile.highRisk.map((h) => `${h.area} (${h.level})`).join(', ') || 'none')}<br/>
    Readiness: <strong>${p.profile.readinessScore}</strong>/100${p.profile.prohibitedFlag ? ' · <strong style="color:#b91c1c;">possible prohibited practice</strong>' : ''}<br/>
    Entry: ${escapeHtml(p.entry ?? 'unknown')} · Time: ${p.durationSeconds ?? '?'}s · Id: ${escapeHtml(p.assessmentId ?? 'unsaved')}</p>
    <p style="font-size:14px;line-height:22px;"><strong>Open obligations:</strong> ${escapeHtml(gaps.join('; ') || 'none')}</p>`)
}
