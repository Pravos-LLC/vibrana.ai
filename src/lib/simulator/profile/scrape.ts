/**
 * Fetches a homepage as markdown: Firecrawl first (proven here, passes most bot
 * walls), then Cloudflare Browser Run's /markdown endpoint when it is configured.
 * Page text lives in memory for one request only; nothing here stores it.
 * Firecrawl also returns a viewport screenshot (a short-lived URL on its own
 * storage host), the page metadata and the icon links from the page head, which
 * profile/assets.ts turns into the stored screenshot and logo.
 */

import { fetchPublicHtml } from './assets';

// A cold scrape of a redirecting site (sampleb544654a4d1a.com -> /en-gb/) can pass 8 s. 20 s, plus a retry only on a fast
// 5xx, keeps scrape + two classifier calls (2 x 12 s) under the route's 60 s maxDuration.
export const FIRECRAWL_TIMEOUT_MS = 20_000;
/** Firecrawl serves its own cached copy of a page this fresh, which is faster and costs less. */
export const FIRECRAWL_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;
export const BROWSER_RUN_TIMEOUT_MS = 10_000;
/** About 18k tokens at ~4 characters a token. */
export const MAX_PAGE_CHARS = 72_000;
const MIN_USEFUL_CHARS = 200;

export type PageMeta = {
  title: string | null;
  description: string | null;
  favicon: string | null;
  language: string | null;
  /** Final URL after redirects. */
  url: string | null;
};

export type ScrapeResult = {
  markdown: string;
  source: 'firecrawl' | 'browser_run' | 'direct';
  /** Firecrawl's short-lived screenshot URL. Browser Run gives none. */
  screenshotUrl?: string | null;
  meta?: PageMeta;
  /** Absolute icon URLs from the page head, best first. */
  iconCandidates?: string[];
};

type FirecrawlPage = { markdown: string; screenshotUrl: string | null; meta: PageMeta; iconCandidates: string[] };

const str = (v: unknown, max = 500): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Icon links from the page head, absolute https only, best first: apple-touch icons, then
 * sized icons by size (largest first), then unsized icons. The og:image is a share banner, not a logo.
 */
export function iconCandidatesFromHtml(html: string, baseUrl: string): string[] {
  const head = html.slice(0, 200_000).split(/<\/head>/i)[0];
  const found: { href: string; score: number }[] = [];
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? '';
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || !/(^|\s)(apple-touch-icon(-precomposed)?|icon|shortcut icon)(\s|$)/.test(rel)) continue;
    let abs: URL;
    try {
      abs = new URL(href.replace(/&amp;/g, '&'), baseUrl);
    } catch {
      continue;
    }
    if (abs.protocol !== 'https:') continue;
    const size = Number(/\bsizes\s*=\s*["'](\d+)x\d+["']/i.exec(tag)?.[1] ?? 0);
    const score = rel.includes('apple-touch-icon') ? 1000 + (size || 180) : size || (abs.pathname.endsWith('.svg') ? 500 : 16);
    found.push({ href: abs.toString(), score });
  }
  return [...new Set(found.sort((a, b) => b.score - a.score).map((f) => f.href))].slice(0, 5);
}

const absHttps = (href: string, baseUrl: string): string | null => {
  try {
    const abs = new URL(href.replace(/&amp;/g, '&').trim(), baseUrl);
    return abs.protocol === 'https:' ? abs.toString() : null;
  } catch {
    return null;
  }
};

function jsonLdLogos(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const block of html.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) ?? []) {
    const json = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    const walk = (v: unknown, depth: number) => {
      if (!v || typeof v !== 'object' || depth > 6) return;
      if (Array.isArray(v)) return v.forEach((x) => walk(x, depth + 1));
      const o = v as Record<string, unknown>;
      const logo = o.logo;
      const href = typeof logo === 'string' ? logo : typeof (logo as { url?: unknown } | undefined)?.url === 'string' ? (logo as { url: string }).url : null;
      const abs = href ? absHttps(href, baseUrl) : null;
      if (abs) out.push(abs);
      for (const x of Object.values(o)) walk(x, depth + 1);
    };
    try {
      walk(JSON.parse(json), 0);
    } catch {}
  }
  return out;
}

/**
 * The company's real logo, which is usually an <img> in the page header rather than a
 * <link rel=icon>: JSON-LD `logo` first, then images whose src, alt, class or id say "logo"
 * (header and nav ones before the rest). Absolute https only, best first. The share banner
 * (og:image) is not a logo and is never returned.
 */
export function logoCandidatesFromHtml(html: string, baseUrl: string): string[] {
  const doc = html.slice(0, 400_000);
  const scored: { href: string; score: number }[] = jsonLdLogos(doc, baseUrl).map((href) => ({ href, score: 100 }));
  const blocks = [...(doc.match(/<(header|nav)\b[\s\S]*?<\/\1>/gi) ?? []).map((b) => ({ b, bonus: 20 })), { b: doc, bonus: 0 }];
  for (const { b, bonus } of blocks) {
    for (const tag of b.match(/<img\b[^>]*>/gi) ?? []) {
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
      if (!src || src.startsWith('data:')) continue;
      const hint = /\b(?:alt|class|id)\s*=\s*["'][^"']*logo[^"']*["']/i.test(tag);
      const inName = /logo/i.test(src.split('?')[0]);
      if (!hint && !inName) continue;
      if (/footer|sprite|partner|client|customer|award/i.test(tag) && !bonus) continue;
      const abs = absHttps(src, baseUrl);
      if (!abs) continue;
      scored.push({ href: abs, score: 50 + bonus + (hint ? 5 : 0) + (inName ? 5 : 0) + (abs.endsWith('.svg') ? 3 : 0) });
    }
  }
  return [...new Set(scored.sort((a, b) => b.score - a.score).map((f) => f.href))].slice(0, 4);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}

type Attempt = { page: FirecrawlPage | null; reason?: string; retry: boolean; waitMs?: number };

/** Our Firecrawl plan rate-limits bursts (429). Wait once, briefly, then retry. */
const RATE_LIMIT_WAIT_MS = 4_000;
const RATE_LIMIT_WAIT_MAX_MS = 8_000;

function logFailure(provider: string, url: string, reason: string, startedAt: number) {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {}
  console.warn(`[simulator] scrape failed provider=${provider} domain=${host} reason=${reason} ms=${Date.now() - startedAt}`);
}

async function firecrawlOnce(url: string, key: string): Promise<Attempt> {
  try {
    const res = await fetchWithTimeout(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'screenshot', 'rawHtml'],
          onlyMainContent: false,
          timeout: FIRECRAWL_TIMEOUT_MS - 1_000,
          maxAge: FIRECRAWL_MAX_AGE_MS,
        }),
      },
      FIRECRAWL_TIMEOUT_MS,
    );
    if (!res.ok) {
      let code = '';
      try {
        code = (await res.json())?.code ?? '';
      } catch {}
      const retryAfter = Number(res.headers.get('retry-after'));
      return {
        page: null,
        reason: `http-${res.status}${code ? `:${code}` : ''}`,
        retry: res.status >= 500 || res.status === 408 || res.status === 429,
        waitMs: res.status === 429 ? Math.min(RATE_LIMIT_WAIT_MAX_MS, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_WAIT_MS) : 0,
      };
    }
    const data = await res.json();
    const d = data?.data ?? {};
    if (typeof d.markdown !== 'string') return { page: null, reason: 'no-markdown', retry: false };
    const m = d.metadata ?? {};
    const finalUrl = str(m.url) ?? str(m.sourceURL) ?? url;
    const page: FirecrawlPage = {
      markdown: d.markdown,
      screenshotUrl: str(d.screenshot, 2000),
      meta: { title: str(m.title, 300), description: str(m.description, 500), favicon: str(m.favicon, 2000), language: str(m.language, 20), url: finalUrl },
      iconCandidates:
        typeof d.rawHtml === 'string' ? [...new Set([...logoCandidatesFromHtml(d.rawHtml, finalUrl), ...iconCandidatesFromHtml(d.rawHtml, finalUrl)])] : [],
    };
    return { page, retry: false };
  } catch (err) {
    const name = err instanceof Error ? err.name : 'error';
    return { page: null, reason: name === 'TimeoutError' ? 'timeout' : name, retry: false };
  }
}

async function firecrawl(url: string): Promise<FirecrawlPage | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  const startedAt = Date.now();
  let attempt = await firecrawlOnce(url, key);
  if (!attempt.page && attempt.retry) {
    if (attempt.waitMs) await new Promise((resolve) => setTimeout(resolve, attempt.waitMs));
    attempt = await firecrawlOnce(url, key);
  }
  if (!attempt.page) logFailure('firecrawl', url, attempt.reason ?? 'unknown', startedAt);
  return attempt.page;
}

async function browserRun(url: string): Promise<string | null> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_BROWSER_RUN_TOKEN;
  if (!account || !token) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/browser-rendering/markdown`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      },
      BROWSER_RUN_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success && typeof data.result === 'string' ? data.result : null;
  } catch {
    return null;
  }
}

/** Drops images and link targets (they cost tokens and say nothing about the sector), collapses whitespace, trims to the budget. */
export function trimMarkdown(markdown: string, max = MAX_PAGE_CHARS): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const metaContent = (html: string, attr: 'name' | 'property', key: string): string | null => {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (new RegExp(`\\b${attr}\\s*=\\s*["']${key}["']`, 'i').test(tag)) return str(/\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.replace(/&amp;/g, '&'), 500);
  }
  return null;
};

/** Reads the homepage ourselves: no credits, no screenshot, works on any server-rendered site. */
async function directFetch(url: string): Promise<ScrapeResult | null> {
  const page = await fetchPublicHtml(url);
  if (!page) return null;
  const html = page.html;
  const text = trimMarkdown(
    html
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<\/(p|div|section|li|h[1-6]|tr|br|header|footer|article)>/gi, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&'),
  );
  if (text.length < MIN_USEFUL_CHARS) return null;
  const title = str(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, ' '), 300);
  return {
    markdown: text,
    source: 'direct',
    meta: { title, description: metaContent(html, 'name', 'description') ?? metaContent(html, 'property', 'og:description'), favicon: null, language: str(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i.exec(html)?.[1], 20), url: page.url },
    iconCandidates: [...new Set([...logoCandidatesFromHtml(html, page.url), ...iconCandidatesFromHtml(html, page.url)])],
  };
}

/** `paid: false` skips Firecrawl (the daily budget is spent) and reads the site directly. */
export async function scrapeHomepage(url: string, opts: { paid?: boolean } = {}): Promise<ScrapeResult | null> {
  const startedAt = Date.now();
  if (opts.paid === false) return directFetch(url);
  const first = await firecrawl(url);
  if (first && trimMarkdown(first.markdown).length >= MIN_USEFUL_CHARS) {
    return {
      markdown: trimMarkdown(first.markdown),
      source: 'firecrawl',
      screenshotUrl: first.screenshotUrl,
      meta: first.meta,
      iconCandidates: [...first.iconCandidates, ...(first.meta.favicon ? [first.meta.favicon] : [])].filter((u, i, a) => a.indexOf(u) === i),
    };
  }
  if (first) logFailure('firecrawl', url, `too-short:${trimMarkdown(first.markdown).length}`, startedAt);
  const second = await browserRun(url);
  if (second && trimMarkdown(second).length >= MIN_USEFUL_CHARS) return { markdown: trimMarkdown(second), source: 'browser_run' };
  return directFetch(url);
}
