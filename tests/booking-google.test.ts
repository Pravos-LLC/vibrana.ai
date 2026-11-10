import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, eventBody, eventId, googleBusy, GoogleError, listCalendars, refresh } from '@/lib/booking/google';
import { seal } from '@/lib/booking/security';
import type { Booking, Connection } from '@/lib/booking/model';

const connection = (): Connection => ({ id: 'c', host_id: 'john', account: 'host@example.test', token: seal('refresh-secret'), calendars: ['one', 'two'] });
describe('Google booking adapter', () => {
  beforeEach(() => { vi.stubEnv('BOOKING_ENCRYPTION_KEY', Buffer.alloc(32, 2).toString('base64')); vi.stubEnv('BOOKING_GOOGLE_CLIENT_ID', 'client'); vi.stubEnv('BOOKING_GOOGLE_CLIENT_SECRET', 'secret'); vi.stubEnv('BOOKING_ORIGIN', 'https://book.vibrana.ai'); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  function mock(handler: (url: string, init: RequestInit) => Response) {
    return vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => url.includes('oauth2.googleapis.com') ? Response.json({ access_token: 'access' }) : handler(url, init)));
  }
  it('checks all selected calendars, retaining overlapping busy intervals', async () => {
    mock((url, init) => { expect(url).toContain('freeBusy'); expect(init.headers).toMatchObject({ Authorization: 'Bearer access' }); expect(JSON.parse(init.body as string).items).toEqual([{ id: 'one' }, { id: 'two' }]); return Response.json({ calendars: { one: { busy: [{ start: 'a', end: 'b' }] }, two: { busy: [] } } }); });
    expect(await googleBusy([connection()], 'start', 'end')).toEqual([{ start: 'a', end: 'b' }]);
  });
  it('fails closed for missing calendars and per-calendar errors', async () => {
    await expect(googleBusy([], 'a', 'b')).rejects.toThrow();
    mock(() => Response.json({ calendars: { one: { busy: [] }, two: { errors: [{ reason: 'notFound' }] } } }));
    await expect(googleBusy([connection()], 'a', 'b')).rejects.toThrow();
    mock(() => Response.json({ calendars: {} }));
    await expect(googleBusy([connection()], 'a', 'b')).rejects.toThrow();
  });
  it('paginates the calendar picker and returns provider failures without their payload', async () => {
    mock(url => url.includes('pageToken=next') ? Response.json({ items: [{ id: 'b' }] }) : Response.json({ items: [{ id: 'a' }], nextPageToken: 'next' }));
    expect((await listCalendars(connection())).map(c => c.id)).toEqual(['a', 'b']);
    mock(() => new Response('sensitive provider message', { status: 403 }));
    await expect(api(connection(), 'any')).rejects.toEqual(new GoogleError(403));
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));
    await expect(refresh(connection())).rejects.toThrow('reconnected');
  });
  it('reschedules by excluding only our event, preserving another overlapping event and all-day busy periods', async () => {
    const booking = { id: '12345678-1234-4234-8234-123456789012', connection_id: 'c', calendar_id: 'one' } as Booking;
    mock(url => {
      if (url.includes('freeBusy')) return Response.json({ calendars: { two: { busy: [] } } });
      return Response.json({ timeZone: 'America/New_York', items: [
        { id: eventId(booking), start: { dateTime: '2026-10-26T14:00:00Z' }, end: { dateTime: '2026-10-26T14:30:00Z' } },
        { id: 'other', start: { dateTime: '2026-10-26T14:00:00Z' }, end: { dateTime: '2026-10-26T14:30:00Z' } },
        { id: 'day', start: { date: '2026-10-27' }, end: { date: '2026-10-28' } },
        { id: 'transparent', transparency: 'transparent' },
      ] });
    });
    const result = await googleBusy([connection()], '2026-10-26T00:00:00Z', '2026-10-29T00:00:00Z', booking);
    expect(result).toEqual([{ start: '2026-10-26T14:00:00Z', end: '2026-10-26T14:30:00Z' }, { start: '2026-10-27T04:00:00.000Z', end: '2026-10-28T04:00:00.000Z' }]);
    await expect(googleBusy([], 'a', 'b', booking)).rejects.toThrow();
  });
  it('uses deterministic event IDs and a fragment management credential', () => {
    const body = eventBody({ id: '12345678-1234-4234-8234-123456789012', name: 'Visitor', email: 'visitor@example.test', context: 'Context', management_secret: seal('manage'), start_at: 'old', end_at: 'old-end', next_start: 'new', next_end: 'new-end' } as Booking);
    expect(body.start.dateTime).toBe('new'); expect(body.description).toContain('/book/manage#id='); expect(body.description).toContain('&token=manage'); expect(body.guestsCanModify).toBe(false);
  });
});
