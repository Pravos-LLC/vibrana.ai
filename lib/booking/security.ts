import { BOOKING_ERRORS as E } from '@/src/booking-content';
import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { hostId, type HostId } from './model';

export class BookingError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function required(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith('encrypted:')) throw new BookingError(503, E.setupIncomplete);
  return value;
}
export function configurationComplete(): boolean {
  try {
    origin(); key();
    for (const name of ['BOOKING_GOOGLE_CLIENT_ID', 'BOOKING_GOOGLE_CLIENT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) required(name);
    return !!(process.env.BOOKING_JOHN_EMAIL || process.env.BOOKING_ABE_EMAIL);
  } catch { return false; }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
function key(): Buffer {
  const value = Buffer.from(required('BOOKING_ENCRYPTION_KEY'), 'base64');
  if (value.length !== 32) throw new BookingError(503, E.setupIncomplete);
  return value;
}
export function seal(value: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
export function unseal(value: string): string {
  const raw = Buffer.from(value, 'base64url'), decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}
export function sign(value: object): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${createHmac('sha256', key()).update(payload).digest('base64url')}`;
}
export function verify<T>(value: string | undefined): T | null {
  try {
    const [payload, mac, extra] = (value ?? '').split('.');
    const expected = createHmac('sha256', key()).update(payload).digest();
    const actual = Buffer.from(mac, 'base64url');
    if (extra || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return parsed.exp > Date.now() ? parsed as T : null;
  } catch { return null; }
}
export function origin(): string {
  const url = new URL(required('BOOKING_ORIGIN'));
  if ((url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && url.hostname === 'localhost')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new BookingError(503, E.originMissing);
  return url.origin;
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== origin()) throw new BookingError(403, E.crossOrigin);
}
export function configuredHost(email: string): HostId | null {
  return (['john', 'abe'] as const).find(id => process.env[`BOOKING_${id.toUpperCase()}_EMAIL`]?.toLowerCase() === email.toLowerCase()) ?? null;
}
export async function session(): Promise<HostId | null> {
  const payload = verify<{ host: HostId; email: string; exp: number }>((await cookies()).get('booking_session')?.value);
  return payload && typeof payload.email === 'string' && hostId.safeParse(payload.host).success && configuredHost(payload.email) === payload.host ? payload.host : null;
}
export async function requireHost(): Promise<HostId> {
  const host = await session();
  if (!host) throw new BookingError(401, E.signIn);
  return host;
}
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/booking', maxAge: 600 });
export function publicError(error: unknown): Response {
  const known = error instanceof BookingError;
  return Response.json({ error: known ? error.message : 'Booking is temporarily unavailable. Please try again.' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
