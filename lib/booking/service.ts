import 'server-only';
import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { candidates, DURATION, HORIZON, localDate, overlaps, scheduleSchema, type Booking, type HostId, type Invite } from './model';
import { checked, connections, db, getBooking, getHost, getInvite } from './db';
import { api, eventBody, eventId, eventPath, GoogleError, googleBusy, type GoogleEvent } from './google';
import { BookingError, hash, seal } from './security';

export const credentialSchema = z.object({ id: z.uuid(), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) });
export const bookingSchema = credentialSchema.extend({ host: z.enum(['john', 'abe']), start: z.iso.datetime(), name: z.string().trim().min(1).max(100), email: z.email().max(254).transform(v => v.trim().toLowerCase()), context: z.string().trim().max(2000).default(''), invite: z.string().max(100).optional(), aiConsent: z.boolean().default(false) });
export async function owned(id: string, token: string): Promise<Booking> {
  const booking = await getBooking(id);
  if (!booking || booking.token_hash !== hash(token)) throw new BookingError(404, E.invalidBooking);
  return booking;
}
export async function invitation(token: string | undefined, host: HostId, date?: string, email?: string, existing?: Booking): Promise<Invite | null> {
  let invite: Invite | null = null;
  if (existing?.invite_id) {
    invite = checked(await db().from('booking_invites').select('*').eq('id', existing.invite_id).single());
  } else if (token) invite = await getInvite(hash(token));
  if (!token && !existing?.invite_id) return null;
  if (!invite || invite.host_id !== host || invite.revoked || Date.parse(invite.expires_at) <= Date.now() || (date && (date < invite.from_date || date > invite.to_date)) || (email && invite.recipient && email !== invite.recipient)) throw new BookingError(404, E.invalidInvite);
  if (!existing) {
    const used = checked(await db().from('booking_reservations').select('id').eq('invite_id', invite.id).limit(1));
    if (used.length) throw new BookingError(404, E.usedInvite);
  }
  return invite;
}
export async function availability(hostId: HostId, date: string, inviteToken?: string, existing?: Booking) {
  const host = await getHost(hostId);
  host.schedule = scheduleSchema.parse(host.schedule);
  const invite = await invitation(inviteToken, hostId, date, existing?.email, existing);
  const slots = candidates(date, host.schedule, !!invite);
  if (!slots.length) return { host, invite, slots: [] };
  const all = await connections(hostId);
  if (!host.destination_connection || !host.destination_calendar) throw new BookingError(503, E.hostPaused);
  const dest = all.find(c => c.id === host.destination_connection);
  if (!dest?.calendars.includes(host.destination_calendar)) throw new BookingError(503, E.calendarReconnect);
  const start = new Date(Date.parse(slots[0].start) - 86400_000).toISOString();
  const end = new Date(Date.parse(slots[slots.length - 1].end) + 86400_000).toISOString();
  const [google, reservations] = await Promise.all([
    googleBusy(all, start, end, existing),
    db().from('booking_reservations').select('*').eq('host_id', hostId).neq('status', 'cancelled').lt('start_at', end),
  ]);
  const stored = checked(reservations) as Booking[];
  const busy = [...google, ...stored.filter(b => b.id !== existing?.id).flatMap(b => [
    { start: b.start_at, end: b.end_at }, ...(b.next_start && b.next_end ? [{ start: b.next_start, end: b.next_end }] : []),
  ])];
  return { host, invite, slots: slots.filter(s => !busy.some(b => overlaps(s, b))) };
}

export async function reserve(input: z.infer<typeof bookingSchema>, existing?: Booking) {
  const previous = existing ?? await getBooking(input.id);
  if (!existing && previous) {
    if (previous.token_hash !== hash(input.token)) throw new BookingError(409, E.newBooking);
    return previous; // An idempotent retry never changes the existing request.
  }
  const currentHost = await getHost(input.host);
  const date = localDate(new Date(input.start), currentHost.schedule.timezone);
  const { host, invite, slots } = await availability(input.host, date, input.invite, existing);
  if (!slots.some(s => s.start === new Date(input.start).toISOString())) throw new BookingError(409, E.slotUnavailable);
  const result = await db().rpc('booking_reserve', {
    p_booking: { id: input.id, host_id: input.host, token_hash: hash(input.token), management_secret: seal(input.token), name: input.name, email: input.email, context: input.context,
      start_at: input.start, end_at: new Date(Date.parse(input.start) + DURATION * 60_000).toISOString(), invite_id: invite?.id ?? null, revision: host.revision, ai_consent: input.aiConsent },
    p_schedule: host.schedule, p_move: !!existing,
  });
  if (result.error) {
    // SQL exceptions roll the transaction back. A transport failure can arrive
    // after commit and must preserve the guest's idempotency credential.
    const rejected = ['schedule_changed', 'booking_state', 'invalid_time', 'slot_taken', 'invite_invalid', 'invite_used', 'not_connected'];
    if (result.error.code === 'P0001' && rejected.includes(result.error.message)) throw new BookingError(409, E.availabilityChanged);
    throw new BookingError(503, E.storageUnavailable);
  }
  return (await getBooking(input.id))!;
}

/** One leased worker per booking. Keep uncertain operations reserved until recovered. */
export async function reconcile(id: string): Promise<Booking> {
  const worker = randomUUID();
  const claim = checked(await db().from('booking_reservations').update({ worker_id: worker, worker_until: new Date(Date.now() + 180_000).toISOString(), next_attempt_at: new Date(Date.now() + 300_000).toISOString() })
    .eq('id', id).in('status', ['pending', 'moving', 'cancelling']).or(`worker_until.is.null,worker_until.lt.${new Date().toISOString()}`).select('*')) as Booking[];
  if (!claim.length) return (await getBooking(id))!;
  const booking = claim[0];
  try {
    const connection = checked(await db().from('booking_connections').select('*').eq('id', booking.connection_id).eq('host_id', booking.host_id).single());
    const path = `${eventPath(booking)}/${eventId(booking)}`;
    let event: GoogleEvent | null = null;
    try { event = await api<GoogleEvent>(connection, path); }
    catch (error) { if (!(error instanceof GoogleError && [404, 410].includes(error.status))) throw error; }
    let changes: Partial<Booking>;
    if (booking.status === 'cancelling') {
      // An interrupted create may still be executing. Hold its cancellation
      // until the original server execution window has elapsed, then recheck.
      if (!event && Date.now() - Date.parse(booking.created_at) < 180_000) throw new BookingError(503, E.waitForUpdate);
      if (event && event.status !== 'cancelled') {
        try { await api(connection, `${path}?sendUpdates=all`, 'DELETE'); }
        catch (error) { if (!(error instanceof GoogleError && [404, 410].includes(error.status))) throw error; }
      }
      changes = { status: 'cancelled', next_start: null, next_end: null };
    } else if (event?.status === 'cancelled') {
      changes = { status: 'cancelled', next_start: null, next_end: null };
    } else {
      if (!event) {
        if (booking.status === 'moving') throw new BookingError(503, E.originalEventMissing);
        try {
          event = await api<GoogleEvent>(connection, `${eventPath(booking)}?conferenceDataVersion=1&sendUpdates=all`, 'POST', {
            id: eventId(booking), ...eventBody(booking), conferenceData: { createRequest: { requestId: booking.conference_request_id, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
          });
        } catch (error) {
          if (error instanceof GoogleError && error.status === 409) event = await api<GoogleEvent>(connection, path);
          else throw error;
        }
      }
      if (booking.status === 'pending' && !event.hangoutLink && event.conferenceData?.createRequest?.status?.statusCode !== 'pending') {
        // Google requires a new request ID after a failed conference request.
        // Persist before PATCH so a lost response retries the same request.
        let requestId = booking.conference_request_id;
        if (event.conferenceData?.createRequest?.requestId === requestId) {
          requestId = randomUUID();
          checked(await db().from('booking_reservations').update({ conference_request_id: requestId }).eq('id', id).eq('worker_id', worker).select('id'));
        }
        event = await api<GoogleEvent>(connection, `${path}?conferenceDataVersion=1&sendUpdates=all`, 'PATCH', {
          conferenceData: { createRequest: { requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
        });
      }
      if (booking.status === 'moving' && (Date.parse(event.start?.dateTime ?? '') !== Date.parse(booking.next_start!) || Date.parse(event.end?.dateTime ?? '') !== Date.parse(booking.next_end!))) {
        event = await api<GoogleEvent>(connection, `${path}?sendUpdates=all`, 'PATCH', eventBody(booking));
      }
      // Meet conference creation is asynchronous. Keep the reservation pending
      // until a later read supplies the link, rather than confirming prematurely.
      if (booking.status === 'pending' && !event.hangoutLink) throw new BookingError(503, E.meetPending);
      changes = { status: 'confirmed', meet_url: event.hangoutLink ?? booking.meet_url, ...(booking.status === 'moving' ? { start_at: booking.next_start!, end_at: booking.next_end!, next_start: null, next_end: null } : {}) };
    }
    checked(await db().from('booking_reservations').update({ ...changes, worker_id: null, worker_until: null }).eq('id', id).eq('worker_id', worker).select('id'));
  } catch {
    // No PII, credentials, event bodies or provider errors in logs. A later poll or
    // host recovery call retries this durable operation using the same event ID.
    checked(await db().from('booking_reservations').update({ worker_id: null, worker_until: null }).eq('id', id).eq('worker_id', worker).select('id'));
  }
  return (await getBooking(id))!;
}
export function view(booking: Booking) {
  return { id: booking.id, host: booking.host_id, start: booking.start_at, end: booking.end_at, status: booking.status, meetUrl: booking.meet_url, private: !!booking.invite_id, resource: /learn|training|skills|team/i.test(booking.context) ? 'learning' : /case|example|proof/i.test(booking.context) ? 'work' : 'assessment' };
}
export async function cancel(booking: Booking) {
  if (booking.status === 'cancelled') return booking;
  if (!['confirmed', 'pending'].includes(booking.status)) throw new BookingError(409, E.waitForUpdate);
  const changed = checked(await db().from('booking_reservations').update({ status: 'cancelling' }).eq('id', booking.id).eq('status', booking.status).is('worker_id', null).select('id'));
  if (!changed.length) throw new BookingError(409, E.updateInProgress);
  return reconcile(booking.id);
}
export async function createInvite(host: HostId, from: string, to: string, recipient?: string) {
  const { secret } = await import('./security');
  const token = secret(), expires = new Date(Math.min(Date.parse(`${to}T23:59:59Z`), Date.now() + HORIZON)).toISOString();
  if (Date.parse(expires) <= Date.now() || from > to || Date.parse(`${to}T00:00:00Z`) > Date.now() + HORIZON) throw new BookingError(400, E.inviteDates);
  const row = checked(await db().from('booking_invites').insert({ host_id: host, token_hash: hash(token), from_date: from, to_date: to, expires_at: expires, recipient: recipient || null }).select('id').single());
  return { id: row.id, token, expires };
}
