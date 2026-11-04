import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { checked, connections, db, getHost, rateLimit } from '@/lib/booking/db';
import { listCalendars } from '@/lib/booking/google';
import { day, scheduleSchema } from '@/lib/booking/model';
import { createInvite, reconcile, view } from '@/lib/booking/service';
import { integrationConfiguration } from '@/lib/booking/integrations';
import { BookingError, configurationComplete, origin, publicError, requireHost, sameOrigin, session } from '@/lib/booking/security';

export const maxDuration = 120;
export async function GET() {
  try {
    const id = await session();
    if (!id) return Response.json({ authenticated: false, configured: configurationComplete() }, { headers: { 'Cache-Control': 'no-store' } });
    const [host, all, invites, bookings, jobs] = await Promise.all([
      getHost(id), connections(id), db().from('booking_invites').select('id,from_date,to_date,expires_at,revoked').eq('host_id', id).order('created_at', { ascending: false }).limit(30),
      db().from('booking_reservations').select('*').eq('host_id', id).neq('status', 'cancelled').order('start_at', { ascending: false }).limit(60),
      db().from('booking_jobs').select('id,kind,state,error_code,result,payload,created_at').eq('host_id', id).order('created_at', { ascending: false }).limit(60),
    ]);
    const accounts = await Promise.all(all.map(async c => {
      try { return { id: c.id, account: c.account, selected: c.calendars, available: await listCalendars(c), connected: true }; }
      catch { return { id: c.id, account: c.account, selected: c.calendars, available: [], connected: false }; }
    }));
    return Response.json({ authenticated: true, host, accounts, invites: checked(invites), bookings: checked(bookings).map(b => ({ ...view(b), name: b.name })), integrations: integrationConfiguration(), jobs: checked(jobs) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return publicError(error); }
}
const settingsSchema = z.object({ action: z.literal('settings'), schedule: scheduleSchema, destinationConnection: z.uuid(), destinationCalendar: z.string().min(1).max(1024), selections: z.array(z.object({ id: z.uuid(), calendars: z.array(z.string().min(1).max(1024)).max(50) })).max(10) });
const inviteSchema = z.object({ action: z.literal('invite'), from: day, to: day, recipient: z.union([z.email().max(254), z.literal('')]).optional() });
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const id = await requireHost();
    await rateLimit(request, 'host', 120);
    const text = await request.text();
    if (text.length > 30_000) throw new BookingError(413, E.requestTooLarge);
    const raw = z.object({ action: z.string() }).passthrough().parse(JSON.parse(text));
    if (raw.action === 'logout') {
      (await cookies()).delete({ name: 'booking_session', path: '/api/booking' });
      return Response.json({ ok: true });
    }
    if (raw.action === 'invite') {
      const input = inviteSchema.parse(raw), result = await createInvite(id, input.from, input.to, input.recipient?.toLowerCase());
      return Response.json({ ...result, url: `${origin()}/book/${id}#invite=${result.token}` }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (raw.action === 'revoke') {
      const input = z.object({ id: z.uuid() }).parse(raw);
      checked(await db().from('booking_invites').update({ revoked: true }).eq('id', input.id).eq('host_id', id).select('id'));
      return Response.json({ ok: true });
    }
    if (raw.action === 'recover') {
      const input = z.object({ id: z.uuid() }).parse(raw);
      const found = checked(await db().from('booking_reservations').select('id').eq('id', input.id).eq('host_id', id));
      if (!found.length) throw new BookingError(404, E.notFound);
      return Response.json(view(await reconcile(input.id)));
    }
    if (raw.action === 'retryJob') {
      const input = z.object({ id: z.uuid() }).parse(raw);
      const result = checked(await db().from('booking_jobs').update({ state: 'pending', attempts: 0, next_attempt_at: new Date().toISOString(), error_code: null }).eq('id', input.id).eq('host_id', id).eq('kind', 'crm').is('worker_id', null).select('id'));
      if (!result.length) throw new BookingError(409, E.updateInProgress);
      return Response.json({ ok: true });
    }
    const input = settingsSchema.parse(raw), all = await connections(id);
    if (input.selections.length !== all.length || new Set(input.selections.map(c => c.id)).size !== all.length) throw new BookingError(400, E.refreshConnections);
    for (const selected of input.selections) {
      const c = all.find(c => c.id === selected.id);
      if (!c) throw new BookingError(403, E.connectionUnavailable);
      if (!selected.calendars.length && c.id !== input.destinationConnection) continue;
      const available = await listCalendars(c);
      if (selected.calendars.some(calendar => !available.some(a => a.id === calendar))) throw new BookingError(400, E.invalidSelection);
      if (c.id === input.destinationConnection) {
        const dest = available.find(a => a.id === input.destinationCalendar);
        if (!dest || !['owner', 'writer'].includes(dest.accessRole) || !selected.calendars.includes(dest.id)) throw new BookingError(400, E.invalidDestination);
      }
    }
    if (!all.some(c => c.id === input.destinationConnection)) throw new BookingError(400, E.chooseDestination);
    const result = await db().rpc('booking_config', { p_host: id, p_schedule: input.schedule, p_destination: input.destinationConnection, p_calendar: input.destinationCalendar, p_connections: input.selections });
    if (result.error) throw new BookingError(503, E.saveFailed);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return publicError(new BookingError(400, E.invalidSettings));
    return publicError(error);
  }
}
