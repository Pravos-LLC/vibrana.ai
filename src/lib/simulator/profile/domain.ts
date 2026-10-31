/**
 * SSRF guard and domain normalization for the simulator's website step (spec 10, 11).
 * Only public http(s) hostnames pass: no IP literals, no ports, no credentials,
 * no localhost or internal-only names. Firecrawl / Browser Run do the fetching;
 * our server never fetches the visitor's URL itself.
 */

// Two-label public suffixes common in our markets (UK/EU/US plus a few others).
// Enough to find the registrable domain without shipping the full public suffix list.
const TWO_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'ltd.uk', 'plc.uk', 'me.uk', 'net.uk', 'nhs.uk',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'co.nz', 'org.nz', 'co.za', 'co.in', 'co.jp', 'co.kr', 'co.il',
  'com.br', 'com.mx', 'com.ar', 'com.sg', 'com.hk', 'com.tr', 'com.cy', 'com.mt',
  'com.pl', 'com.es', 'com.pt', 'com.gr', 'com.ua',
]);

const BLOCKED_SUFFIXES = ['localhost', 'local', 'internal', 'intranet', 'lan', 'home', 'corp', 'example', 'invalid', 'test', 'onion'];

export type NormalizedUrl = { domain: string; url: string };

/** Returns the registrable domain and a canonical https URL, or null when the input is not a safe public website. */
export function normalizeWebsite(input: unknown): NormalizedUrl | null {
  if (typeof input !== 'string') return null;
  let raw = input.trim();
  if (!raw || raw.length > 500 || /\s/.test(raw)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || parsed.port) return null;

  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!isPublicHostname(host)) return null;

  const domain = registrableDomain(host);
  if (!domain) return null;
  return { domain, url: `https://${host}/` };
}

export function isPublicHostname(host: string): boolean {
  if (!host || host.length > 253) return false;
  // IPv6 literals arrive bracketed; IPv4 (and the numeric forms URL normalizes to dotted quads) are all-numeric.
  if (host.includes(':') || host.startsWith('[')) return false;
  if (/^[0-9.]+$/.test(host)) return false;
  if (/^0x/i.test(host.split('.')[0] ?? '')) return false;
  const labels = host.split('.');
  if (labels.length < 2) return false;
  if (!labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l) || /^xn--[a-z0-9-]+$/.test(l))) return false;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/.test(tld) && !/^xn--[a-z0-9-]+$/.test(tld)) return false;
  if (BLOCKED_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`) || tld === s)) return false;
  return true;
}

export function registrableDomain(host: string): string | null {
  const labels = host.replace(/^www\./, '').split('.');
  if (labels.length < 2) return null;
  const lastTwo = labels.slice(-2).join('.');
  if (TWO_LABEL_SUFFIXES.has(lastTwo)) {
    return labels.length >= 3 ? labels.slice(-3).join('.') : null;
  }
  return lastTwo;
}
