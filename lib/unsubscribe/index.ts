/**
 * Unsubscribe for scheduled follow-up email (the assessment nurture sequence).
 *
 *   - Every scheduled send's Resend id is stored against the lead (scheduled_emails).
 *   - Each email carries a signed link (footer) and RFC 8058 List-Unsubscribe headers.
 *   - Unsubscribing records the address in email_opt_outs and cancels every send
 *     still scheduled for it through the Resend API.
 *   - The assessment route checks email_opt_outs before it schedules anything.
 *
 * Addresses are keyed normalized with the +tag removed, like the notification claims,
 * so an unsubscribe from name+x@company.com also covers name@company.com.
 */
import { createHmac } from 'node:crypto';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { collapsePlusTag, normalizeEmail } from '@/lib/form-guard/validation';
import { signUnsubscribeToken, verifyUnsubscribeToken } from './token';

export type OptOutSource = 'link' | 'one-click' | 'manual';

let adminClient: Resend | null = null;

/**
 * Resend client for cancel and get. The sending key (RESEND_API_KEY) is restricted to
 * sending, and Resend answers 401 restricted_api_key to anything else, so canceling
 * needs the full-access RESEND_ADMIN_API_KEY. Falls back to the sending key, which
 * works only where that key has full access (local, tests).
 */
function resendAdmin(): Resend {
  if (!adminClient) adminClient = new Resend(process.env.RESEND_ADMIN_API_KEY || process.env.RESEND_API_KEY);
  return adminClient;
}

/** Canonical host: the apex redirects, and a one-click POST must not hit a redirect. */
const DEFAULT_BASE_URL = 'https://www.vibrana.ai';

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/** The key both tables use for an address. */
export function optOutKey(email: string): string {
  return collapsePlusTag(normalizeEmail(email));
}

let warnedDerived = false;

/**
 * HMAC key for unsubscribe tokens. UNSUBSCRIBE_SECRET in production. Without it
 * (local dev, previews) a key is derived from the Supabase service key so links
 * still work there; production must keep UNSUBSCRIBE_SECRET stable, because
 * changing it breaks every link already sitting in an inbox.
 */
export function getUnsubscribeSecret(): string | null {
  const explicit = process.env.UNSUBSCRIBE_SECRET;
  if (explicit) return explicit;
  const base = process.env.SUPABASE_SERVICE_KEY;
  if (!base) return null;
  if (!warnedDerived && process.env.VERCEL_ENV === 'production') {
    console.error('[unsubscribe] UNSUBSCRIBE_SECRET is not set in production; using a derived key.');
    warnedDerived = true;
  }
  return createHmac('sha256', base).update('vibrana.ai/unsubscribe/v1').digest('hex');
}

/** The address a token was issued for, or null. */
export function emailFromToken(token: unknown): string | null {
  const secret = getUnsubscribeSecret();
  return secret ? verifyUnsubscribeToken(token, secret) : null;
}

export function unsubscribeToken(email: string): string | null {
  const secret = getUnsubscribeSecret();
  return secret ? signUnsubscribeToken(normalizeEmail(email), secret) : null;
}

/** The footer link: the confirmation page. */
export function unsubscribePageUrl(email: string): string | null {
  const token = unsubscribeToken(email);
  return token ? `${baseUrl()}/unsubscribe?t=${token}` : null;
}

/** RFC 8058 one-click headers. The POST target cancels without a page. */
export function listUnsubscribeHeaders(email: string): Record<string, string> | null {
  const token = unsubscribeToken(email);
  if (!token) return null;
  return {
    'List-Unsubscribe': `<${baseUrl()}/api/unsubscribe?t=${token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** Whether the address is in email_opt_outs; null when the lookup itself failed. */
export async function optOutRecorded(email: string): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from('email_opt_outs')
      .select('email')
      .eq('email', optOutKey(email))
      .maybeSingle();
    if (error) {
      console.error('[unsubscribe] opt-out lookup failed:', error.message);
      return null;
    }
    return data != null;
  } catch (err) {
    console.error('[unsubscribe] opt-out lookup threw:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Whether to treat the address as opted out before scheduling. Fails closed: when the
 * lookup fails we can't show consent still stands, so the caller schedules nothing.
 */
export async function isOptedOut(email: string): Promise<boolean> {
  return (await optOutRecorded(email)) !== false;
}

export interface ScheduledSend {
  resendId: string;
  step: string;
  scheduledFor: Date;
}

/** Stores the Resend ids of scheduled sends. Returns false when they could not be stored. */
export async function recordScheduledEmails(input: {
  email: string;
  sequence: string;
  assessmentId?: string | null;
  sends: ScheduledSend[];
}): Promise<boolean> {
  if (input.sends.length === 0) return true;
  const key = optOutKey(input.email);
  try {
    const { error } = await supabase.from('scheduled_emails').insert(
      input.sends.map((send) => ({
        resend_id: send.resendId,
        email: key,
        sequence: input.sequence,
        step: send.step,
        assessment_id: input.assessmentId ?? null,
        scheduled_for: send.scheduledFor.toISOString(),
      })),
    );
    if (error) {
      console.error('[unsubscribe] storing scheduled email ids failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[unsubscribe] storing scheduled email ids threw:', err instanceof Error ? err.message : err);
    return false;
  }
}

type CancelOutcome = 'canceled' | 'sent' | 'failed';

const ALREADY_SENT_EVENTS = new Set([
  'sent', 'delivered', 'delivery_delayed', 'opened', 'clicked', 'bounced', 'complained', 'failed', 'suppressed',
]);

/** Cancels one scheduled send. When Resend refuses, asks it what state the email is in. */
export async function cancelResendEmail(resendId: string): Promise<CancelOutcome> {
  try {
    const resend = resendAdmin();
    const { error } = await resend.emails.cancel(resendId);
    if (!error) return 'canceled';
    const { data } = await resend.emails.get(resendId);
    const last = data?.last_event;
    if (last === 'canceled') return 'canceled';
    if (last && ALREADY_SENT_EVENTS.has(last)) return 'sent';
    console.error(`[unsubscribe] cancel failed for a scheduled email: ${error.name} (last_event=${last ?? 'unknown'})`);
    return 'failed';
  } catch (err) {
    console.error('[unsubscribe] cancel threw:', err instanceof Error ? err.message : err);
    return 'failed';
  }
}

/** Cancels every send still scheduled for the address. */
export async function cancelScheduledEmails(email: string): Promise<{ canceled: number; sent: number; failed: number }> {
  const totals = { canceled: 0, sent: 0, failed: 0 };
  const { data, error } = await supabase
    .from('scheduled_emails')
    .select('resend_id')
    .eq('email', optOutKey(email))
    .eq('status', 'scheduled');
  if (error) {
    console.error('[unsubscribe] reading scheduled emails failed:', error.message);
    return { ...totals, failed: 1 };
  }

  // One at a time: at most four per address, and Resend rate-limits bursts.
  for (const row of (data ?? []) as { resend_id: string }[]) {
    const outcome = await cancelResendEmail(row.resend_id);
    totals[outcome] += 1;
    if (outcome === 'failed') continue;
    const { error: updateError } = await supabase
      .from('scheduled_emails')
      .update(outcome === 'canceled' ? { status: 'canceled', canceled_at: new Date().toISOString() } : { status: 'sent' })
      .eq('resend_id', row.resend_id);
    if (updateError) console.error('[unsubscribe] marking a scheduled email failed:', updateError.message);
  }
  return totals;
}

/**
 * Records the opt-out, then cancels what is still scheduled. Idempotent. `ok` is
 * false when the opt-out could not be stored or a pending send could not be canceled,
 * so the caller can tell the person to try again or reply "stop".
 */
export async function unsubscribe(email: string, source: OptOutSource): Promise<{ ok: boolean }> {
  const { error } = await supabase
    .from('email_opt_outs')
    .upsert({ email: optOutKey(email), source }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) {
    console.error('[unsubscribe] recording the opt-out failed:', error.message);
    return { ok: false };
  }
  const result = await cancelScheduledEmails(email);
  console.log(`[unsubscribe] source=${source} canceled=${result.canceled} already_sent=${result.sent} failed=${result.failed}`);
  return { ok: result.failed === 0 };
}
