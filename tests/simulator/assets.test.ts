import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The guarded image fetch and the screenshot/logo copies. DNS and storage are faked;
// sharp runs for real on generated images.
const dns = vi.hoisted(() => ({ answers: {} as Record<string, string[]> }));
vi.mock('node:dns/promises', () => ({
  lookup: async (host: string) => (dns.answers[host] ?? ['93.184.216.34']).map((address) => ({ address, family: address.includes(':') ? 6 : 4 })),
}));
const uploads = vi.hoisted(() => [] as { path: string; type: string; width?: number }[]);
vi.mock('@/src/lib/simulator/server/db', () => ({
  uploadAsset: async (path: string, body: Buffer, type: string) => {
    uploads.push({ path, type, width: (await sharp(body).metadata()).width });
    return true;
  },
}));

const { fetchPublicImage, isPrivateAddress, storeLogo, storeScreenshot } = await import('@/src/lib/simulator/profile/assets');
const { iconCandidatesFromHtml, logoCandidatesFromHtml } = await import('@/src/lib/simulator/profile/scrape');

const png = (w: number, h = w) => sharp({ create: { width: w, height: h, channels: 4, background: '#5b3df5' } }).png().toBuffer();
const image = async (w: number, h = w) => new Response(new Uint8Array(await png(w, h)), { headers: { 'content-type': 'image/png' } });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  dns.answers = {};
  uploads.length = 0;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('isPrivateAddress', () => {
  it.each(['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.20.1.1', '192.168.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1'])(
    'blocks %s',
    (a) => expect(isPrivateAddress(a)).toBe(true),
  );
  it.each(['93.184.216.34', '8.8.8.8', '2606:4700::6810:84e5'])('allows %s', (a) => expect(isPrivateAddress(a)).toBe(false));
});

describe('fetchPublicImage', () => {
  it('refuses a host that resolves to a private address', async () => {
    dns.answers['evil.example.com'] = ['10.1.2.3'];
    expect(await fetchPublicImage('https://evil.example.com/logo.png', 1000)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses http, ports and hosts outside the allow list', async () => {
    expect(await fetchPublicImage('http://acme.com/a.png', 1000)).toBeNull();
    expect(await fetchPublicImage('https://acme.com:8443/a.png', 1000)).toBeNull();
    expect(await fetchPublicImage('https://acme.com/a.png', 1000, new Set(['storage.googleapis.com']))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-checks every redirect hop', async () => {
    dns.answers['internal.acme.com'] = ['192.168.0.5'];
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://internal.acme.com/x.png' } }));
    expect(await fetchPublicImage('https://acme.com/a.png', 100_000)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses non-images and oversized bodies', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { headers: { 'content-type': 'text/html' } }));
    expect(await fetchPublicImage('https://acme.com/a.png', 100_000)).toBeNull();
    fetchMock.mockResolvedValueOnce(await image(400));
    expect(await fetchPublicImage('https://acme.com/a.png', 50)).toBeNull();
  });
});

describe('storeScreenshot', () => {
  it('copies the Firecrawl screenshot as a 1280-wide webp', async () => {
    fetchMock.mockResolvedValueOnce(await image(1600, 1000));
    expect(await storeScreenshot('acme.com', 'https://storage.googleapis.com/firecrawl-scrape-media/s.png')).toBe('screens/acme.com.webp');
    expect(uploads).toEqual([{ path: 'screens/acme.com.webp', type: 'image/webp', width: 1280 }]);
  });

  it('never fetches a screenshot from anywhere else', async () => {
    expect(await storeScreenshot('acme.com', 'https://acme.com/s.png')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null instead of throwing on a bad image', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not an image', { headers: { 'content-type': 'image/png' } }));
    expect(await storeScreenshot('acme.com', 'https://storage.googleapis.com/x/s.png')).toBeNull();
  });
});

describe('storeLogo', () => {
  it('keeps the first icon at least 64 px wide', async () => {
    fetchMock.mockResolvedValueOnce(await image(180)).mockResolvedValueOnce(await image(32));
    expect(await storeLogo('acme.com', ['https://acme.com/apple-touch-icon.png', 'https://acme.com/favicon.ico'])).toBe('logos/acme.com.png');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(uploads[0]).toMatchObject({ path: 'logos/acme.com.png', type: 'image/png', width: 180 });
  });

  it('falls back to the widest icon it saw, ending with Google favicons', async () => {
    fetchMock.mockResolvedValueOnce(await image(32)).mockResolvedValueOnce(await image(48));
    expect(await storeLogo('acme.com', ['https://acme.com/favicon.ico'])).toBe('logos/acme.com.png');
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls[1]).toBe('https://acme.com/logo.svg');
    expect(urls.at(-1)).toContain('google.com/s2/favicons?domain=acme.com');
    expect(uploads[0].width).toBe(48);
  });

  it('returns null when nothing loads', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    expect(await storeLogo('acme.com', [])).toBeNull();
  });
});

describe('iconCandidatesFromHtml', () => {
  it('puts apple-touch icons first, then sized icons, https only', () => {
    const html = `<head>
      <link rel="icon" href="/favicon-32x32.png" sizes="32x32">
      <link rel="icon" href="/icon-192.png" sizes="192x192">
      <link rel="apple-touch-icon" href="https://cdn.acme.com/apple.png">
      <link rel="icon" href="http://insecure.acme.com/i.png">
      <link rel="stylesheet" href="/s.css">
    </head><body><link rel="icon" href="/late.png"></body>`;
    expect(iconCandidatesFromHtml(html, 'https://www.acme.com/en/')).toEqual([
      'https://cdn.acme.com/apple.png',
      'https://www.acme.com/icon-192.png',
      'https://www.acme.com/favicon-32x32.png',
    ]);
  });
});

describe('logoCandidatesFromHtml', () => {
  // Shaped like sample235fedd93a54media.com: only a .ico in the head, the real logo is an <img> in the header.
  const html = `<head><link rel="icon" type="image/x-icon" href="/favicon.ico"/>
    <meta property="og:image" content="https://cdn.acme.com/banner.webp"/></head>
    <body><header><a href="/"><img src="/logo.svg" alt="Acme"></a></header>
    <main><img src="/hero.jpg" alt="hero"></main>
    <footer><img src="https://cdn.acme.com/footer-logo.png" alt="Acme footer logo"></footer></body>`;

  it('finds the header logo and never the og:image banner', () => {
    const found = logoCandidatesFromHtml(html, 'https://www.acme.com/');
    expect(found[0]).toBe('https://www.acme.com/logo.svg');
    expect(found).not.toContain('https://cdn.acme.com/banner.webp');
    expect(found).not.toContain('https://www.acme.com/hero.jpg');
  });

  it('prefers JSON-LD logos', () => {
    const ld = `<script type="application/ld+json">{"@type":"Organization","logo":{"url":"https://cdn.acme.com/mark.png"}}</script>${html}`;
    expect(logoCandidatesFromHtml(ld, 'https://www.acme.com/')[0]).toBe('https://cdn.acme.com/mark.png');
  });

  it('drops http and unparseable sources', () => {
    expect(logoCandidatesFromHtml('<header><img src="http://x.com/logo.png" alt="logo"></header>', 'https://acme.com/')).toEqual([]);
  });
});
