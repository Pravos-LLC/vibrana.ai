import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db as fake, ok } from './helpers/fake-supabase';
const state = vi.hoisted(() => ({ jar: new Map<string, string>(), fetch: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => ({ value: state.jar.get(name) }), set: (name: string, value: string) => state.jar.set(name, value), delete: ({ name }: { name: string }) => state.jar.delete(name) }) }));
vi.mock('@supabase/supabase-js', async () => { const { db } = await import('./helpers/fake-supabase'); return { createClient: () => db.client }; });
vi.mock('@/lib/booking/google', async original => ({ ...await original<object>(), googleFetch: state.fetch }));
import { GET as connect } from '@/app/api/booking/connect/route';
import { GET as callback } from '@/app/api/booking/callback/route';
import { SCOPES } from '@/lib/booking/google';
import { session, sign, unseal, verify } from '@/lib/booking/security';

describe('host Google OAuth boundaries', () => {
  const request = (token = 'state') => new Request(`https://book.vibrana.ai/api/booking/callback?code=code&state=${token}`);
  const setupState = (host: string | null = null) => state.jar.set('booking_oauth', sign({ state: 'state', verifier: 'verifier', host, exp: Date.now() + 60000 }));
  beforeEach(() => {
    vi.stubEnv('BOOKING_ENCRYPTION_KEY', Buffer.alloc(32, 4).toString('base64')); vi.stubEnv('BOOKING_ORIGIN', 'https://book.vibrana.ai'); vi.stubEnv('BOOKING_GOOGLE_CLIENT_ID', 'client'); vi.stubEnv('BOOKING_GOOGLE_CLIENT_SECRET', 'secret'); vi.stubEnv('BOOKING_JOHN_EMAIL', 'john@example.test'); vi.stubEnv('SUPABASE_URL', 'http://localhost:54321'); vi.stubEnv('SUPABASE_SERVICE_KEY', 'test');
    state.jar.clear(); state.fetch.mockReset(); fake.reset(); fake.respond = q => q.op === 'upsert' ? ok({ id: 'connection' }) : ok(null);
    state.fetch.mockResolvedValueOnce({ access_token: 'access', refresh_token: 'refresh', scope: SCOPES.join(' ') }).mockResolvedValueOnce({ email: 'john@example.test', email_verified: true });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('issues state and PKCE for the exact registered callback', async () => {
    const response = await connect(new Request('https://book.vibrana.ai/api/booking/connect')), url = new URL(response.headers.get('location')!);
    expect(url.hostname).toBe('accounts.google.com'); expect(url.searchParams.get('redirect_uri')).toBe('https://book.vibrana.ai/api/booking/callback');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256'); expect(url.searchParams.get('access_type')).toBe('offline');
    expect(verify(state.jar.get('booking_oauth'))).toMatchObject({ state: url.searchParams.get('state'), host: null });
  });
  it('starts OAuth on its registered host before setting a state cookie', async () => {
    const response = await connect(new Request('https://www.vibrana.ai/api/booking/connect'));
    expect(response.headers.get('location')).toBe('https://book.vibrana.ai/api/booking/connect');
    expect(state.jar.has('booking_oauth')).toBe(false);
  });
  it('refuses invalid state and an additional-account flow without the original host session', async () => {
    expect((await callback(request())).status).toBe(400); expect(state.fetch).not.toHaveBeenCalled();
    setupState(); expect((await callback(request('tampered'))).status).toBe(400);
    setupState('john'); expect((await callback(request())).status).toBe(401); expect(fake.calls).toHaveLength(0);
  });
  it('accepts only verified allowlisted primary identities and encrypts offline tokens', async () => {
    setupState(); const response = await callback(request());
    expect(response.status).toBe(302); expect(response.headers.get('location')).toBe('https://book.vibrana.ai/book/settings'); expect(await session()).toBe('john');
    const record = fake.find('booking_connections', 'upsert')[0].payload as { token: string };
    expect(record.token).not.toContain('refresh'); expect(unseal(record.token)).toBe('refresh');
  });
  it('rejects unknown hosts, unverified email and missing calendar grants', async () => {
    for (const identity of [{ email: 'stranger@example.test', email_verified: true }, { email: 'john@example.test', email_verified: false }]) {
      setupState(); state.fetch.mockReset().mockResolvedValueOnce({ access_token: 'access', scope: SCOPES.join(' ') }).mockResolvedValueOnce(identity);
      expect((await callback(request())).status).toBe(403);
    }
    setupState(); state.fetch.mockReset().mockResolvedValueOnce({ access_token: 'access', scope: 'openid email' });
    expect((await callback(request())).status).toBe(400); expect(fake.find('booking_connections', 'upsert')).toHaveLength(0);
  });
  it('links an additional account only into the signed-in host, preserving the primary session', async () => {
    const login = sign({ host: 'john', email: 'john@example.test', exp: Date.now() + 60000 }); state.jar.set('booking_session', login); setupState('john');
    state.fetch.mockReset().mockResolvedValueOnce({ access_token: 'access', refresh_token: 'other-refresh', scope: SCOPES.join(' ') }).mockResolvedValueOnce({ email: 'personal@example.test', email_verified: true });
    expect((await callback(request())).status).toBe(302);
    expect(fake.find('booking_connections', 'upsert')[0].payload).toMatchObject({ host_id: 'john', account: 'personal@example.test' });
    expect(state.jar.get('booking_session')).toBe(login);
  });
});
