import { BOOKING_ERRORS as E } from '@/src/booking-content';
import { timingSafeEqual } from 'node:crypto';
import { checked, db } from '@/lib/booking/db';
import { reconcile } from '@/lib/booking/service';
import { processOneJob } from '@/lib/booking/integrations';
import { BookingError, publicError, required } from '@/lib/booking/security';

export const maxDuration = 120;
export async function GET(request: Request) {
  try {
    const supplied = Buffer.from(request.headers.get('authorization') ?? '');
    const expected = Buffer.from(`Bearer ${required('CRON_SECRET')}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new BookingError(401, E.unauthorized);
    const rows = checked(await db().from('booking_reservations').select('id').in('status', ['pending', 'moving', 'cancelling']).lte('next_attempt_at', new Date().toISOString()).order('next_attempt_at').limit(1));
    const [, jobs] = await Promise.all([Promise.all(rows.map(row => reconcile(row.id))), processOneJob()]);
    return Response.json({ processed: rows.length, integrations: jobs }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return publicError(error); }
}
