import 'server-only';
import { BOOKING_ERRORS as E } from '@/src/booking-content';
import type { Booking, Busy, Connection } from './model';
import { BookingError, origin, required, unseal } from './security';

export const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.calendarlist.readonly', 'https://www.googleapis.com/auth/calendar.events.freebusy', 'https://www.googleapis.com/auth/calendar.events'];
export type Calendar = { id: string; summary: string; accessRole: string };
export type GoogleEvent = { id: string; status?: string; hangoutLink?: string; start?: { dateTime?: string }; end?: { dateTime?: string }; conferenceData?: { createRequest?: { requestId?: string; status?: { statusCode?: string } } } };
export class GoogleError extends Error { constructor(public status: number) { super('Calendar request failed'); } }
export async function googleFetch<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new GoogleError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json();
}
export async function refresh(connection: Connection): Promise<string> {
  const data = await googleFetch<{ access_token: string }>('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ client_id: required('BOOKING_GOOGLE_CLIENT_ID'), client_secret: required('BOOKING_GOOGLE_CLIENT_SECRET'), refresh_token: unseal(connection.token), grant_type: 'refresh_token' }),
  });
  if (!data.access_token) throw new BookingError(503, E.calendarReconnect);
  return data.access_token;
}
export async function api<T>(connection: Connection, path: string, method = 'GET', body?: unknown): Promise<T> {
  const access = await refresh(connection);
  return googleFetch<T>(`https://www.googleapis.com/calendar/v3/${path}`, { method, headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
export async function listCalendars(connection: Connection): Promise<Calendar[]> {
  const calendars: Calendar[] = [];
  let pageToken: string | undefined;
  do {
    const result: { items?: Calendar[]; nextPageToken?: string } = await api(connection, `users/me/calendarList?maxResults=250${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
    calendars.push(...result.items ?? []);
    pageToken = result.nextPageToken;
  } while (pageToken);
  return calendars;
}
export async function googleBusy(all: Connection[], start: string, end: string, exclude?: Booking): Promise<Busy[]> {
  if (exclude) {
    const destination = all.find(c => c.id === exclude.connection_id);
    if (!destination) throw new BookingError(503, E.originalCalendarReconnect);
    // FreeBusy merges overlapping events. Never subtract our event from that merged
    // interval: another event might occupy it. List timings on this calendar instead.
    const others = all.map(c => ({ ...c, calendars: c.calendars.filter(id => id !== exclude.calendar_id) }));
    const busy = others.some(c => c.calendars.length) ? await googleBusy(others, start, end) : [];
    let page: string | undefined;
    do {
      const query = new URLSearchParams({ timeMin: start, timeMax: end, singleEvents: 'true', maxResults: '2500', fields: 'nextPageToken,timeZone,items(id,status,transparency,start,end)' });
      if (page) query.set('pageToken', page);
      type Time = { dateTime?: string; date?: string };
      const result: { nextPageToken?: string; timeZone: string; items?: { id: string; status?: string; transparency?: string; start: Time; end: Time }[] } = await api(destination, `${eventPath(exclude)}?${query}`);
      const instant = (time: Time) => {
        if (time.dateTime) return time.dateTime;
        if (!time.date) throw new BookingError(503, E.calendarTiming);
        // All-day events use the calendar timezone, not the visitor timezone.
        const anchor = Date.parse(`${time.date}T00:00:00Z`);
        for (let t = anchor - 14 * 3600_000; t <= anchor + 14 * 3600_000; t += 15 * 60_000) {
          const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: result.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
          const parts = fmt.formatToParts(t);
          const part = (name: string) => parts.find(p => p.type === name)?.value;
          if (`${part('year')}-${part('month')}-${part('day')}` === time.date && part('hour') === '00' && part('minute') === '00') return new Date(t).toISOString();
        }
        throw new BookingError(503, E.calendarTiming);
      };
      for (const event of result.items ?? []) {
        if (event.id !== eventId(exclude) && event.status !== 'cancelled' && event.transparency !== 'transparent') busy.push({ start: instant(event.start), end: instant(event.end) });
      }
      page = result.nextPageToken;
    } while (page);
    return busy;
  }
  const selected = all.filter(c => c.calendars.length);
  if (!selected.length) throw new BookingError(503, E.hostNotConnected);
  const results = await Promise.all(selected.map(async connection => {
    const result = await api<{ calendars?: Record<string, { busy?: Busy[]; errors?: unknown[] }> }>(connection, 'freeBusy', 'POST', { timeMin: start, timeMax: end, items: connection.calendars.map(id => ({ id })) });
    return connection.calendars.flatMap(id => {
      const calendar = result.calendars?.[id];
      if (!calendar || calendar.errors?.length || !Array.isArray(calendar.busy)) throw new BookingError(503, E.calendarUnavailable);
      return calendar.busy;
    });
  }));
  return results.flat();
}
export function eventId(booking: Booking): string { return booking.id.replaceAll('-', ''); }
export function eventPath(booking: Booking): string { return `calendars/${encodeURIComponent(booking.calendar_id)}/events`; }
export function eventBody(booking: Booking) {
  const management = `${origin()}/book/manage#id=${booking.id}&token=${encodeURIComponent(unseal(booking.management_secret))}`;
  return {
    summary: `Vibrana: ${booking.name}`,
    description: `${booking.context}\n\nManage this meeting: ${management}`,
    start: { dateTime: booking.next_start ?? booking.start_at }, end: { dateTime: booking.next_end ?? booking.end_at },
    attendees: [{ email: booking.email }], guestsCanModify: false, guestsCanInviteOthers: false, visibility: 'private',
  };
}
