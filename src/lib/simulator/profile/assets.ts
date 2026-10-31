/**
 * The company header's two images (plan v2, PR B 1): the homepage screenshot
 * Firecrawl took, and the company's logo. Both are copied into our public
 * `simulator-screens` bucket, because Firecrawl's screenshot URL expires and a
 * share card must render from storage we control.
 *
 * This is the one place our server fetches something a visitor pointed at, so
 * every fetch is guarded: https only, public hostnames only, every DNS answer
 * must be a public address, redirects are re-checked hop by hop, a hard size cap,
 * image content types only, and a short timeout. The screenshot is only ever
 * fetched from Firecrawl's own storage host. A failure here never fails the
 * profile: the header simply shows no image.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';
import { uploadAsset } from '../server/db';
import { isPublicHostname } from './domain';

export const SCREENSHOT_HOSTS = new Set(['storage.googleapis.com']);
const FETCH_TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 3;
const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
const LOGO_MAX_BYTES = 512 * 1024;
const SCREENSHOT_WIDTH = 1280;
const LOGO_SIZE = 256;
/** A logo smaller than this looks broken in the header; keep looking for a better one. */
const LOGO_MIN_WIDTH = 64;

// ---------------------------------------------------------------------------
// Guarded fetch
// ---------------------------------------------------------------------------

/** True for addresses a public website can't legitimately live on. */
export function isPrivateAddress(address: string): boolean {
  const v = isIP(address);
  if (v === 4) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (v === 6) {
    const x = address.toLowerCase();
    if (x === '::' || x === '::1') return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^(fc|fd|fe[89ab]|ff)/.test(x);
  }
  return true;
}

async function hostIsPublic(host: string): Promise<boolean> {
  if (!isPublicHostname(host)) return false;
  try {
    const answers = await lookup(host, { all: true, verbatim: true });
    return answers.length > 0 && answers.every((a) => !isPrivateAddress(a.address));
  } catch {
    return false;
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<Buffer | null> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!res.body) return null;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Fetches an image from a public https URL. Returns null on anything unexpected.
 * `allowHosts` pins the hosts (and redirect targets) that may be contacted.
 */
export async function fetchPublicImage(rawUrl: string, maxBytes: number, allowHosts?: Set<string>): Promise<Buffer | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (allowHosts && !allowHosts.has(host)) return null;
    if (!(await hostIsPublic(host))) return null;
    let res: Response;
    try {
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), headers: { Accept: 'image/*' } });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) return null;
      try {
        url = new URL(next, url);
      } catch {
        return null;
      }
      continue;
    }
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!type.startsWith('image/')) return null;
    return readCapped(res, maxBytes);
  }
  return null;
}

const HTML_MAX_BYTES = 1_500_000;
const HTML_TIMEOUT_MS = 8_000;

/**
 * Fetches a homepage's HTML straight from the site with the same guards as images (https, public
 * hosts, re-checked redirects, size cap). It costs no scraping credits, so it is the fallback when
 * the paid scrape is spent or fails. Returns the final URL and the markup, or null.
 */
export async function fetchPublicHtml(rawUrl: string): Promise<{ html: string; url: string } | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!(await hostIsPublic(url.hostname.toLowerCase()))) return null;
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(HTML_TIMEOUT_MS),
        headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'Mozilla/5.0 (compatible; VibranaSimulator/1.0; +https://www.vibrana.ai)' },
      });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) return null;
      try {
        url = new URL(next, url);
      } catch {
        return null;
      }
      continue;
    }
    if (!res.ok || !(res.headers.get('content-type') ?? '').toLowerCase().includes('html')) return null;
    const buf = await readCapped(res, HTML_MAX_BYTES);
    return buf ? { html: buf.toString('utf8'), url: url.toString() } : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Screenshot and logo
// ---------------------------------------------------------------------------

export function screenshotPath(domain: string): string {
  return `screens/${domain}.webp`;
}

export function logoPath(domain: string): string {
  return `logos/${domain}.png`;
}

/** Copies Firecrawl's screenshot into our bucket as a 1280-wide webp. Returns the stored path or null. */
export async function storeScreenshot(domain: string, screenshotUrl: string | null | undefined): Promise<string | null> {
  if (!screenshotUrl) return null;
  try {
    const raw = await fetchPublicImage(screenshotUrl, SCREENSHOT_MAX_BYTES, SCREENSHOT_HOSTS);
    if (!raw) return null;
    const webp = await sharp(raw, { limitInputPixels: 40_000_000 })
      .resize({ width: SCREENSHOT_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    const path = screenshotPath(domain);
    return (await uploadAsset(path, webp, 'image/webp')) ? path : null;
  } catch (err) {
    console.warn(`[simulator] screenshot failed domain=${domain} reason=${err instanceof Error ? err.message : 'error'}`);
    return null;
  }
}

/** Google's favicon service: a last resort that always exists, often only 16 px. */
export function fallbackIconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * Tries the page's icon links best first, then Google's favicon service. Keeps the
 * first logo at least 64 px wide, else the widest it saw. Stored as a 256 px png.
 */
export async function storeLogo(domain: string, candidates: string[] | undefined): Promise<string | null> {
  const probes = [`https://${domain}/logo.svg`, `https://${domain}/logo.png`];
  const urls = [...new Set([...(candidates ?? []).filter((u) => u.startsWith('https://')).slice(0, 6), ...probes, fallbackIconUrl(domain)])].slice(0, 9);
  let best: { buf: Buffer; width: number } | null = null;
  for (const u of urls) {
    try {
      const raw = await fetchPublicImage(u, LOGO_MAX_BYTES);
      if (!raw) continue;
      const image = sharp(raw, { limitInputPixels: 4_000_000, density: 300 });
      const meta = await image.metadata();
      const width = meta.width ?? 0;
      if (!width) continue;
      if (!best || width > best.width) best = { buf: raw, width };
      if (width >= LOGO_MIN_WIDTH) break;
    } catch {
      continue;
    }
  }
  if (!best) return null;
  try {
    const png = await sharp(best.buf, { limitInputPixels: 4_000_000, density: 300 })
      .resize({ width: LOGO_SIZE, height: LOGO_SIZE, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    const path = logoPath(domain);
    return (await uploadAsset(path, png, 'image/png')) ? path : null;
  } catch (err) {
    console.warn(`[simulator] logo failed domain=${domain} reason=${err instanceof Error ? err.message : 'error'}`);
    return null;
  }
}
