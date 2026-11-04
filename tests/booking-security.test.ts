import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name) } : undefined }) }));
import { BookingError, configurationComplete, configuredHost, cookieOptions, hash, origin, publicError, required, requireHost, sameOrigin, seal, secret, session, sign, unseal, verify } from '@/lib/booking/security';

describe('booking credentials and host authorization', () => {
  beforeEach(() => {
    vi.stubEnv('BOOKING_ENCRYPTION_KEY', Buffer.alloc(32, 7).toString('base64'));
    vi.stubEnv('BOOKING_ORIGIN', 'https://book.vibrana.ai');
    vi.stubEnv('BOOKING_JOHN_EMAIL', 'john@example.test');
    jar.clear();
  });
  afterEach(() => vi.unstubAllEnvs());
  it('encrypts credentials with randomized authenticated encryption', () => {
    const a = seal('sensitive'), b = seal('sensitive');
    expect(a).not.toBe(b); expect(a).not.toContain('sensitive'); expect(unseal(a)).toBe('sensitive');
    const raw = Buffer.from(a, 'base64url'); raw[30] ^= 1;
    expect(() => unseal(raw.toString('base64url'))).toThrow();
    expect(secret()).toMatch(/^[\w-]{43}$/); expect(hash('a')).not.toBe(hash('b'));
  });
  it('rejects tampered, expired, and incomplete signatures', () => {
    const value = sign({ host: 'john', exp: Date.now() + 1000 });
    expect(verify(value)).toMatchObject({ host: 'john' });
    expect(verify(`${value}x`)).toBeNull(); expect(verify(`${value}.extra`)).toBeNull();
    expect(verify(sign({ exp: 1 }))).toBeNull(); expect(verify(undefined)).toBeNull();
  });
  it('requires an active allowlisted host identity, even for a signed cookie', async () => {
    expect(await session()).toBeNull(); await expect(requireHost()).rejects.toMatchObject({ status: 401 });
    jar.set('booking_session', sign({ host: 'john', email: 'other@example.test', exp: Date.now() + 1000 }));
    expect(await session()).toBeNull();
    jar.set('booking_session', sign({ host: 'john', email: 'JOHN@example.test', exp: Date.now() + 1000 }));
    expect(await requireHost()).toBe('john'); expect(configuredHost('nobody@example.test')).toBeNull();
  });
  it('fails closed on missing configuration and cross-origin writes', () => {
    expect(origin()).toBe('https://book.vibrana.ai');
    expect(() => sameOrigin(new Request(origin(), { headers: { origin: 'https://attacker.test' } }))).toThrow();
    sameOrigin(new Request(origin(), { headers: { origin: origin() } }));
    vi.stubEnv('BOOKING_ORIGIN', 'https://book.vibrana.ai/wrong'); expect(() => origin()).toThrow();
    vi.stubEnv('BOOKING_ENCRYPTION_KEY', 'bad'); expect(() => seal('a')).toThrow();
    vi.stubEnv('TEST_MISSING', 'encrypted:ciphertext'); expect(() => required('TEST_MISSING')).toThrow();
    expect(cookieOptions()).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/api/booking' });
  });
  it('returns safe errors without provider messages or credentials', async () => {
    expect(await publicError(new Error('provider-secret')).text()).not.toContain('provider-secret');
    expect(publicError(new BookingError(409, 'Taken')).status).toBe(409);
  });
  it('reports setup readiness without exposing configuration values', async () => {
    vi.stubEnv('BOOKING_GOOGLE_CLIENT_ID', ''); expect(configurationComplete()).toBe(false);
    vi.stubEnv('BOOKING_GOOGLE_CLIENT_ID', 'client'); vi.stubEnv('BOOKING_GOOGLE_CLIENT_SECRET', 'secret'); vi.stubEnv('SUPABASE_URL', 'http://localhost:56521'); vi.stubEnv('SUPABASE_SERVICE_KEY', 'key');
    expect(configurationComplete()).toBe(true);
    const { GET } = await import('@/app/api/booking/configuration/route');
    expect(await GET().json()).toEqual({ configured: true, origin: 'https://book.vibrana.ai' });
  });
});
