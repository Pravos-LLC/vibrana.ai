import { describe, expect, it } from 'vitest';
import { normalizeWebsite, registrableDomain } from '@/src/lib/simulator/profile/domain';
import { adjustMix } from '@/src/lib/simulator/profile/mix';
import { trimMarkdown } from '@/src/lib/simulator/profile/scrape';
import { sectorById } from '@/src/lib/simulator/sectors';
import { FUNCTIONS } from '@/src/lib/simulator/types';

describe('normalizeWebsite (SSRF guard)', () => {
  it.each([
    ['acme.com', 'acme.com', 'https://acme.com/'],
    ['https://www.Acme.com/about?x=1', 'acme.com', 'https://www.acme.com/'],
    ['http://shop.acme.co.uk', 'acme.co.uk', 'https://shop.acme.co.uk/'],
    ['  acme.io  ', 'acme.io', 'https://acme.io/'],
  ])('accepts %s', (input, domain, url) => {
    expect(normalizeWebsite(input)).toEqual({ domain, url });
  });

  it.each([
    'http://127.0.0.1',
    'http://10.0.0.1/admin',
    'http://[::1]/',
    'http://2130706433',
    'http://0x7f000001',
    'http://localhost:3000',
    'http://acme.com:8080',
    'https://user:pass@acme.com',
    'ftp://acme.com',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://metadata.google.internal',
    'http://printer.local',
    'intranet',
    'acme.test',
    '',
    'a b.com',
    42,
    null,
  ])('rejects %s', (input) => {
    expect(normalizeWebsite(input)).toBeNull();
  });

  it('finds the registrable domain under two-label suffixes', () => {
    expect(registrableDomain('www.bbc.co.uk')).toBe('bbc.co.uk');
    expect(registrableDomain('co.uk')).toBeNull();
    expect(registrableDomain('a.b.example.com')).toBe('example.com');
  });
});

describe('adjustMix', () => {
  it('leaves the sector default alone at typical scores and always sums to 1', () => {
    const typical = Object.fromEntries(FUNCTIONS.map((f) => [f, 0.5])) as Record<(typeof FUNCTIONS)[number], number>;
    const mix = adjustMix('insurance', typical);
    for (const f of FUNCTIONS) expect(mix[f]).toBeCloseTo(sectorById('insurance').mix[f], 3);
    const skewed = adjustMix('software', { ...typical, software: 1, sales: 0 });
    expect(Object.values(skewed).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(skewed.software).toBeGreaterThan(sectorById('software').mix.software);
    // Bounded: a score of 1 at most grows a share by 1.4x before renormalizing.
    expect(skewed.software).toBeLessThan(sectorById('software').mix.software * 1.4);
  });
});

describe('trimMarkdown', () => {
  it('drops images and link targets and caps the length', () => {
    expect(trimMarkdown('![logo](https://x/y.png) [Pricing](https://acme.com/pricing)\n\n\n\nHi')).toBe('Pricing\n\nHi');
    expect(trimMarkdown('a'.repeat(100), 10)).toHaveLength(10);
  });
});
