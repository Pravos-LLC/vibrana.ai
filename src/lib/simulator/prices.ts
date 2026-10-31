import type { Currency, ProviderId } from './types';

/**
 * Model and seat prices (spec 8.5, 8.7). Re-read at least every 90 days: CI fails
 * when PRICES_READ_ON is older than that. Google states its prices hold through
 * 2026-12-31 and rise for many models from 2027-01-01, so re-read before January.
 */
export const PRICES_VERSION = '2026-10-15';
export const PRICES_READ_ON = '2026-10-15';
export const PRICE_MAX_AGE_DAYS = 90;

export type Source = { label: string; url: string };

export type SeatPrice = {
  /** USD per person per month, annual billing. */
  usd: number;
  /** The heavier-use seat builders sit on, USD per person per month, where the provider sells one. */
  premiumUsd?: number;
  plan: string;
  note: string;
  source: Source;
};

export type TokenPrice = {
  model: string;
  tier: 'small' | 'mid' | 'top';
  /** USD per 1M tokens. */
  input: number;
  output: number;
  cachedInput: number | null;
  source: Source;
};

const ANTHROPIC_PRICING: Source = { label: 'Anthropic API pricing', url: 'https://platform.claude.com/docs/en/about-claude/pricing' };
const OPENAI_PRICING: Source = { label: 'OpenAI API pricing', url: 'https://developers.openai.com/api/docs/pricing' };
const GOOGLE_PRICING: Source = { label: 'Gemini API pricing', url: 'https://ai.google.dev/gemini-api/docs/pricing' };
const WORKERS_AI_PRICING: Source = { label: 'Cloudflare Workers AI pricing', url: 'https://developers.cloudflare.com/workers-ai/platform/pricing/' };

export const SEAT_PRICES: Record<ProviderId, SeatPrice> = {
  anthropic: {
    usd: 20,
    premiumUsd: 100,
    plan: 'Claude Team and Enterprise, Standard seat',
    note: 'Annual billing. Premium seats are $100 (5x usage). Enterprise is $20 a seat from 20 seats with all usage billed on top at API rates, which is how the model treats usage.',
    source: { label: 'Claude pricing', url: 'https://claude.com/pricing' },
  },
  openai: {
    usd: 20,
    premiumUsd: 100,
    plan: 'ChatGPT Business, Standard seat',
    note: 'Annual billing; Premium seats are $100. ChatGPT Enterprise is quoted by OpenAI and not published, so it is not modeled.',
    source: { label: 'ChatGPT Business overview (OpenAI Help Center)', url: 'https://help.openai.com/en/articles/8792828-chatgpt-business-overview' },
  },
  google: {
    usd: 0,
    plan: 'Google Workspace with Gemini',
    note: 'Gemini is included in the Workspace plan price, so we add no seat cost on top of a plan you already pay for.',
    source: { label: 'Google Workspace pricing', url: 'https://workspace.google.com/pricing' },
  },
  'open-weight': {
    usd: 0,
    plan: 'Open-weight models on Cloudflare Workers AI',
    note: 'No seat: you pay per token only.',
    source: WORKERS_AI_PRICING,
  },
};

/** Full table shown in the sources panel (spec 8.7). */
export const TOKEN_PRICES: Record<ProviderId, TokenPrice[]> = {
  anthropic: [
    { model: 'Haiku 5.5', tier: 'small', input: 0.1, output: 0.5, cachedInput: 0.01, source: ANTHROPIC_PRICING },
    { model: 'Sonnet 5.5', tier: 'mid', input: 2, output: 10, cachedInput: 0.1, source: ANTHROPIC_PRICING },
    { model: 'Opus 5.5', tier: 'top', input: 4, output: 20, cachedInput: 0.2, source: ANTHROPIC_PRICING },
  ],
  openai: [
    { model: 'gpt-6-luna', tier: 'small', input: 0.1, output: 0.5, cachedInput: 0.01, source: OPENAI_PRICING },
    { model: 'gpt-6.1-sol', tier: 'mid', input: 2, output: 10, cachedInput: 0.1, source: OPENAI_PRICING },
    { model: 'gpt-6-astra', tier: 'top', input: 10, output: 50, cachedInput: 1, source: OPENAI_PRICING },
  ],
  google: [
    { model: 'gemini-3.1-flash-lite', tier: 'small', input: 0.25, output: 1.5, cachedInput: 0.025, source: GOOGLE_PRICING },
    { model: 'gemini-3.8-flash', tier: 'mid', input: 0.75, output: 3.75, cachedInput: 0.075, source: GOOGLE_PRICING },
    { model: 'gemini-3.1-pro-preview', tier: 'top', input: 2, output: 12, cachedInput: 0.2, source: GOOGLE_PRICING },
  ],
  'open-weight': [
    { model: 'gpt-oss-120b on Workers AI', tier: 'mid', input: 0.35, output: 0.75, cachedInput: null, source: WORKERS_AI_PRICING },
  ],
};

/** The heavier-use seat builders sit on: the dearest premium seat among the chosen providers, else the standard seat. */
export function builderSeatPrice(providers: readonly ProviderId[]): number {
  return Math.max(0, ...providers.map((p) => SEAT_PRICES[p].premiumUsd ?? SEAT_PRICES[p].usd));
}

export function midTier(provider: ProviderId): TokenPrice {
  const row = TOKEN_PRICES[provider].find((p) => p.tier === 'mid');
  if (!row) throw new Error(`No mid-tier price for ${provider}`);
  return row;
}

/**
 * Display currency conversion: a fixed rate stored with the price version, so a
 * stored result always renders the same. USD is the model currency.
 */
export const FX = {
  readOn: '2026-10-12',
  source: { label: 'ECB euro foreign exchange reference rates, 2026-10-12 (USD 1.1181, GBP 0.84478 per EUR)', url: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml' },
  /** Units of the currency per 1 USD: 1 / 1.1181 and 0.84478 / 1.1181. */
  perUsd: { USD: 1, EUR: 0.89437, GBP: 0.75555 } satisfies Record<Currency, number>,
};
