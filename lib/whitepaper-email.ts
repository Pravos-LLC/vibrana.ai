import { sendEmailWithRetry, FROM_EMAIL } from './resend';
import { escapeHtml } from './escape-html';
import { WHITEPAPER_EMAIL as C, WHITEPAPER_PDF_PATH } from '@/src/whitepaper-email-content';

// Whitepaper delivery email. Layout mirrors lib/assessment-receipt-email.ts; every
// string comes from src/whitepaper-email-content.ts.

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002').replace(/\/+$/, '');

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(text)}</p>`;

const button = (href: string, label: string) =>
  `<p style="margin:8px 0 24px;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#6d28d9;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${escapeHtml(label)}</a></p>`;

export function renderWhitepaperEmail(source: string): string {
  const fromAssessment = source === 'assessment-results';
  return `<!doctype html><html><body style="margin:0;background:#fafafa;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #ececf0;border-radius:14px;overflow:hidden;">
      <tr><td style="height:4px;background:linear-gradient(90deg,#7c3aed,#3b82f6,#2dd4bf);"></td></tr>
      <tr><td style="padding:32px 36px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#a1a1aa;">${escapeHtml(C.eyebrow)}</p>
        <h1 style="margin:0 0 20px;font-size:22px;line-height:1.25;color:#18181b;font-weight:700;">${escapeHtml(C.heading)}</h1>
        ${p(C.greeting)}
        ${p(C.intro)}
        ${button(`${BASE_URL}${WHITEPAPER_PDF_PATH}`, C.downloadLabel)}
        ${fromAssessment ? p(C.assessmentNote) : ''}
        ${p(C.closing)}
        ${button(C.ctaUrl, C.ctaLabel)}
        <p style="margin:24px 0 0;font-size:15px;color:#3f3f46;">${escapeHtml(C.signoff)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Returns true only if Resend accepted the message. */
export async function sendWhitepaperEmail(to: string, source: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing; skipping whitepaper email');
    return false;
  }
  const { error } = await sendEmailWithRetry({
    from: FROM_EMAIL,
    to,
    subject: C.subject,
    html: renderWhitepaperEmail(source),
    tags: [{ name: 'type', value: 'whitepaper' }],
  });
  if (error) {
    console.error(`Whitepaper email FAILED to ${to}: ${error.message}`);
    return false;
  }
  return true;
}
