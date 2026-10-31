/**
 * Server-side spam and bot guard for public forms.
 *
 * Layers, in order (cheapest first):
 *   1. Honeypot field filled               -> silent drop
 *   2. Render token missing / forged       -> silent drop
 *      Render token expired                -> visible "refresh" error
 *      Submitted faster than minFillMs     -> silent drop
 *   3. Vercel BotID says bot               -> silent drop
 *   4. Rate limit per IP                   -> visible 429
 *      Rate limit per email / per token    -> silent drop (no signal to the sender)
 *
 * "Silent drop" means the caller returns its normal success response but doesn't
 * persist anything or send any email. Every failure of the *infrastructure*
 * (BotID unreachable, rate-limit RPC missing) fails open and logs, so a missing
 * migration can never take the forms down. Logs never include the email or IP.
 *
 * See docs/form-protection.md.
 */
import { createHash, createHmac } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { checkBotId } from 'botid/server';
import { HONEYPOT_FIELD, TOKEN_FIELD, TOKEN_MAX_AGE_MS, TOKEN_FUTURE_SKEW_MS, TURNSTILE_FIELD } from './constants';
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content';
import { createFormToken, verifyFormToken } from './token';
import { collapsePlusTag, isValidEmail, normalizeEmail } from './validation';

export { HONEYPOT_FIELD, TOKEN_FIELD };

type HeaderReader = { get(name: string): string | null };

export type RateLimitRule = {
  key: 'ip' | 'email' | 'token';
  max: number;
  windowSec: number;
};

export type GuardConfig = {
  /** Short stable name, used in rate-limit buckets and logs. */
  endpoint: string;
  /** Minimum time between the token being issued (form shown) and submit. */
  minFillMs: number;
  limits: RateLimitRule[];
  /** Also require a Cloudflare Turnstile token. Only enforced when TURNSTILE_SECRET_KEY is set. */
  turnstile?: boolean;
};

export type GuardResult =
  | { action: 'allow' }
  | { action: 'drop'; reason: string }
  | { action: 'reject'; status: number; message: string };

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Per-endpoint policy. Generous for people, tight for scripts. Every endpoint that emails a typed address is tightest on the email key. */
export const FORM_GUARDS = {
  // Email-sending endpoints are tightest on the `email` key: it caps how often one
  // address can be mailed, whoever types it. IP limits are loose because partner
  // workshops put many real people behind one network.
  assessmentLeads: {
    endpoint: 'assessment-leads',
    minFillMs: 2500,
    limits: [
      // Two calls per person, and a partner workshop puts 30 to 40 people behind one network.
      { key: 'ip', max: 300, windowSec: HOUR },
      { key: 'email', max: 10, windowSec: DAY },
      { key: 'token', max: 6, windowSec: DAY },
    ],
  },
  analyzeCompany: {
    endpoint: 'analyze-company',
    minFillMs: 2500,
    limits: [
      { key: 'ip', max: 100, windowSec: HOUR },
      { key: 'ip', max: 300, windowSec: DAY },
      { key: 'token', max: 3, windowSec: DAY },
    ],
  },
  // The simulator's website step costs a Firecrawl scrape plus a model call (spec 11).
  // A dropped request gets the manual sector path, same as an unreadable site.
  sprintFitProfile: {
    endpoint: 'sprint-fit-profile', minFillMs: 1500, turnstile: true,
    limits: [
      { key: 'ip', max: 30, windowSec: HOUR },
      { key: 'ip', max: 100, windowSec: DAY },
      { key: 'token', max: 5, windowSec: DAY },
    ],
  },
  simulatorProfile: {
    endpoint: 'simulator-profile',
    minFillMs: 1500,
    turnstile: true,
    limits: [
      { key: 'ip', max: 30, windowSec: HOUR },
      { key: 'ip', max: 100, windowSec: DAY },
      { key: 'email', max: 8, windowSec: DAY },
      { key: 'token', max: 5, windowSec: DAY },
    ],
  },
  // Saving a result is free to compute but writes a row; visitors re-save as they tweak assumptions.
  simulatorRuns: {
    endpoint: 'simulator-runs',
    minFillMs: 3000,
    limits: [
      { key: 'ip', max: 60, windowSec: HOUR },
      { key: 'ip', max: 200, windowSec: DAY },
      { key: 'token', max: 30, windowSec: DAY },
    ],
  },
  assessments: {
    endpoint: 'assessments',
    minFillMs: 30_000,
    limits: [
      { key: 'ip', max: 200, windowSec: HOUR },
      { key: 'ip', max: 500, windowSec: DAY },
      { key: 'email', max: 4, windowSec: DAY },
      { key: 'token', max: 2, windowSec: DAY },
    ],
  },
  whitepaper: {
    endpoint: 'whitepaper',
    minFillMs: 1000,
    limits: [
      { key: 'ip', max: 10, windowSec: HOUR },
      { key: 'ip', max: 30, windowSec: DAY },
      { key: 'email', max: 2, windowSec: DAY },
      { key: 'token', max: 3, windowSec: DAY },
    ],
  },
  enterpriseInquiry: {
    endpoint: 'enterprise-inquiry',
    minFillMs: 5000,
    limits: [
      { key: 'ip', max: 10, windowSec: HOUR },
      { key: 'ip', max: 30, windowSec: DAY },
      { key: 'email', max: 3, windowSec: DAY },
      { key: 'token', max: 3, windowSec: DAY },
    ],
  },
  // "Email me this" on the Workflow ROI calculator: one email to the typed address.
  roiLeads: {
    endpoint: 'roi-leads',
    minFillMs: 4000,
    limits: [
      { key: 'ip', max: 20, windowSec: HOUR },
      { key: 'ip', max: 60, windowSec: DAY },
      { key: 'email', max: 3, windowSec: DAY },
      { key: 'token', max: 5, windowSec: DAY },
    ],
  },
  // Signed unsubscribe links from follow-up emails (guardSignedLink: rate limits only).
  // Each request can cost up to four Resend cancel calls; people click once or twice.
  unsubscribe: {
    endpoint: 'unsubscribe',
    minFillMs: 0,
    limits: [
      { key: 'ip', max: 30, windowSec: HOUR },
      { key: 'ip', max: 100, windowSec: DAY },
      { key: 'email', max: 10, windowSec: DAY },
    ],
  },
  // Anonymous call-click counts (app/api/funnel-events, guardBeacon: IP limits only). Nothing is
  // mailed or stored about the visitor; the limit only caps how far a script can inflate a count.
  funnelEvents: {
    endpoint: 'funnel-events',
    minFillMs: 0,
    limits: [
      { key: 'ip', max: 30, windowSec: HOUR },
      { key: 'ip', max: 100, windowSec: DAY },
    ],
  },
  sprintInquiries: {
    endpoint: 'sprint-inquiries',
    minFillMs: 4000,
    limits: [
      { key: 'ip', max: 10, windowSec: HOUR },
      { key: 'ip', max: 30, windowSec: DAY },
      { key: 'email', max: 3, windowSec: DAY },
      { key: 'token', max: 3, windowSec: DAY },
    ],
  },
  // Client feedback (/feedback/[slug]). Writes one row and emails John only; nothing goes to the
  // respondent. A draft can be restored and sent within seconds of page load, so the minimum is short;
  // the route turns every non-honeypot drop into a retryable error rather than a fake success.
  clientFeedback: {
    endpoint: 'client-feedback',
    minFillMs: 2000,
    limits: [
      { key: 'ip', max: 20, windowSec: HOUR },
      { key: 'ip', max: 60, windowSec: DAY },
      { key: 'token', max: 6, windowSec: DAY },
    ],
  },
} satisfies Record<string, GuardConfig>;

/**
 * FORM_GUARD_MIN_FILL_MS overrides every endpoint's minimum fill time. It exists
 * for the Playwright suite, which fills forms in milliseconds. Never set it in production.
 */
function minFillMs(config: GuardConfig): number {
  const override = process.env.FORM_GUARD_MIN_FILL_MS;
  if (override !== undefined && override !== '' && Number.isFinite(Number(override))) return Number(override);
  return config.minFillMs;
}

// ---------------------------------------------------------------------------
// Secrets and hashing
// ---------------------------------------------------------------------------

let warnedNoSecret = false;

/**
 * HMAC key for form tokens and for hashing rate-limit buckets.
 * Uses FORM_GUARD_SECRET when set; otherwise derives a separate key from the
 * Supabase service key that every environment running these forms already has.
 * No new credential is required.
 */
function getSecret(): string | null {
  const base = process.env.FORM_GUARD_SECRET || process.env.SUPABASE_SERVICE_KEY || '';
  if (!base) {
    if (!warnedNoSecret) {
      console.error('[form-guard] No FORM_GUARD_SECRET or SUPABASE_SERVICE_KEY; token checks disabled.');
      warnedNoSecret = true;
    }
    return null;
  }
  return createHmac('sha256', base).update('vibrana.ai/form-guard/v1').digest('hex');
}

export function issueFormToken(): string | null {
  const secret = getSecret();
  return secret ? createFormToken(secret) : null;
}

function hashBucket(value: string, secret: string): string {
  return createHash('sha256').update(secret).update('\0').update(value).digest('hex').slice(0, 32);
}

export function getClientIp(headers: HeaderReader): string | null {
  const direct = headers.get('x-vercel-forwarded-for') || headers.get('x-real-ip');
  const forwarded = headers.get('x-forwarded-for');
  const ip = (direct || forwarded || '').split(',')[0].trim();
  return ip || null;
}

// ---------------------------------------------------------------------------
// Rate limiting (Supabase RPC: public.form_rate_limit_hit)
// ---------------------------------------------------------------------------

let rateLimitClient: SupabaseClient | null = null;
let warnedRateLimit = false;

function getRateLimitClient(): SupabaseClient | null {
  if (rateLimitClient) return rateLimitClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  rateLimitClient = createClient(url, key, { auth: { persistSession: false } });
  return rateLimitClient;
}

/** Returns false when the bucket is over its limit. Fails open. */
async function hitRateLimit(bucket: string, rule: RateLimitRule): Promise<boolean> {
  const supabase = getRateLimitClient();
  if (!supabase) return true;
  try {
    const { data, error } = await supabase.rpc('form_rate_limit_hit', {
      p_bucket: bucket,
      p_window_seconds: rule.windowSec,
      p_max: rule.max,
    });
    if (error) throw error;
    return data !== false;
  } catch (err) {
    if (!warnedRateLimit) {
      console.error(
        '[form-guard] Rate-limit RPC failed; allowing request. Is supabase/migrations/20260929120000_form_rate_limits.sql applied?',
        err instanceof Error ? err.message : err,
      );
      warnedRateLimit = true;
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// BotID
// ---------------------------------------------------------------------------

async function isBotRequest(): Promise<boolean> {
  // BotID only exists on Vercel. Elsewhere (local `next start`, CI) there is nothing to ask.
  if (!process.env.VERCEL) return false;
  try {
    const verification = await checkBotId();
    return verification.isBot;
  } catch (err) {
    // Not deployed on Vercel, OIDC disabled, or BotID unreachable. Other layers still apply.
    console.error('[form-guard] BotID check failed; allowing request.', err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Cloudflare Turnstile
// ---------------------------------------------------------------------------

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** True when the token is missing or Cloudflare rejects it. Fails open when Cloudflare is unreachable. */
async function failsTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  if (typeof token !== 'string' || token.length < 10 || token.length > 4096) return true;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(4000) });
    const data = (await res.json()) as { success?: boolean };
    return data.success !== true;
  } catch (err) {
    console.error('[form-guard] Turnstile verify failed; allowing request.', err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// The guard
// ---------------------------------------------------------------------------

function drop(config: GuardConfig, reason: string): GuardResult {
  console.warn(`[form-guard] dropped endpoint=${config.endpoint} reason=${reason}`);
  return { action: 'drop', reason };
}

export async function guardSubmission(input: {
  config: GuardConfig;
  headers: HeaderReader;
  honeypot: unknown;
  token: unknown;
  /** Turnstile response token, read from the body by guardFieldsFromBody. */
  turnstile?: unknown;
  /** Raw email from the request; normalized and validated here for the email bucket. */
  email?: unknown;
}): Promise<GuardResult> {
  const { config } = input;

  // 1. Honeypot. Any non-empty value means a script filled every field.
  if (typeof input.honeypot === 'string' ? input.honeypot.trim() !== '' : input.honeypot != null) {
    return drop(config, 'honeypot');
  }

  // 2. Signed render token + minimum fill time.
  const secret = getSecret();
  let nonce: string | null = null;
  if (secret) {
    const check = verifyFormToken(input.token, secret, {
      maxAgeMs: TOKEN_MAX_AGE_MS,
      futureSkewMs: TOKEN_FUTURE_SKEW_MS,
    });
    if (!check.ok) {
      if (check.reason === 'expired') {
        return {
          action: 'reject',
          status: 400,
          message: FORM_GUARD_MESSAGES.expired,
        };
      }
      return drop(config, `token-${check.reason}`);
    }
    if (check.ageMs < minFillMs(config)) return drop(config, 'too-fast');
    nonce = check.nonce;
  }

  // 3. Vercel BotID (bypassed in local development by the library itself).
  if (await isBotRequest()) return drop(config, 'botid');

  // 3b. Turnstile, for endpoints that spend money per request. Before the rate limits, so a bot
  // that fails the challenge never uses up a real visitor's bucket.
  if (config.turnstile && (await failsTurnstile(input.turnstile, getClientIp(input.headers)))) {
    return drop(config, 'turnstile');
  }

  // 4. Rate limits. Buckets are hashed so the table never stores raw IPs or emails.
  if (secret) {
    const limited = await applyRateLimits(config, input.headers, input.email, nonce, secret);
    if (limited) return limited;
  }

  return { action: 'allow' };
}

/** Runs the endpoint's rate limits. Returns the result to send back, or null when every bucket allows it. */
async function applyRateLimits(
  config: GuardConfig,
  headers: HeaderReader,
  rawEmail: unknown,
  nonce: string | null,
  secret: string,
): Promise<GuardResult | null> {
  const ip = getClientIp(headers);
  const email = normalizeEmail(rawEmail);
  // Bucket on the address without a +tag, so name+1@x and name+2@x count as one inbox.
  const bucketEmail = isValidEmail(email) ? collapsePlusTag(email) : null;
  const values: Record<RateLimitRule['key'], string | null> = {
    ip,
    email: bucketEmail,
    token: nonce,
  };

  const checks = config.limits
    .filter((rule) => values[rule.key])
    .map(async (rule) => {
      const bucket = `${config.endpoint}:${rule.key}:${rule.windowSec}:${hashBucket(values[rule.key]!, secret)}`;
      return { rule, allowed: await hitRateLimit(bucket, rule) };
    });

  const results = await Promise.all(checks);
  const blocked = results.find((r) => !r.allowed);
  if (!blocked) return null;
  if (blocked.rule.key === 'ip') {
    console.warn(`[form-guard] rate-limited endpoint=${config.endpoint} key=ip window=${blocked.rule.windowSec}s`);
    return {
      action: 'reject',
      status: 429,
      message: FORM_GUARD_MESSAGES.rateLimited,
    };
  }
  return drop(config, `rate-limit-${blocked.rule.key}`);
}

/**
 * Guard for a signed link from an email (the unsubscribe link and its RFC 8058
 * one-click POST). There is no form, so no honeypot or render token, and the
 * one-click POST comes from a mail provider's servers, which BotID would call a
 * bot. The signed link is the proof of origin; this applies only the rate limits,
 * to cap what a replayed link can cost. Same results as guardSubmission.
 */
export async function guardSignedLink(input: {
  config: GuardConfig;
  headers: HeaderReader;
  /** The address the link was signed for. */
  email: string;
}): Promise<GuardResult> {
  const secret = getSecret();
  if (!secret) return { action: 'allow' };
  return (await applyRateLimits(input.config, input.headers, input.email, null, secret)) ?? { action: 'allow' };
}

/**
 * Guard for an anonymous beacon (a call-click count). There is no form and no address, so
 * only the per-IP rate limits apply. Same results as guardSubmission.
 */
export async function guardBeacon(input: { config: GuardConfig; headers: HeaderReader }): Promise<GuardResult> {
  const secret = getSecret();
  if (!secret) return { action: 'allow' };
  return (await applyRateLimits(input.config, input.headers, '', null, secret)) ?? { action: 'allow' };
}

/** Reads the two guard fields from a JSON body. */
export function guardFieldsFromBody(body: unknown): { honeypot: unknown; token: unknown; turnstile: unknown } {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return { honeypot: record[HONEYPOT_FIELD], token: record[TOKEN_FIELD], turnstile: record[TURNSTILE_FIELD] };
}

/** Reads the two guard fields from FormData (server actions). */
export function guardFieldsFromFormData(formData: FormData): { honeypot: unknown; token: unknown; turnstile: unknown } {
  return { honeypot: formData.get(HONEYPOT_FIELD), token: formData.get(TOKEN_FIELD), turnstile: formData.get(TURNSTILE_FIELD) };
}
