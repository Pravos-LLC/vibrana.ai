import { escapeHtml } from '@/lib/escape-html';
import { NURTURE_FOOTER } from '@/src/unsubscribe-content';

/**
 * The shared footer of the scheduled assessment follow-up emails (app/api/assessments),
 * with the signed unsubscribe link for the recipient. Same style as the line it replaces.
 */
export function nurtureFooterHtml(unsubscribeUrl: string): string {
  return `<p style="color: rgba(255,255,255,0.35); font-size: 12px; margin: 16px 0 0 0;">
            ${escapeHtml(NURTURE_FOOTER.reason)} <a href="${escapeHtml(unsubscribeUrl)}" style="color: rgba(255,255,255,0.55); text-decoration: underline;">${escapeHtml(NURTURE_FOOTER.unsubscribeLabel)}</a>${escapeHtml(NURTURE_FOOTER.afterLink)}
          </p>`;
}
