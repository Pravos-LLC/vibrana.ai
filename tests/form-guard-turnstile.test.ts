import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORM_GUARDS, guardSubmission } from '@/lib/form-guard/server';

const headers = { get: () => null };
const base = { headers, honeypot: '', token: '' };

describe('Turnstile layer', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SERVICE_KEY', '');
    vi.stubEnv('FORM_GUARD_SECRET', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is skipped when no secret is configured', async () => {
    const r = await guardSubmission({ ...base, config: FORM_GUARDS.simulatorProfile });
    expect(r.action).toBe('allow');
  });

  it('drops a request with no token once a secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const r = await guardSubmission({ ...base, config: FORM_GUARDS.simulatorProfile });
    expect(r).toEqual({ action: 'drop', reason: 'turnstile' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops when Cloudflare says no, allows when it says yes', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ success: false }))).mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal('fetch', fetchMock);
    const input = { ...base, config: FORM_GUARDS.simulatorProfile, turnstile: 'token-token-token' };
    expect((await guardSubmission(input)).action).toBe('drop');
    expect((await guardSubmission(input)).action).toBe('allow');
    expect(String(fetchMock.mock.calls[0][0])).toContain('challenges.cloudflare.com/turnstile/v0/siteverify');
  });

  it('fails open when Cloudflare is unreachable', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const r = await guardSubmission({ ...base, config: FORM_GUARDS.simulatorProfile, turnstile: 'token-token-token' });
    expect(r.action).toBe('allow');
  });

  it('is not required on endpoints that do not opt in', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const r = await guardSubmission({ ...base, config: FORM_GUARDS.simulatorRuns });
    expect(r.action).toBe('allow');
  });
});
