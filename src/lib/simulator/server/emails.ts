/**
 * Simulator lead emails (spec 12): the plan email with the PDF to the visitor, and
 * an admin notification for "talk it through". escapeHtml on every user field.
 */
import { escapeHtml } from '@/lib/escape-html';
import { FROM_EMAIL, sendEmailWithRetry } from '@/lib/resend';
import { absoluteUrl } from '@/src/lib/site';
import { SIM_SECTOR_LABELS } from '@/src/simulator-content';
import { SIM_EMAIL, SIM_PDF } from '@/src/simulator-email-content';
import type { StoredRun } from '../api';
import { formatNumber } from '../format';
import { assertPdfFontsAvailable } from './pdf-fonts';

export function runUrl(slug: string): string {
  return absoluteUrl(`/ai-transformation/simulator/r/${slug}`);
}

const WRAP = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1530; line-height: 1.5;";

export function planEmailHtml(run: StoredRun, intent: 'plan' | 'talk', hasPdf = true): string {
  const e = SIM_EMAIL.plan;
  const url = escapeHtml(runUrl(run.slug));
  return `
    <div style="${WRAP}">
      <span style="display:none;max-height:0;overflow:hidden">${escapeHtml(hasPdf ? e.preheader : e.preheaderNoPdf)}</span>
      <p>${escapeHtml(e.greeting)}</p>
      <p>${escapeHtml(hasPdf ? e.intro : e.introNoPdf)}</p>
      <p><a href="${url}" style="color:#7c3aed">${escapeHtml(e.linkLabel)}</a><br/><span style="color:#5b5670;font-size:13px">${escapeHtml(e.linkNote)}</span></p>
      ${intent === 'talk' ? `<p>${escapeHtml(e.talkNote)}</p>` : ''}
      <p style="color:#5b5670;font-size:13px">${escapeHtml(e.deleteNote)}</p>
      <p style="color:#5b5670;font-size:13px">${escapeHtml(e.consent)}</p>
      <p>${escapeHtml(e.signoff)}</p>
    </div>`;
}

export function adminEmailHtml(input: { run: StoredRun; email: string; company: string; intent: 'plan' | 'talk'; note: string }): string {
  const a = SIM_EMAIL.admin;
  const r = input.run.result.inputs;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5b5670">${escapeHtml(label)}</td><td style="padding:4px 0">${value}</td></tr>`;
  const url = escapeHtml(runUrl(input.run.slug));
  return `
    <div style="${WRAP}">
      <h2 style="margin:0 0 12px">${escapeHtml(a.heading)}</h2>
      <table style="border-collapse:collapse">
        ${row(a.labels.email, escapeHtml(input.email))}
        ${row(a.labels.company, escapeHtml(input.company))}
        ${row(a.labels.intent, escapeHtml(a.intents[input.intent]))}
        ${row(a.labels.sector, escapeHtml(SIM_SECTOR_LABELS[r.sector]))}
        ${row(a.labels.people, escapeHtml(formatNumber(r.headcount)))}
        ${row(a.labels.run, `<a href="${url}">${url}</a>`)}
        ${input.note ? row(a.labels.note, escapeHtml(input.note).replace(/\n/g, '<br/>')) : ''}
      </table>
    </div>`;
}

/**
 * Builds the plan PDF, or returns null (logged) if it cannot be built. The fonts are
 * checked before the renderer is imported: the renderer starts font loads at import
 * that nobody awaits, so a missing font would otherwise reject unhandled and end the
 * function process (see pdf-fonts.ts). Never throws.
 */
export async function buildPlanPdf(run: StoredRun): Promise<Buffer | null> {
  try {
    assertPdfFontsAvailable();
    const { renderSimulatorPdf } = await import('./pdf');
    return await renderSimulatorPdf(run);
  } catch (err) {
    console.error('[simulator] plan PDF failed, sending the plan email without it:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** Sends the plan email (with the PDF when it builds) and, for 'talk', the admin notification. Never throws. */
export async function sendSimulatorLeadEmails(input: {
  run: StoredRun;
  email: string;
  company: string;
  intent: 'plan' | 'talk';
  note: string;
}): Promise<void> {
  const adminTo = process.env.ADMIN_EMAIL || 'hello@vibrana.ai';
  try {
    const pdf = await buildPlanPdf(input.run);
    const sent = await sendEmailWithRetry({
      from: FROM_EMAIL,
      to: input.email,
      subject: SIM_EMAIL.plan.subject,
      html: planEmailHtml(input.run, input.intent, pdf !== null),
      ...(pdf ? { attachments: [{ filename: SIM_PDF.fileName(input.run.slug), content: pdf }] } : {}),
      tags: [{ name: 'category', value: 'simulator_plan' }],
    });
    if (sent.error) console.error('[simulator] plan email failed:', sent.error.message);
  } catch (err) {
    console.error('[simulator] plan email failed:', err instanceof Error ? err.message : err);
  }

  if (input.intent === 'talk') {
    const sent = await sendEmailWithRetry({
      from: FROM_EMAIL,
      to: adminTo,
      replyTo: input.email,
      subject: SIM_EMAIL.admin.subject(input.company, input.intent),
      html: adminEmailHtml(input),
    });
    if (sent.error) console.error('[simulator] admin email failed:', sent.error.message);
  }
}
