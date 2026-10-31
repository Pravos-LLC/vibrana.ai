/**
 * Server-only data access for the simulator (spec 6). Service role; the tables
 * have RLS on with no policies, so nothing reaches them through the Data API.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getClientIp } from '@/lib/form-guard/server';
import type { CompanyProfile, StoredRun } from '../api';
import type { SimulatorInputs, SimulatorResult } from '../types';

type HeaderReader = { get(name: string): string | null };

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Simulator storage is not configured');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/** For tests. */
export function __setSimulatorDbClient(next: SupabaseClient | null) {
  client = next;
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

function saltSecret(): string {
  return process.env.SIMULATOR_IP_SALT || process.env.FORM_GUARD_SECRET || process.env.SUPABASE_SERVICE_KEY || 'vibrana-simulator-dev';
}

/** HMAC(ip, daily salt). The salt rotates every UTC day, so hashes can't be joined across days. Never the raw IP. */
export function ipHash(headers: HeaderReader, now = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const salt = createHmac('sha256', saltSecret()).update(`vibrana.ai/simulator/ip/${day}`).digest();
  return createHmac('sha256', salt).update(getClientIp(headers) ?? 'unknown').digest('hex').slice(0, 32);
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const SLUG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** 10 URL-safe characters, 60 bits. 256 is a multiple of 64, so the mapping is unbiased. */
export function newSlug(): string {
  return Array.from(randomBytes(10), (b) => SLUG_ALPHABET[b % 64]).join('');
}

export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{10}$/.test(value);
}

// ---------------------------------------------------------------------------
// Company profiles (30-day cache) and the daily budget
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public assets: homepage screenshots and logos (bucket simulator-screens)
// ---------------------------------------------------------------------------

export const ASSET_BUCKET = 'simulator-screens';
/** Same retention as the profile they belong to (spec 13). */
export const ASSET_TTL_DAYS = 30;

/** Public URL for a stored asset path, or null. */
export function assetPublicUrl(path: string | null | undefined): string | null {
  const base = process.env.SUPABASE_URL;
  if (!path || !base) return null;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${ASSET_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Upserts one public asset. Returns false (and logs) on failure; never throws. */
export async function uploadAsset(path: string, body: Buffer, contentType: string): Promise<boolean> {
  try {
    const { error } = await db().storage.from(ASSET_BUCKET).upload(path, body, { contentType, upsert: true, cacheControl: '86400' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn(`[simulator] asset upload failed path=${path} reason=${err instanceof Error ? err.message : 'error'}`);
    return false;
  }
}

/**
 * Deletes screenshots and logos older than the profile TTL. Storage files can't be
 * deleted from SQL, so simulator_purge() can't do it; buildProfile calls this on a
 * small share of cache misses instead. Fails quietly.
 */
export async function sweepExpiredAssets(now = new Date()): Promise<number> {
  const cutoff = now.getTime() - ASSET_TTL_DAYS * 86_400_000;
  let removed = 0;
  try {
    for (const folder of ['screens', 'logos']) {
      const { data, error } = await db().storage.from(ASSET_BUCKET).list(folder, { limit: 1000, sortBy: { column: 'updated_at', order: 'asc' } });
      if (error || !data) continue;
      const stale = data
        .filter((o) => {
          const at = Date.parse(o.updated_at ?? o.created_at ?? '');
          return Number.isFinite(at) && at < cutoff;
        })
        .map((o) => `${folder}/${o.name}`);
      if (stale.length) {
        const { error: rmError } = await db().storage.from(ASSET_BUCKET).remove(stale);
        if (!rmError) removed += stale.length;
      }
    }
  } catch (err) {
    console.warn('[simulator] asset sweep failed', err instanceof Error ? err.message : err);
  }
  return removed;
}

export async function getCachedProfile(domain: string): Promise<CompanyProfile | null> {
  const { data, error } = await db()
    .from('simulator_company_profiles')
    .select('domain, sector, sector_confidence, alternatives, function_mix, signals, source, title, summary, offerings, hq_country, logo_path, screenshot_path, company_name, ai_role, levers')
    .eq('domain', domain)
    .gt('expires_at', new Date().toISOString())
    // Rows from the v1 read have no summary, logo or screenshot: treat them as stale so the domain is
    // read again. A row with a logo but a rejected summary is still a good row (share pages need the logo).
    .or('summary.not.is.null,logo_path.not.is.null,screenshot_path.not.is.null')
    .maybeSingle();
  if (error || !data) return null;
  return {
    domain: data.domain,
    sector: data.sector,
    confidence: data.sector_confidence,
    alternatives: data.alternatives ?? [],
    functionMix: data.function_mix,
    signals: { mentionsAi: Boolean(data.signals?.mentionsAi), b2b: Boolean(data.signals?.b2b) },
    source: data.source,
    title: data.title ?? null,
    summary: data.summary ?? null,
    offerings: data.offerings ?? [],
    name: data.company_name ?? null,
    aiRole: data.ai_role ?? null,
    levers: data.levers ?? [],
    hqCountry: data.hq_country ?? null,
    logoUrl: assetPublicUrl(data.logo_path),
    screenshotUrl: assetPublicUrl(data.screenshot_path),
  };
}

export async function saveProfile(
  profile: CompanyProfile,
  classifier: string,
  assets: { logoPath: string | null; screenshotPath: string | null } = { logoPath: null, screenshotPath: null },
): Promise<void> {
  const now = new Date();
  const { error } = await db()
    .from('simulator_company_profiles')
    .upsert(
      {
        domain: profile.domain,
        sector: profile.sector,
        sector_confidence: profile.confidence,
        alternatives: profile.alternatives,
        function_mix: profile.functionMix,
        signals: profile.signals,
        source: profile.source,
        title: profile.title,
        summary: profile.summary,
        offerings: profile.offerings,
        company_name: profile.name,
        ai_role: profile.aiRole,
        levers: profile.levers,
        hq_country: profile.hqCountry,
        logo_path: assets.logoPath,
        screenshot_path: assets.screenshotPath,
        classifier,
        classified_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
      },
      { onConflict: 'domain' },
    );
  if (error) console.error('[simulator] profile save failed:', error.message);
}

/** Counts one paid call. Fails closed: if the counter can't be read, no paid call is made. */
export async function budgetHit(kind: 'scrapes' | 'classifications', max: number): Promise<boolean> {
  try {
    const { data, error } = await db().rpc('simulator_budget_hit', { p_kind: kind, p_max: max });
    if (error) throw error;
    return data === true;
  } catch (err) {
    console.error('[simulator] budget check failed; using the manual path.', err instanceof Error ? err.message : err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

export async function createRun(input: {
  inputs: SimulatorInputs;
  result: SimulatorResult;
  showCompanyName: boolean;
  companyName: string | null;
  ipHash: string;
}): Promise<{ slug: string; ownerToken: string }> {
  const ownerToken = randomBytes(24).toString('base64url');
  // The domain column references a cached profile; a site we couldn't read has none.
  let domain: string | null = null;
  if (input.inputs.domain) {
    const { data } = await db().from('simulator_company_profiles').select('domain').eq('domain', input.inputs.domain).maybeSingle();
    domain = data?.domain ?? null;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug();
    const { error } = await db().from('simulator_runs').insert({
      slug,
      domain,
      show_company_name: input.showCompanyName,
      company_name: input.showCompanyName ? input.companyName : null,
      headcount: input.inputs.headcount,
      inputs: input.inputs,
      result: input.result,
      engine_version: input.result.engineVersion,
      benchmarks_version: input.result.benchmarksVersion,
      prices_version: input.result.pricesVersion,
      ip_hash: input.ipHash,
      owner_token_hash: sha256Hex(ownerToken),
    });
    if (!error) return { slug, ownerToken };
    if (error.code !== '23505') throw new Error(`run insert failed: ${error.message}`);
  }
  throw new Error('run insert failed: slug collisions');
}

export async function getRunBySlug(slug: string): Promise<StoredRun | null | 'deleted'> {
  if (!isSlug(slug)) return null;
  const { data, error } = await db()
    .from('simulator_runs')
    .select('slug, created_at, domain, show_company_name, company_name, result, deleted_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  if (data.deleted_at) return 'deleted';
  return {
    slug: data.slug,
    createdAt: data.created_at,
    domain: data.domain,
    showCompanyName: data.show_company_name,
    companyName: data.show_company_name ? data.company_name : null,
    result: data.result,
  };
}

/** Cheap check for proxy.ts, which answers 410 for a deleted run before the page renders. Throws on storage errors. */
export async function isRunDeleted(slug: string): Promise<boolean> {
  if (!isSlug(slug)) return false;
  const { data, error } = await db().from('simulator_runs').select('deleted_at').eq('slug', slug).maybeSingle();
  if (error) throw new Error(`run lookup failed: ${error.message}`);
  return Boolean(data?.deleted_at);
}

export async function getRunId(slug: string): Promise<string | null> {
  if (!isSlug(slug)) return null;
  const { data } = await db().from('simulator_runs').select('id').eq('slug', slug).is('deleted_at', null).maybeSingle();
  return data?.id ?? null;
}

/** Soft delete with the owner token. The link then returns 410 and the OG image stops rendering. */
export async function deleteRun(slug: string, ownerToken: unknown): Promise<'deleted' | 'not-found' | 'forbidden'> {
  if (!isSlug(slug)) return 'not-found';
  const { data } = await db().from('simulator_runs').select('id, owner_token_hash, deleted_at').eq('slug', slug).maybeSingle();
  if (!data || data.deleted_at) return 'not-found';
  if (typeof ownerToken !== 'string' || !ownerToken) return 'forbidden';
  const given = Buffer.from(sha256Hex(ownerToken), 'hex');
  const stored = Buffer.from(data.owner_token_hash, 'hex');
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) return 'forbidden';
  const { error } = await db().from('simulator_runs').update({ deleted_at: new Date().toISOString() }).eq('id', data.id);
  if (error) throw new Error(`run delete failed: ${error.message}`);
  return 'deleted';
}

export async function recordView(slug: string, headers: HeaderReader): Promise<void> {
  if (!isSlug(slug)) return;
  const { error } = await db().rpc('simulator_run_view', { p_slug: slug, p_ip_hash: ipHash(headers) });
  if (error) console.error('[simulator] view count failed:', error.message);
}

export async function recordShare(slug: string): Promise<boolean> {
  if (!isSlug(slug)) return false;
  const { data, error } = await db().rpc('simulator_run_share', { p_slug: slug });
  if (error) {
    console.error('[simulator] share count failed:', error.message);
    return false;
  }
  return data === true;
}

export async function linkRunToLead(runId: string, leadId: string): Promise<void> {
  const { error } = await db().from('simulator_runs').update({ lead_id: leadId }).eq('id', runId);
  if (error) console.error('[simulator] lead link failed:', error.message);
}
