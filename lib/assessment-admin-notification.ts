import { escapeHtml } from '@/lib/escape-html';
import { sendEmailWithRetry, FROM_EMAIL } from '@/lib/resend';
import {
  formatDuration,
  type QualitySignals,
} from '@/lib/assessment/quality-signals';
import { estimateAssessmentWorkflows, formatHoursRange, type AssessmentWorkflows } from '@/src/lib/assessment/workflows';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'john@vibrana.ai';
const REVIEW_URL = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vibrana.ai'}/admin/assessment-review`;

export interface AdminNotificationPayload {
  kind: 'organization';
  companyName?: string | null;
  email: string;
  overallScore: number;
  archetypeName?: string | null;
  readinessLevel?: string | null;
  dimensionScores?: Record<string, number>;
  status: string;
  durationSeconds?: number | null;
  qualitySignals?: QualitySignals | null;
  assessmentId?: string;
  /** How the written analysis went: stored, or why nothing was stored. */
  analysisNote?: string;
  /** Workflows the buyer named, if any. */
  workflows?: AssessmentWorkflows | null;
}

function buildHtml(p: AdminNotificationPayload): string {
  const company = escapeHtml(p.companyName || p.email);
  const email = escapeHtml(p.email);
  const archetype = escapeHtml(p.archetypeName || '—');
  const status = escapeHtml(p.status);
  const duration = formatDuration(p.durationSeconds);

  const dimensions = p.dimensionScores
    ? Object.entries(p.dimensionScores)
        .map(
          ([dim, score]) =>
            `<li style="margin:4px 0;font-size:14px;color:#3f3f46;">${escapeHtml(dim)}: <strong>${score}</strong></li>`
        )
        .join('')
    : '';

  const flags: string[] = [];
  if (p.qualitySignals?.suspiciously_fast) flags.push('Completed unusually fast');
  if (p.qualitySignals?.all_max_answers) flags.push('All answers at maximum score');

  const analysisFailed = !!p.analysisNote && p.analysisNote.startsWith('No analysis');
  const analysisBlock = p.analysisNote
    ? `<p style="margin:12px 0 0;font-size:14px;color:${analysisFailed ? '#b45309' : '#3f3f46'};"><strong>Analysis:</strong> ${escapeHtml(p.analysisNote)}</p>`
    : '';

  const flagBlock =
    flags.length > 0
      ? `<p style="margin:12px 0 0;font-size:14px;color:#b45309;"><strong>Quality flags:</strong> ${escapeHtml(flags.join('; '))}</p>`
      : '';

  const estimate = estimateAssessmentWorkflows(p.workflows);
  const workflowBlock = estimate
    ? `<p style="margin:12px 0 0;font-size:14px;color:#3f3f46;"><strong>Workflows named:</strong> ${estimate.rows
        .map((r) => `${escapeHtml(r.name)} (${r.people} people x ${r.hoursPerWeek} h/week, ${escapeHtml(formatHoursRange(r.hoursFreed))} h/year freed)`)
        .join('; ')}</p>`
    : '';

  return `<!doctype html><html><body style="margin:0;background:#fafafa;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%"><tr><td align="center">
    <table role="presentation" width="560" style="background:#fff;border:1px solid #ececf0;border-radius:12px;padding:32px 36px;">
      <h1 style="margin:0 0 8px;font-size:20px;color:#18181b;">New AI Readiness submission</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#71717a;">Organization · ${status}</p>
      <table role="presentation" width="100%" style="margin:16px 0;font-size:15px;color:#3f3f46;">
        <tr><td style="padding:6px 0;color:#71717a;width:140px;">Company / contact</td><td><strong>${company}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Email</td><td>${email}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Score</td><td><strong>${p.overallScore}/100</strong>${p.readinessLevel ? ` (${escapeHtml(p.readinessLevel)})` : ''}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Archetype</td><td>${archetype}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;">Duration</td><td>${duration}</td></tr>
      </table>
      ${dimensions ? `<ul style="margin:0;padding-left:20px;">${dimensions}</ul>` : ''}
      ${flagBlock}
      ${workflowBlock}
      ${analysisBlock}
      <p style="margin:24px 0 0;"><a href="${REVIEW_URL}" style="color:#7c3aed;font-weight:600;">Open submissions →</a></p>
      <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">Sign in with your admin secret (CRON_SECRET).</p>
    </td></tr></table>
  </td></tr></table></body></html>`;
}

export async function sendAssessmentAdminNotification(
  p: AdminNotificationPayload
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing; skipping assessment admin notification');
    return;
  }

  const companyLabel = p.companyName || p.email.split('@')[0];
  const subject = `[Vibrana Assessment] ${companyLabel} (${p.overallScore}/100, ${p.status})`;

  const result = await sendEmailWithRetry({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    html: buildHtml(p),
  });
  if (result.error) {
    console.error(`Assessment admin notification FAILED: ${result.error.message}`);
  }
}
