import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { db, ok, type Query } from '../helpers/fake-supabase';
import {
  __setSimulatorDbClient,
  budgetHit,
  createRun,
  deleteRun,
  getCachedProfile,
  getRunBySlug,
  ipHash,
  isSlug,
  newSlug,
  recordShare,
  recordView,
  sha256Hex,
} from '@/src/lib/simulator/server/db';
import { simulate } from '@/src/lib/simulator/engine';

const rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
let rpcResult: { data: unknown; error: { message: string } | null } = { data: true, error: null };
const fake = {
  ...db.client,
  rpc: async (name: string, args: Record<string, unknown>) => {
    rpcCalls.push({ name, args });
    return rpcResult;
  },
} as unknown as SupabaseClient;

const headers = (ip: string) => new Headers({ 'x-forwarded-for': ip });

beforeEach(() => {
  db.reset();
  rpcCalls.length = 0;
  rpcResult = { data: true, error: null };
  __setSimulatorDbClient(fake);
});
afterAll(() => __setSimulatorDbClient(null));

describe('slugs and hashes', () => {
  it('makes 10-character URL-safe slugs', () => {
    const slugs = new Set(Array.from({ length: 200 }, newSlug));
    expect(slugs.size).toBe(200);
    for (const s of slugs) expect(isSlug(s)).toBe(true);
    expect(isSlug('../etc/pas')).toBe(false);
  });

  it('hashes IPs with a salt that rotates daily, never storing the IP', () => {
    const day1 = new Date('2026-10-13T10:00:00Z');
    const a = ipHash(headers('203.0.113.9'), day1);
    expect(a).not.toContain('203.0.113.9');
    expect(ipHash(headers('203.0.113.9'), new Date('2026-10-13T23:00:00Z'))).toBe(a);
    expect(ipHash(headers('203.0.113.9'), new Date('2026-10-14T01:00:00Z'))).not.toBe(a);
    expect(ipHash(headers('203.0.113.10'), day1)).not.toBe(a);
  });
});

describe('runs', () => {
  const result = simulate({ domain: null, headcount: 50, sector: 'other', providers: ['openai'], cap: 50, dataRule: 'public', pace: 'steady' });

  it('stores only the owner token hash and drops an unknown domain', async () => {
    db.respond = (q: Query) => (q.table === 'simulator_company_profiles' ? ok(null) : ok());
    const { slug, ownerToken } = await createRun({
      inputs: { ...result.inputs, domain: 'unknown.com' },
      result,
      showCompanyName: false,
      companyName: 'Acme',
      ipHash: 'h',
    });
    const insert = db.find('simulator_runs', 'insert')[0].payload as Record<string, unknown>;
    expect(insert.slug).toBe(slug);
    expect(insert.owner_token_hash).toBe(sha256Hex(ownerToken));
    expect(JSON.stringify(insert)).not.toContain(ownerToken);
    expect(insert.domain).toBeNull();
    expect(insert.company_name).toBeNull();
  });

  it('returns deleted for a soft-deleted run and hides the name unless opted in', async () => {
    db.respond = () => ok({ slug: 'abcdefghij', created_at: 'x', domain: null, show_company_name: false, company_name: 'Acme', result, deleted_at: null });
    expect(await getRunBySlug('abcdefghij')).toMatchObject({ slug: 'abcdefghij', companyName: null });
    db.respond = () => ok({ slug: 'abcdefghij', deleted_at: '2026-10-13' });
    expect(await getRunBySlug('abcdefghij')).toBe('deleted');
    expect(await getRunBySlug('bad')).toBeNull();
  });

  it('deletes only with the right owner token', async () => {
    db.respond = (q: Query) => (q.op === 'select' ? ok({ id: 'r1', owner_token_hash: sha256Hex('right'), deleted_at: null }) : ok());
    expect(await deleteRun('abcdefghij', 'wrong')).toBe('forbidden');
    expect(await deleteRun('abcdefghij', undefined)).toBe('forbidden');
    expect(await deleteRun('abcdefghij', 'right')).toBe('deleted');
    expect(db.find('simulator_runs', 'update')).toHaveLength(1);
    db.respond = () => ok(null);
    expect(await deleteRun('abcdefghij', 'right')).toBe('not-found');
  });

  it('records views and shares through the counter RPCs', async () => {
    await recordView('abcdefghij', headers('198.51.100.1'));
    expect(await recordShare('abcdefghij')).toBe(true);
    expect(rpcCalls.map((c) => c.name)).toEqual(['simulator_run_view', 'simulator_run_share']);
    expect(String(rpcCalls[0].args.p_ip_hash)).not.toContain('198.51');
  });
});

describe('profile cache and budget', () => {
  it('reads an unexpired profile', async () => {
    db.respond = () =>
      ok({ domain: 'acme.com', sector: 'software', sector_confidence: 0.7, alternatives: null, function_mix: {}, signals: { b2b: true }, source: 'firecrawl' });
    expect(await getCachedProfile('acme.com')).toMatchObject({ sector: 'software', alternatives: [], signals: { mentionsAi: false, b2b: true } });
    expect(db.calls[0].filters.some(([col, op]) => col === 'expires_at' && op === 'gt')).toBe(true);
    // v1 rows (no summary, logo or screenshot) are stale; a row with only a logo is still good.
    expect(db.calls[0].filters).toContainEqual(['or', 'or', 'summary.not.is.null,logo_path.not.is.null,screenshot_path.not.is.null']);
  });

  it('fails closed when the budget counter is unavailable', async () => {
    expect(await budgetHit('scrapes', 300)).toBe(true);
    rpcResult = { data: null, error: { message: 'missing' } };
    expect(await budgetHit('scrapes', 300)).toBe(false);
  });
});
