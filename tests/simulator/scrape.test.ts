import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrapeHomepage } from '@/src/lib/simulator/profile/scrape';

const PAGE = '# Sampleb544654a4d1a\n\nInsurance for property managers and short-term rental hosts. Get a quote.\n'.repeat(10);
const ok = (markdown: string) => new Response(JSON.stringify({ success: true, data: { markdown } }), { status: 200 });

describe('scrapeHomepage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('asks Firecrawl for a cached copy with a 20 s budget', async () => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'test');
    const fetchMock = vi.fn().mockResolvedValue(ok(PAGE));
    vi.stubGlobal('fetch', fetchMock);
    const result = await scrapeHomepage('https://sampleb544654a4d1a.com');
    expect(result?.source).toBe('firecrawl');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.timeout).toBe(19_000);
    expect(body.maxAge).toBeGreaterThan(0);
  });

  it('retries once on a 5xx', async () => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'test');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"code":"SCRAPE_TIMEOUT"}', { status: 502 }))
      .mockResolvedValueOnce(ok(PAGE));
    vi.stubGlobal('fetch', fetchMock);
    expect((await scrapeHomepage('https://sampleb544654a4d1a.com'))?.source).toBe('firecrawl');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('logs why a scrape failed instead of failing silently', async () => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'test');
    const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeout));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await scrapeHomepage('https://sampleb544654a4d1a.com')).toBeNull();
    expect(warn.mock.calls.flat().join(' ')).toMatch(/provider=firecrawl domain=sampleb544654a4d1a\.com reason=timeout/);
  });
});

describe('rate limits', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('waits and retries once on a 429', async () => {
    vi.useFakeTimers();
    vi.stubEnv('FIRECRAWL_API_KEY', 'test');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"code":"RATE_LIMIT"}', { status: 429, headers: { 'retry-after': '2' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { markdown: PAGE } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const pending = scrapeHomepage('https://hippo.com');
    await vi.advanceTimersByTimeAsync(2_000);
    expect((await pending)?.source).toBe('firecrawl');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('direct fetch fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads a server-rendered site without Firecrawl when the paid scrape is skipped', async () => {
    vi.stubEnv('FIRECRAWL_API_KEY', 'test');
    const body = `<html lang="en"><head><title>Acme Partners</title><meta name="description" content="Affiliate marketing platform"/></head>
      <body><header><img src="/logo.svg" alt="Acme logo"></header><script>var x=1</script>${'<p>We connect advertisers with partners to drive sales.</p>'.repeat(10)}</body></html>`;
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status: 200, headers: { 'content-type': 'text/html' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await scrapeHomepage('https://example.com', { paid: false });
    expect(result?.source).toBe('direct');
    expect(result?.markdown).toContain('connect advertisers');
    expect(result?.markdown).not.toContain('var x=1');
    expect(result?.meta?.title).toBe('Acme Partners');
    expect(result?.iconCandidates?.[0]).toBe('https://example.com/logo.svg');
    expect(fetchMock.mock.calls.every((c) => !String(c[0]).includes('firecrawl'))).toBe(true);
  });
});
