import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db as fake, ok, fail, type Query } from './helpers/fake-supabase';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), api: vi.fn(), busy: vi.fn(), calendars: vi.fn() }));
vi.mock('@supabase/supabase-js', async () => {
  const { db } = await import('./helpers/fake-supabase');
  return { createClient: () => ({ ...db.client, rpc: mocks.rpc }) };
});
vi.mock('@/lib/booking/google', async importOriginal => ({ ...await importOriginal<object>(), api: mocks.api, googleBusy: mocks.busy, listCalendars: mocks.calendars }));
import { availability, bookingSchema, cancel, createInvite, invitation, owned, reconcile, reserve, view } from '@/lib/booking/service';
import { checked, rateLimit } from '@/lib/booking/db';
import { defaultSchedule, type Booking, type Host, type Invite } from '@/lib/booking/model';
import { hash, seal } from '@/lib/booking/security';
import { GoogleError } from '@/lib/booking/google';
import { POST } from '@/app/api/booking/route';
import { GET as hostGet, POST as hostPost } from '@/app/api/booking/host/route';
import { GET as recoverGet } from '@/app/api/booking/reconcile/route';

const cookieJar = vi.hoisted(() => new Map<string, string>());
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => ({ value: cookieJar.get(name) }), delete: ({ name }: { name: string }) => cookieJar.delete(name) }) }));
import { sign } from '@/lib/booking/security';

describe('booking lifecycle and API boundaries', () => {
  let host: Host, booking: Booking | null, invite: Invite | null;
  const id = '12345678-1234-4234-8234-123456789012', token = 'a'.repeat(43), connectionId = '22345678-1234-4234-8234-123456789012';
  const input = () => ({ id, token, host: 'john' as const, name: 'Visitor', email: 'visitor@example.test', context: '', aiConsent: false, start: '2026-10-26T06:00:00.000Z' });
  const makeBooking = (status: Booking['status'] = 'pending'): Booking => ({ id, host_id: 'john', token_hash: hash(token), management_secret: seal(token), name: 'Visitor', email: 'visitor@example.test', context: '', ai_consent: false, start_at: input().start, end_at: '2026-10-26T06:30:00.000Z', next_start: null, next_end: null, status, connection_id: connectionId, calendar_id: 'one', invite_id: null, conference_request_id: id, meet_url: null, created_at: new Date().toISOString(), worker_id: null, worker_until: null });
  const request = (body: unknown, headers: Record<string, string> = { origin: 'https://book.vibrana.ai' }) => new Request('https://book.vibrana.ai/api/booking', { method: 'POST', headers, body: JSON.stringify(body) });
  function respond(q: Query) {
    if (q.table === 'booking_hosts') return ok(host);
    if (q.table === 'booking_connections') {
      const row = { id: connectionId, host_id: 'john', account: 'john@example.test', token: seal('refresh'), calendars: ['one'] };
      return ok(q.single ? row : [row]);
    }
    if (q.table === 'booking_invites') {
      if (q.op === 'insert') return ok({ id: '32345678-1234-4234-8234-123456789012' });
      if (q.single) return ok(invite);
      return ok(invite ? [invite] : []);
    }
    if (q.table === 'booking_reservations') {
      if (q.op === 'update' && booking) { Object.assign(booking, q.payload); return ok([booking]); }
      if (q.single) return ok(booking);
      if (q.filters.some(([column]) => column === 'invite_id')) return ok(booking?.invite_id ? [booking] : []);
      return ok(booking ? [booking] : []);
    }
    return ok([]);
  }
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-25T00:00:00Z'));
    vi.stubEnv('BOOKING_ENCRYPTION_KEY', Buffer.alloc(32, 3).toString('base64')); vi.stubEnv('SUPABASE_URL', 'http://localhost:54321'); vi.stubEnv('SUPABASE_SERVICE_KEY', 'test'); vi.stubEnv('BOOKING_ORIGIN', 'https://book.vibrana.ai'); vi.stubEnv('BOOKING_JOHN_EMAIL', 'john@example.test'); vi.stubEnv('CRON_SECRET', 'cron');
    cookieJar.clear(); host = { id: 'john', revision: 'revision', schedule: defaultSchedule('john'), destination_connection: connectionId, destination_calendar: 'one' }; booking = null; invite = null;
    fake.reset(); fake.respond = respond; mocks.busy.mockReset().mockResolvedValue([]); mocks.api.mockReset(); mocks.calendars.mockReset().mockResolvedValue([{ id: 'one', summary: 'Calendar', accessRole: 'owner' }]);
    mocks.rpc.mockReset().mockImplementation(async (name: string, args: { p_booking?: Record<string, unknown>; p_move?: boolean }) => {
      if (name === 'booking_reserve') {
        if (args.p_move && booking) Object.assign(booking, { status: 'moving', next_start: args.p_booking!.start_at, next_end: args.p_booking!.end_at });
        else booking = { ...makeBooking(), ...args.p_booking } as Booking;
        return ok(id);
      }
      return ok(true);
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
  it('blocks unknown management credentials and never returns attendee data', async () => {
    await expect(owned(id, token)).rejects.toMatchObject({ status: 404 });
    booking = makeBooking('confirmed');
    await expect(owned(id, 'wrong')).rejects.toMatchObject({ status: 404 });
    expect(view(await owned(id, token))).not.toHaveProperty('email');
  });
  it('fails closed on storage, rate limit and calendar failures', async () => {
    expect(() => checked(fail('db'))).toThrow();
    mocks.rpc.mockResolvedValueOnce(fail('unavailable')); await expect(rateLimit(request({}), 'test', 1)).rejects.toMatchObject({ status: 503 });
    mocks.rpc.mockResolvedValueOnce(ok(false)); await expect(rateLimit(request({}), 'test', 1)).rejects.toMatchObject({ status: 429 });
    mocks.busy.mockRejectedValueOnce(new Error('offline')); await expect(availability('john', '2026-10-26')).rejects.toThrow();
    host.destination_calendar = null; await expect(availability('john', '2026-10-26')).rejects.toThrow();
  });
  it('checks invite expiry, revocation, recipient, host and single use without disclosing private hours', async () => {
    invite = { id: 'invite', host_id: 'john', token_hash: hash('invite'), from_date: '2026-10-26', to_date: '2026-10-27', expires_at: '2026-10-28T00:00Z', revoked: false, recipient: 'visitor@example.test' };
    expect((await invitation('invite', 'john', '2026-10-26'))?.id).toBe('invite');
    await expect(invitation('invite', 'abe', '2026-10-26')).rejects.toThrow();
    await expect(invitation('invite', 'john', '2026-10-26', 'other@example.test')).rejects.toThrow();
    invite.revoked = true; await expect(invitation('invite', 'john', '2026-10-26')).rejects.toThrow();
    invite.revoked = false; booking = { ...makeBooking(), invite_id: 'invite' };
    await expect(invitation('invite', 'john', '2026-10-26')).rejects.toThrow('already been used');
    expect(await invitation(undefined, 'john', '2026-10-26')).toBeNull();
  });
  it('filters Google conflicts and stored reservations, including pending moves', async () => {
    booking = makeBooking('moving'); booking.next_start = '2026-10-26T08:00Z'; booking.next_end = '2026-10-26T08:30Z';
    mocks.busy.mockResolvedValue([{ start: '2026-10-26T09:00Z', end: '2026-10-26T09:30Z' }]);
    const result = await availability('john', '2026-10-26');
    expect(result.slots.some(s => ['2026-10-26T06:00:00.000Z', '2026-10-26T08:00:00.000Z', '2026-10-26T09:00:00.000Z'].includes(s.start))).toBe(false);
    expect((await availability('john', '2026-10-31')).slots).toEqual([]);
  });
  it('reserves once, rejects conflicts and keeps idempotent retries stable', async () => {
    const result = await reserve(input()); expect(result.id).toBe(id);
    expect((await reserve({ ...input(), start: '2026-10-26T08:00Z' })).start_at).toBe(input().start);
    await expect(reserve({ ...input(), token: 'b'.repeat(43) })).rejects.toMatchObject({ status: 409 });
    booking = null; await expect(reserve({ ...input(), start: '2026-10-26T00:00Z' })).rejects.toMatchObject({ status: 409 });
    mocks.rpc.mockResolvedValueOnce(fail('P0001', 'slot_taken')); await expect(reserve(input())).rejects.toMatchObject({ status: 409 });
  });
  it('retains uncertainty after a reservation commits but its RPC response is lost', async () => {
    mocks.rpc.mockImplementationOnce(async () => { booking = makeBooking(); return fail('PGRST000', 'connection lost'); });
    await expect(reserve(input())).rejects.toMatchObject({ status: 503 });
    // Same credential recovers the existing row; no second reservation is made.
    expect((await reserve(input())).id).toBe(id); expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it('recovers a timed-out event creation by fetching the deterministic ID without sending a duplicate invite', async () => {
    booking = makeBooking();
    mocks.api.mockResolvedValue({ id: id.replaceAll('-', ''), hangoutLink: 'https://meet.google.com/example' });
    expect((await reconcile(id)).status).toBe('confirmed');
    expect(mocks.api).toHaveBeenCalledTimes(1);
    expect(fake.find('booking_reservations', 'update').at(-1)?.payload).toMatchObject({ status: 'confirmed', worker_until: null });
  });
  it('keeps an uncertain reservation held and later recovers a 409 create race', async () => {
    booking = makeBooking(); mocks.api.mockRejectedValueOnce(new GoogleError(404)).mockRejectedValueOnce(new Error('timeout'));
    expect((await reconcile(id)).status).toBe('pending');
    expect(fake.find('booking_reservations', 'update')[0].payload).toMatchObject({ next_attempt_at: '2026-10-25T00:05:00.000Z' });
    mocks.api.mockRejectedValueOnce(new GoogleError(404)).mockRejectedValueOnce(new GoogleError(409)).mockResolvedValueOnce({ id: 'event', hangoutLink: 'https://meet.google.com/example' });
    expect((await reconcile(id)).status).toBe('confirmed');
  });
  it('creates meetings with Meet conferencing, updates the same event on a move, and cancels idempotently', async () => {
    booking = makeBooking(); mocks.api.mockRejectedValueOnce(new GoogleError(404)).mockResolvedValueOnce({ id: 'event', hangoutLink: 'https://meet.google.com/example' });
    await reconcile(id); expect(mocks.api.mock.calls[1][3]).toHaveProperty('conferenceData.createRequest');
    await reserve({ ...input(), start: '2026-10-26T08:00:00Z' }, booking!);
    mocks.api.mockResolvedValueOnce({ id: 'event', start: { dateTime: input().start } }).mockResolvedValueOnce({ id: 'event' });
    expect((await reconcile(id)).start_at).toBe('2026-10-26T08:00:00Z');
    mocks.api.mockResolvedValueOnce({ id: 'event' }).mockResolvedValueOnce(undefined);
    expect((await cancel(booking!)).status).toBe('cancelled');
    expect((await cancel(booking!)).status).toBe('cancelled');
    booking = makeBooking('moving'); await expect(cancel(booking)).rejects.toMatchObject({ status: 409 });
  });
  it('persists a fresh request ID after failed Meet creation and permits cancellation of a pending meeting', async () => {
    booking = makeBooking();
    mocks.api.mockResolvedValueOnce({ id: 'event', conferenceData: { createRequest: { requestId: id, status: { statusCode: 'failure' } } } }).mockResolvedValueOnce({ id: 'event', hangoutLink: 'https://meet.google.com/example' });
    expect((await reconcile(id)).status).toBe('confirmed');
    const attempt = fake.find('booking_reservations', 'update').find(q => (q.payload as Record<string, unknown>).conference_request_id);
    expect((attempt?.payload as Record<string, unknown>).conference_request_id).not.toBe(id);
    expect(mocks.api.mock.calls[1][3]).toHaveProperty('conferenceData.createRequest');
    booking = makeBooking(); mocks.api.mockResolvedValueOnce({ id: 'event' }).mockResolvedValueOnce(undefined);
    expect((await cancel(booking)).status).toBe('cancelled');
    booking = makeBooking(); mocks.api.mockRejectedValueOnce(new GoogleError(404));
    expect((await cancel(booking)).status).toBe('cancelling');
    vi.advanceTimersByTime(180_001); mocks.api.mockRejectedValueOnce(new GoogleError(404));
    expect((await reconcile(id)).status).toBe('cancelled');
  });
  it('handles cancelled provider events and does not steal an active worker lease', async () => {
    booking = makeBooking(); mocks.api.mockResolvedValueOnce({ id: 'event', status: 'cancelled' });
    expect((await reconcile(id)).status).toBe('cancelled');
    booking = makeBooking(); fake.respond = q => q.table === 'booking_reservations' && q.op === 'update' ? ok([]) : respond(q);
    mocks.api.mockClear(); expect((await reconcile(id)).status).toBe('pending'); expect(mocks.api).not.toHaveBeenCalled();
  });
  it('bounds private invitations to 30 days and keeps tokens out of storage', async () => {
    const result = await createInvite('john', '2026-10-26', '2026-10-28');
    expect(result.token).toHaveLength(43); expect(JSON.stringify(fake.find('booking_invites', 'insert')[0].payload)).not.toContain(result.token);
    await expect(createInvite('john', '2026-10-26', '2027-01-01')).rejects.toThrow();
  });
  it('rejects cross-origin, invalid input and oversized requests before mutation', async () => {
    expect((await POST(request({ action: 'book' }, { origin: 'https://other.test' }))).status).toBe(403);
    expect((await POST(request({ action: 'book' }))).status).toBe(400);
    expect((await POST(request({}, { origin: 'https://book.vibrana.ai', 'content-length': '13000' }))).status).toBe(413);
    expect(bookingSchema.safeParse({ ...input(), email: 'bad' }).success).toBe(false);
  });
  it('serves availability and booking management with no cache', async () => {
    const slots = await POST(request({ action: 'availability', host: 'john', date: '2026-10-26' }));
    expect(slots.status).toBe(200); expect(slots.headers.get('cache-control')).toBe('no-store');
    booking = makeBooking('confirmed'); expect((await POST(request({ action: 'status', id, token }))).status).toBe(200);
  });
  it('requires host session and cron authentication, and only exposes safe host connection fields', async () => {
    expect(await (await hostGet()).json()).toMatchObject({ authenticated: false });
    expect((await hostPost(request({ action: 'invite' }))).status).toBe(401);
    expect((await recoverGet(new Request('https://book.vibrana.ai/api/booking/reconcile'))).status).toBe(401);
    cookieJar.set('booking_session', sign({ host: 'john', email: 'john@example.test', exp: Date.now() + 10000 }));
    const result = await hostGet(); expect(result.status).toBe(200); expect(await result.text()).not.toContain('refresh');
    const saved = await hostPost(request({ action: 'settings', schedule: host.schedule, destinationConnection: connectionId, destinationCalendar: 'one', selections: [{ id: connectionId, calendars: ['one'] }] })); expect(saved.status).toBe(200);
    expect((await hostPost(request({ action: 'invite', from: '2026-10-26', to: '2026-10-27' }))).status).toBe(200);
    expect((await hostPost(request({ action: 'revoke', id }))).status).toBe(200);
    expect((await recoverGet(new Request('https://book.vibrana.ai/api/booking/reconcile', { headers: { authorization: 'Bearer cron' } }))).status).toBe(200);
    expect(fake.find('booking_reservations', 'select').some(q => q.filters.some(([column, op]) => column === 'next_attempt_at' && op === 'lte'))).toBe(true);
    expect((await hostPost(request({ action: 'logout' }))).status).toBe(200);
  });
});
