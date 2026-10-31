/**
 * Signed render-timestamp tokens for the form honeypot.
 *
 * Format: `v1.<issuedAtMs>.<nonce>.<hmac>` where hmac = HMAC-SHA256(secret, "v1.<issuedAtMs>.<nonce>").
 * A bot can't skip the minimum fill-time check by forging a timestamp, because it
 * doesn't have the secret. It has to fetch a real token and then wait.
 *
 * Only depends on node:crypto so `node --test` can run it directly.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type TokenCheck =
  | { ok: true; issuedAt: number; nonce: string; ageMs: number }
  | { ok: false; reason: 'missing' | 'malformed' | 'bad-signature' | 'expired' | 'future' };

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createFormToken(secret: string, now: number = Date.now()): string {
  const nonce = randomBytes(12).toString('base64url');
  const payload = `v1.${now}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyFormToken(
  token: unknown,
  secret: string,
  opts: { now?: number; maxAgeMs: number; futureSkewMs: number },
): TokenCheck {
  if (typeof token !== 'string' || token.length === 0) return { ok: false, reason: 'missing' };
  if (token.length > 200) return { ok: false, reason: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return { ok: false, reason: 'malformed' };
  const [version, issuedRaw, nonce, sig] = parts;
  if (!/^\d{10,16}$/.test(issuedRaw) || !/^[A-Za-z0-9_-]{8,32}$/.test(nonce)) {
    return { ok: false, reason: 'malformed' };
  }

  const expected = Buffer.from(sign(`${version}.${issuedRaw}.${nonce}`, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'bad-signature' };
  }

  const now = opts.now ?? Date.now();
  const issuedAt = Number(issuedRaw);
  const ageMs = now - issuedAt;
  if (ageMs < -opts.futureSkewMs) return { ok: false, reason: 'future' };
  if (ageMs > opts.maxAgeMs) return { ok: false, reason: 'expired' };
  return { ok: true, issuedAt, nonce, ageMs: Math.max(0, ageMs) };
}
