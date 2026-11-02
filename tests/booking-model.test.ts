import { describe, expect, it } from 'vitest';
import { candidates, defaultSchedule, localDate, overlaps, scheduleSchema } from '@/lib/booking/model';

describe('booking availability', () => {
  const now = Date.parse('2026-10-25T00:00:00Z');
  it('offers public afternoons and private mornings as distinct Bali schedules', () => {
    const publicSlots = candidates('2026-10-26', defaultSchedule('john'), false, now);
    expect(publicSlots[0].start).toBe('2026-10-26T06:00:00.000Z');
    expect(publicSlots.at(-1)?.end).toBe('2026-10-26T11:00:00.000Z');
    const privateSlots = candidates('2026-10-26', defaultSchedule('john'), true, now);
    expect(privateSlots[0].start).toBe('2026-10-26T00:00:00.000Z');
    expect(privateSlots.at(-1)?.end).toBe('2026-10-26T03:00:00.000Z');
    expect(publicSlots.some(s => privateSlots.some(p => p.start === s.start))).toBe(false);
  });
  it('pauses Abe, respects weekends, notice and date exceptions', () => {
    expect(candidates('2026-10-26', defaultSchedule('abe'), false, now)).toEqual([]);
    expect(candidates('2026-10-31', defaultSchedule('john'), false, now)).toEqual([]);
    const schedule = defaultSchedule('john');
    schedule.exceptions['2026-10-26'] = null;
    expect(candidates('2026-10-26', schedule, true, now)).toEqual([]);
    schedule.exceptions['2026-10-31'] = { start: '09:00', end: '10:00' };
    expect(candidates('2026-10-31', schedule, false, now)).toHaveLength(3);
    expect(candidates('2026-10-26', defaultSchedule('john'), false, Date.parse('2026-10-26T00:00Z'))).toEqual([]);
  });
  it('handles US daylight saving gaps and repeated hours as actual instants', () => {
    const schedule = { ...defaultSchedule('john'), timezone: 'America/New_York', weekdays: [0], public: { start: '01:00', end: '04:00' } };
    const spring = candidates('2026-03-08', schedule, false, Date.parse('2026-03-06T00:00Z'));
    const fmt = new Intl.DateTimeFormat('en', { timeZone: schedule.timezone, hour: 'numeric', hourCycle: 'h23' });
    expect(spring.every(s => fmt.format(new Date(s.start)) !== '02')).toBe(true);
    const fall = candidates('2026-11-01', schedule, false, Date.parse('2026-10-30T00:00Z'));
    expect(fall.some(s => s.start === '2026-11-01T05:00:00.000Z')).toBe(true);
    expect(fall.some(s => s.start === '2026-11-01T06:00:00.000Z')).toBe(true);
    expect(new Set(fall.map(s => s.start)).size).toBe(fall.length);
  });
  it('validates dates, timezones, windows and exact buffer boundaries', () => {
    expect(candidates('bad', defaultSchedule('john'), false, now)).toEqual([]);
    expect(scheduleSchema.safeParse({ ...defaultSchedule('john'), timezone: 'bad' }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...defaultSchedule('john'), timezone: '-05:00' }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...defaultSchedule('john'), public: { start: '19:00', end: '14:00' } }).success).toBe(false);
    const busy = { start: '2026-10-26T06:00:00Z', end: '2026-10-26T06:30:00Z' };
    expect(overlaps({ start: '2026-10-26T06:30:00Z', end: '2026-10-26T07:00:00Z' }, busy)).toBe(true);
    expect(overlaps({ start: '2026-10-26T06:45:00Z', end: '2026-10-26T07:15:00Z' }, busy)).toBe(false);
    expect(localDate(new Date('2026-10-26T23:00Z'), 'Asia/Makassar')).toBe('2026-10-27');
  });
});
