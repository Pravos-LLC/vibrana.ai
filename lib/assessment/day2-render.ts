import { escapeHtml } from '@/lib/escape-html'
import { ASSESSMENT_NURTURE_DAY2 as C } from '@/src/assessment-nurture-day2-content'

/** Interpolate only declared text tokens; the configuration never supplies executable HTML. */
export function renderDay2Email(companyName: string, priorityArea: string, score: number, whitepaperUrl: string, footer: string): string {
  const values: Record<string, string> = { companyName, priorityArea, priorityLower: priorityArea.toLowerCase(), score: String(score) }
  const text = (value: string) => escapeHtml(value).replace(/\{\{(companyName|priorityArea|priorityLower|score)\}\}/g, (_match, key: string) => escapeHtml(values[key]))
  const paragraph = (value: string) => `<p style="margin:0 0 20px;font-size:16px;line-height:1.7">${text(value)}</p>`
  return `<!doctype html><html><body style="font-family:-apple-system,sans-serif;margin:0;padding:40px 20px"><div style="max-width:600px;margin:0 auto">${C.heading ? `<h1>${text(C.heading)}</h1>` : ''}${C.paragraphs.map(paragraph).join('')}${C.callout ? `<aside style="padding:24px;margin:24px 0;border-left:3px solid #7c3aed">${paragraph(C.callout)}</aside>` : ''}${C.afterCallout.map(paragraph).join('')}<p><a href="${escapeHtml(whitepaperUrl)}">${text(C.downloadLabel)}</a></p>${C.closing.map(paragraph).join('')}${footer}</div></body></html>`
}
