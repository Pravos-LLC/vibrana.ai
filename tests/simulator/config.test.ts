import { describe, expect, it } from 'vitest';
import * as assumptions from '@/src/lib/simulator/assumptions';
import { EVIDENCE, FUNCTION_PARAMS, ILLUSTRATIONS } from '@/src/lib/simulator/benchmarks';
import { FX, PRICES_READ_ON, PRICE_MAX_AGE_DAYS, SEAT_PRICES, TOKEN_PRICES } from '@/src/lib/simulator/prices';
import { SECTORS } from '@/src/lib/simulator/sectors';

const isUrl = (u: unknown) => typeof u === 'string' && /^https:\/\/\S+$/.test(u);

/** Walks a config export and returns every leaf param that has neither a source URL nor `assumption: true`. */
function unsourced(name: string, value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const v = value as Record<string, unknown>;
  if ('value' in v) {
    const src = v.source as { url?: string } | undefined;
    if (v.assumption === true && typeof v.note === 'string' && v.note.length > 0) return [];
    if (src && isUrl(src.url)) return [];
    return [name];
  }
  return Object.entries(v).flatMap(([k, child]) => unsourced(`${name}.${k}`, child));
}

describe('every number has a source or says "our assumption" (spec 14.2)', () => {
  it('assumptions.ts params are sourced or flagged', () => {
    const params = Object.entries(assumptions).filter(
      ([k]) => !['ASSUMPTIONS_VERSION', 'HOURLY_COST', 'HOURLY_COST_LOCAL', 'HOURLY_COST_SOURCES', 'REGION_CURRENCY'].includes(k),
    );
    expect(params.flatMap(([k, v]) => unsourced(k, v))).toEqual([]);
  });

  it('hourly costs cite a public source per region', () => {
    for (const [region, src] of Object.entries(assumptions.HOURLY_COST_SOURCES)) {
      expect(isUrl(src.url), region).toBe(true);
      expect(src.label, region).not.toBe('PENDING');
      expect(src.period, region).not.toBe('PENDING');
    }
  });

  it('evidence rows carry a citation and a link', () => {
    for (const row of EVIDENCE) {
      expect(isUrl(row.url), row.id).toBe(true);
      expect(row.citation.length, row.id).toBeGreaterThan(5);
    }
    expect(EVIDENCE.some((r) => r.counterweight)).toBe(true);
  });

  it('function parameters only cite rows that exist, or are labeled extrapolations', () => {
    const ids = new Set(EVIDENCE.map((r) => r.id));
    for (const [f, p] of Object.entries(FUNCTION_PARAMS)) {
      for (const rows of Object.values(p.rows)) for (const id of rows) expect(ids.has(id), `${f}:${id}`).toBe(true);
      if (p.rows.central.length === 0) expect(p.extrapolated, f).toBe(true);
    }
  });

  it('sector mixes and illustrations are labeled', () => {
    for (const s of SECTORS) expect(s.assumption && s.note.length > 0).toBe(true);
    for (const i of ILLUSTRATIONS) expect(i.selfReported).toBe(true);
  });

  it('prices link to the provider page', () => {
    for (const seat of Object.values(SEAT_PRICES)) expect(isUrl(seat.source.url)).toBe(true);
    for (const rows of Object.values(TOKEN_PRICES)) for (const r of rows) expect(isUrl(r.source.url)).toBe(true);
    expect(isUrl(FX.source.url)).toBe(true);
  });
});

describe('prices are dated (spec 14.8)', () => {
  it(`were read within ${PRICE_MAX_AGE_DAYS} days`, () => {
    for (const readOn of [PRICES_READ_ON, FX.readOn]) {
      const ageDays = (Date.now() - Date.parse(`${readOn}T00:00:00Z`)) / 86_400_000;
      expect(ageDays, `refresh prices: read on ${readOn}`).toBeLessThan(PRICE_MAX_AGE_DAYS);
    }
  });
});

describe('sector examples', () => {
  it('cite a primary source with the quoted number', async () => {
    const { SECTOR_EXAMPLES } = await import('@/src/lib/simulator/sector-examples');
    for (const [sector, ex] of Object.entries(SECTOR_EXAMPLES)) {
      expect(isUrl(ex!.url), sector).toBe(true);
      expect(ex!.quote.length, sector).toBeGreaterThan(20);
      expect(ex!.result, sector).not.toMatch(/—/);
    }
  });
});
