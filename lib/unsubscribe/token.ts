/**
 * Signed unsubscribe tokens for follow-up email links.
 *
 * Format: `u1.<base64url(email)>.<hmac>` where hmac = HMAC-SHA256(secret, "u1.<base64url(email)>").
 * The token names one address and proves we issued it, so a link can't be edited to
 * unsubscribe somebody else. It does not expire: an unsubscribe link has to keep
 * working for as long as the email sits in an inbox (RFC 8058 asks for that too).
 * Unsubscribing is idempotent, so a replayed token does nothing new.
 *
 * Only depends on node:crypto.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const VERSION = 'u1';
const MAX_TOKEN_LENGTH = 600;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signUnsubscribeToken(email: string, secret: string): string {
  const payload = `${VERSION}.${Buffer.from(email, 'utf8').toString('base64url')}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** The address the token was issued for, or null when it is missing, malformed or forged. */
export function verifyUnsubscribeToken(token: unknown, secret: string): string | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) return null;
  const [version, encodedEmail, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(encodedEmail) || !/^[A-Za-z0-9_-]+$/.test(sig)) return null;

  const expected = Buffer.from(sign(`${version}.${encodedEmail}`, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const email = Buffer.from(encodedEmail, 'base64url').toString('utf8');
  return email.includes('@') ? email : null;
}
