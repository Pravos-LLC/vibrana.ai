import { z } from 'zod';

export const hostId = z.enum(['john', 'abe']);
export type HostId = z.infer<typeof hostId>;
export const day = z.iso.date();
const hour = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const windowSchema = z.object({ start: hour, end: hour }).refine(v => v.end > v.start, 'End must follow start');
export const scheduleSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string().max(80).refine(v => { try { if (v !== 'UTC' && !v.includes('/')) return false; new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  public: windowSchema,
  morning: windowSchema,
  exceptions: z.record(day, windowSchema.nullable()).refine(v => Object.keys(v).length <= 90),
});
export type Schedule = z.infer<typeof scheduleSchema>;
export const defaultSchedule = (host: HostId): Schedule => ({ enabled: host === 'john', timezone: 'Asia/Makassar', weekdays: [1, 2, 3, 4, 5], public: { start: '14:00', end: '19:00' }, morning: { start: '08:00', end: '11:00' }, exceptions: {} });
export const DURATION = 30;
export const BUFFER = 15;
export const NOTICE = 12 * 60 * 60 * 1000;
export const HORIZON = 30 * 86400_000;
export type Busy = { start: string; end: string };
export type Connection = { id: string; host_id: HostId; account: string; token: string; calendars: string[] };
export type Host = { id: HostId; revision: string; schedule: Schedule; destination_connection: string | null; destination_calendar: string | null };
export type Invite = { id: string; host_id: HostId; token_hash: string; from_date: string; to_date: string; expires_at: string; revoked: boolean; recipient: string | null };
export type Booking = {
  id: string; host_id: HostId; token_hash: string; name: string; email: string; context: string;
  start_at: string; end_at: string; next_start: string | null; next_end: string | null;
  status: 'pending' | 'confirmed' | 'moving' | 'cancelling' | 'cancelled';
  connection_id: string; calendar_id: string; invite_id: string | null; meet_url: string | null;
  conference_request_id: string;
  ai_consent: boolean;
  // Encrypted so a recovering calendar worker can rebuild the private management link.
  management_secret: string; created_at: string; worker_until: string | null; worker_id: string | null;
};

export function localDate(instant: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-');
}

/** Enumerate UTC instants, then match local wall time. Handles DST gaps and folds without guessing offsets. */
export function candidates(date: string, schedule: Schedule, privateHours: boolean, now = Date.now()): Busy[] {
  if (!schedule.enabled || !day.safeParse(date).success) return [];
  const override = schedule.exceptions[date];
  if (override === null) return [];
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (override === undefined && !schedule.weekdays.includes(weekday)) return [];
  const hours = override ?? (privateHours ? schedule.morning : schedule.public);
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: schedule.timezone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' });
  const anchor = Date.parse(`${date}T00:00:00Z`);
  const slots: Busy[] = [];
  for (let t = anchor - 14 * 3600_000; t < anchor + 38 * 3600_000; t += 15 * 60_000) {
    if (t < now + NOTICE || t > now + HORIZON || localDate(new Date(t), schedule.timezone) !== date) continue;
    const end = t + DURATION * 60_000;
    const startClock = fmt.format(t), endClock = fmt.format(end);
    if (startClock >= hours.start && endClock <= hours.end && endClock > startClock && localDate(new Date(end), schedule.timezone) === date) {
      slots.push({ start: new Date(t).toISOString(), end: new Date(end).toISOString() });
    }
  }
  return slots;
}

export function overlaps(slot: Busy, busy: Busy): boolean {
  return Date.parse(slot.start) < Date.parse(busy.end) + BUFFER * 60_000 && Date.parse(slot.end) + BUFFER * 60_000 > Date.parse(busy.start);
}
