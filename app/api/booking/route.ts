import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { z } from 'zod';
import { hostId, day } from '@/lib/booking/model';
import { rateLimit } from '@/lib/booking/db';
import { availability, bookingSchema, cancel, credentialSchema, invitation, owned, reconcile, reserve, view } from '@/lib/booking/service';
import { BookingError, publicError, sameOrigin } from '@/lib/booking/security';

export const runtime = 'nodejs';
export const maxDuration = 120;
const availabilitySchema = z.object({ action: z.literal('availability'), host: hostId, date: day, invite: z.string().max(100).optional(), booking: credentialSchema.optional() });
const actionSchema = credentialSchema.extend({ action: z.enum(['status', 'cancel', 'reschedule']), start: z.iso.datetime().optional() });

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (Number(request.headers.get('content-length') ?? 0) > 12_000) throw new BookingError(413, E.requestTooLarge);
    const text = await request.text();
    if (text.length > 12_000) throw new BookingError(413, E.requestTooLarge);
    const raw = z.object({ action: z.string() }).passthrough().parse(JSON.parse(text));
    if (raw.action === 'invitation') {
      const input = z.object({ host: hostId, invite: z.string().min(1).max(100) }).parse(raw);
      await rateLimit(request, 'availability', 240);
      const invite = await invitation(input.invite, input.host);
      return Response.json({ from: invite!.from_date, to: invite!.to_date }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (raw.action === 'availability') {
      const input = availabilitySchema.parse(raw);
      await rateLimit(request, 'availability', 240);
      const booking = input.booking ? await owned(input.booking.id, input.booking.token) : undefined;
      if (booking && (booking.host_id !== input.host || booking.status !== 'confirmed')) throw new BookingError(409, E.cannotChange);
      const result = await availability(input.host, input.date, input.invite, booking);
      return Response.json({ slots: result.slots, timezone: result.host.schedule.timezone }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (raw.action === 'book') {
      const input = bookingSchema.parse(raw);
      await rateLimit(request, 'book', 12);
      await rateLimit(request, 'recipient', 4, input.email);
      const booking = await reserve(input);
      return Response.json(view(await reconcile(booking.id)), { headers: { 'Cache-Control': 'no-store' } });
    }
    const input = actionSchema.parse(raw);
    await rateLimit(request, 'manage', 240);
    const booking = await owned(input.id, input.token);
    let result = booking;
    if (input.action === 'cancel') result = await cancel(booking);
    if (input.action === 'status' && ['pending', 'moving', 'cancelling'].includes(booking.status)) result = await reconcile(booking.id);
    if (input.action === 'reschedule') {
      if (!input.start || booking.status !== 'confirmed') throw new BookingError(409, E.cannotChange);
      await reserve({ id: booking.id, token: input.token, host: booking.host_id, start: input.start, name: booking.name, email: booking.email, context: booking.context, aiConsent: booking.ai_consent }, booking);
      result = await reconcile(booking.id);
    }
    return Response.json(view(result), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return publicError(new BookingError(400, E.invalidDetails));
    return publicError(error);
  }
}
