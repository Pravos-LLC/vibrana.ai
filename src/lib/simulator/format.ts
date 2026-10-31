/**
 * Display formatting for simulator numbers. Honesty rule 14.1: a headline number
 * never renders without its range, so the only public way to print one is
 * `formatRange` / `formatMoneyRange`, which always print low and high.
 */
import { FX } from './prices';
import type { Currency, Range, Region } from './types';

/** Rounds to two significant figures for "about" values: 1,510 -> 1,500; 299 -> 300; 90,621 -> 91,000. */
export function roundAbout(n: number): number {
  if (!Number.isFinite(n) || n === 0) return 0;
  const abs = Math.abs(n);
  const step = abs >= 100 ? 10 ** (Math.floor(Math.log10(abs)) - 1) : abs >= 10 ? 1 : 0.1;
  return Math.round(n / step) * step;
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatAbout(n: number): string {
  return roundAbout(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

const SYMBOL: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£' };

export function convert(usd: number, currency: Currency): number {
  return usd * FX.perUsd[currency];
}

/** Rounds money to three significant figures, so itemized lines still reconcile with their total on screen. */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n) || n === 0) return 0;
  const abs = Math.abs(n);
  if (abs < 1000) return Math.round(n);
  const step = 10 ** (Math.floor(Math.log10(abs)) - 2);
  return Math.round(n / step) * step;
}

/** "$4,620", "€91.5k", "$1.2M". Compact from 100,000. */
export function formatMoney(usd: number, currency: Currency, opts: { compact?: boolean } = {}): string {
  const v = roundMoney(convert(usd, currency));
  const s = SYMBOL[currency];
  const abs = Math.abs(v);
  const compact = opts.compact ?? abs >= 100_000;
  if (compact && abs >= 1_000_000) return `${s}${trim(v / 1_000_000, 2)}M`;
  if (compact && abs >= 1_000) return `${s}${trim(v / 1_000, 1)}k`;
  return `${s}${formatNumber(v)}`;
}

function trim(n: number, digits: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/** Hours range: "300 to 2,650". */
export function formatRange(r: Pick<Range, 'low' | 'high'>): string {
  return `${formatAbout(r.low)} to ${formatAbout(r.high)}`;
}

/** Money range: "$4,600 to $10,200". */
export function formatMoneyRange(r: Pick<Range, 'low' | 'high'>, currency: Currency, opts: { compact?: boolean } = {}): string {
  const compact = opts.compact ?? Math.max(Math.abs(r.low), Math.abs(r.high)) * FX.perUsd[currency] >= 100_000;
  return `${formatMoney(r.low, currency, { compact })} to ${formatMoney(r.high, currency, { compact })}`;
}

/** Central value with its range, the only way a headline number is printed: "about 1,500 (300 to 2,650)". */
export function formatCentralWithRange(r: Range): { central: string; range: string } {
  return { central: formatAbout(r.central), range: formatRange(r) };
}

export function formatMoneyCentralWithRange(r: Range, currency: Currency): { central: string; range: string } {
  return { central: formatMoney(r.central, currency), range: formatMoneyRange(r, currency) };
}

export function formatPercent(share: number, digits = 0): string {
  return `${(share * 100).toFixed(digits)}%`;
}

/** Size bands used on the share card and for the lead's team size. */
const BANDS = [
  { max: 49, label: '5 to 49', lead: '1-50 employees' },
  { max: 149, label: '50 to 149', lead: '50-150 employees' },
  { max: 250, label: '150 to 250', lead: '151-250 employees' },
  { max: 350, label: '251 to 350', lead: '251-350 employees' },
  { max: 500, label: '351 to 500', lead: '351-500 employees' },
  { max: 1000, label: '501 to 1,000', lead: '500+ employees' },
  { max: 5000, label: '1,001 to 5,000', lead: '500+ employees' },
  { max: Infinity, label: '5,000+', lead: '500+ employees' },
] as const;

export function sizeBand(headcount: number): string {
  return BANDS.find((b) => headcount <= b.max)!.label;
}

/** Matches the assessment form's team size options. */
export function leadTeamSize(headcount: number): string {
  return BANDS.find((b) => headcount <= b.max)!.lead;
}

const EU_REGIONS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

const REGION_CURRENCIES: Record<Region, Currency> = { us: 'USD', uk: 'GBP', eu: 'EUR', de: 'EUR', fr: 'EUR', nl: 'EUR' };

/** Cost region for an ISO country code: the six regions we have sourced pay data for. */
export function regionForIso(iso: string | null | undefined): Region | null {
  const c = (iso ?? '').toUpperCase();
  if (c === 'US') return 'us';
  if (c === 'GB' || c === 'UK') return 'uk';
  if (c === 'DE') return 'de';
  if (c === 'FR') return 'fr';
  if (c === 'NL') return 'nl';
  if (EU_REGIONS.has(c)) return 'eu';
  return null;
}

/** Region and display currency from a BCP 47 locale such as "en-GB" or "de-DE". Defaults to the US and USD. */
export function regionForLocale(locale: string | null | undefined): { region: Region; currency: Currency } {
  const country = (locale ?? '').split(/[-_]/)[1]?.toUpperCase();
  const region = regionForIso(country) ?? 'us';
  return { region, currency: REGION_CURRENCIES[region] };
}

/** Region from a domain's country-code TLD (".co.uk", ".de"). Null for .com and friends. */
export function regionForTld(domain: string | null | undefined): Region | null {
  const host = (domain ?? '').toLowerCase();
  if (/\.(uk)$/.test(host)) return 'uk';
  const tld = host.split('.').pop() ?? '';
  if (tld === 'eu') return 'eu';
  return tld.length === 2 ? regionForIso(tld) : null;
}

/** Pulls a domain out of whatever the visitor typed, for display only. The server does the real normalization. */
export function displayDomain(input: string): string {
  const raw = input.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

/**
 * A company's display name from its domain, not its page title (titles are headlines:
 * sampleb544654a4d1a.com's is "Give guests confidence..."). Keeps the title's casing when the title
 * contains the brand (gocardless.com + "GoCardless | ..." gives "GoCardless").
 */
export function companyName(domain: string | null | undefined, title?: string | null): string | null {
  if (!domain) return null;
  const label = domain.split('.')[0];
  if (!label) return null;
  const match = title?.match(new RegExp(`\\b${label.replace(/[^a-z0-9-]/gi, '')}\\b`, 'i'));
  if (match) return match[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}
