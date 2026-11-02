import 'server-only';
import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { createClient } from '@supabase/supabase-js';
import { BookingError, required } from './security';
import type { Booking, Connection, Host, HostId, Invite } from './model';

// Lazy construction allows builds and the unconfigured landing page without secrets.
export function db() {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
}
export function checked<T>({ data, error }: { data: T; error: unknown }): NonNullable<T> {
  if (error || data === null) throw new BookingError(503, E.storageUnavailable);
  return data as NonNullable<T>;
}
export async function getHost(id: HostId): Promise<Host> {
  return checked(await db().from('booking_hosts').select('*').eq('id', id).single());
}
export async function connections(id: HostId): Promise<Connection[]> {
  return checked(await db().from('booking_connections').select('*').eq('host_id', id));
}
export async function getBooking(id: string): Promise<Booking | null> {
  const result = await db().from('booking_reservations').select('*').eq('id', id).maybeSingle();
  if (result.error) throw new BookingError(503, E.storageUnavailable);
  return result.data;
}
export async function getInvite(tokenHash: string): Promise<Invite | null> {
  const result = await db().from('booking_invites').select('*').eq('token_hash', tokenHash).maybeSingle();
  if (result.error) throw new BookingError(503, E.storageUnavailable);
  return result.data;
}
export async function rateLimit(request: Request, category: string, max: number, identity?: string) {
  // Platform-supplied address on Vercel; do not trust an arbitrary forwarding chain.
  const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') ?? 'unknown' : 'local';
  const { createHmac } = await import('node:crypto');
  const opaque = createHmac('sha256', required('BOOKING_ENCRYPTION_KEY')).update(identity ?? ip).digest('hex');
  const result = await db().rpc('form_rate_limit_hit', { p_bucket: `booking:${category}:${opaque}`, p_window_seconds: 3600, p_max: max });
  if (result.error) throw new BookingError(503, E.unavailable);
  if (result.data !== true) throw new BookingError(429, E.rateLimited);
}
