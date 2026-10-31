import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { CompanyProfile } from '@/src/lib/simulator/api';

// The simulator routes. Storage (src/lib/simulator/server/db) is faked; the real form
// guard, SSRF check, scrape trimming, classifier validation and engine run. fetch is
// mocked for Firecrawl and OpenRouter.
process.env.FIRECRAWL_API_KEY = 'fc-test';
process.env.OPENROUTER_API_KEY = 'or-test';

const assets = vi.hoisted(() => ({ logo: null as string | null, screenshot: null as string | null, html: null as string | null, calls: [] as unknown[][] }));
vi.mock('@/src/lib/simulator/profile/assets', () => ({
  storeLogo: async (...args: unknown[]) => {
    assets.calls.push(['logo', ...args]);
    return assets.logo;
  },
  storeScreenshot: async (...args: unknown[]) => {
    assets.calls.push(['screenshot', ...args]);
    return assets.screenshot;
  },
  fetchPublicHtml: async (url: string) => (assets.html ? { html: assets.html, url } : null),
}));

const leads = vi.hoisted(() => ({ saved: [] as Record<string, unknown>[], tasks: [] as Array<() => Promise<void>> }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  after: (task: () => Promise<void>) => leads.tasks.push(task),
}));
vi.mock('@/src/lib/assessment/db', () => ({
  saveLead: async (lead: Record<string, unknown>) => {
    leads.saved.push(lead);
    return { success: true };
  },
}));

const store = vi.hoisted(() => ({
  cached: null as CompanyProfile | null,
  budget: true,
  saved: [] as CompanyProfile[],
  runs: [] as Record<string, unknown>[],
  deleteOutcome: 'deleted' as 'deleted' | 'not-found' | 'forbidden',
  shares: [] as string[],
}));

vi.mock('@/src/lib/simulator/server/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/src/lib/simulator/server/db')>();
  return {
    ...real,
    getCachedProfile: async () => store.cached,
    saveProfile: async (p: CompanyProfile) => {
      store.saved.push(p);
    },
    budgetHit: async (kind: string) => (kind === 'scrapes' ? store.budget : true),
    createRun: async (input: Record<string, unknown>) => {
      store.runs.push(input);
      return { slug: 'abcdefghij', ownerToken: 'owner-token' };
    },
    deleteRun: async () => store.deleteOutcome,
    recordShare: async (slug: string) => {
      store.shares.push(slug);
      return true;
    },
  };
});

const profileRoute = await import('@/app/api/simulator/profile/route');
const runsRoute = await import('@/app/api/simulator/runs/route');
const runRoute = await import('@/app/api/simulator/runs/[slug]/route');
const shareRoute = await import('@/app/api/simulator/runs/[slug]/share/route');

const fetchMock = vi.fn<typeof fetch>();

function post(handler: (req: NextRequest) => Promise<Response>, body: unknown) {
  return handler(new NextRequest('http://localhost/api/x', { method: 'POST', body: JSON.stringify(body) }));
}

const PAGE = '# Acme Insurance\n\nHome, car and pet insurance for families. Get a quote in 90 seconds. Claims handled by our team.\n'.repeat(5);

function classifierReply(content: unknown) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }], usage: { cost: 0.0001 } }));
}

const GOOD = {
  sector: 'insurance',
  confidence: 0.9,
  alternatives: ['financial-services', 'insurance', 'other'],
  scores: { support: 0.8, sales: 0.5, marketing: 0.5, operations: 0.5, finance: 0.5, legal: 0.5, people: 0.5, software: 0.5 },
  mentions_ai: false,
  b2b: false,
  summary: 'Home, car and pet insurance for families. Visit https://acme.example or mail hi@acme.example today.',
  offerings: ['Home insurance', 'Car insurance', 'Pet insurance', 'Travel insurance'],
  hq_country: 'gb',
  company_name: 'Acme Insurance',
  ai_role: 'Insurance margins live in quote speed and claims handling. AI shortens both. See https://acme.example for more.',
  levers: ['Faster quotes for brokers', 'Claims triage without analyst hours', 'Renewal outreach at scale', 'A fourth lever'],
};

function route(firecrawl: Response | null, ...classifier: Response[]) {
  fetchMock.mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes('firecrawl')) return firecrawl ?? new Response('{}', { status: 500 });
    if (u.includes('openrouter')) return classifier.shift() ?? new Response('{}', { status: 500 });
    throw new Error(`unexpected fetch ${u}`);
  });
}

beforeEach(() => {
  store.cached = null;
  leads.saved.length = 0;
  leads.tasks.length = 0;
  store.budget = true;
  store.saved.length = 0;
  store.runs.length = 0;
  store.shares.length = 0;
  store.deleteOutcome = 'deleted';
  assets.logo = null;
  assets.html = null;
  assets.screenshot = null;
  assets.calls.length = 0;
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  process.env.SUPABASE_URL = '';
});

describe('POST /api/simulator/profile', () => {
  const firecrawlOk = () => new Response(JSON.stringify({ data: { markdown: PAGE } }));

  it('scrapes, classifies, adjusts the mix and caches the profile', async () => {
    route(firecrawlOk(), classifierReply(GOOD));
    const res = await post(profileRoute.POST, { url: 'https://www.acme-insurance.com/x', headcount: 200, email: 'ada@acme-insurance.com' });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.profile).toMatchObject({ domain: 'acme-insurance.com', sector: 'insurance', alternatives: ['financial-services', 'other'], source: 'firecrawl' });
    expect(Object.values(body.profile.functionMix as Record<string, number>).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
    expect(store.saved).toHaveLength(1);
    const sent = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(sent.response_format.type).toBe('json_schema');
    expect(sent.provider).toEqual({ require_parameters: true, data_collection: 'deny', zdr: true });
    expect(sent.model).not.toMatch(/anthropic|claude/);
  });

  it('adds the summary, offerings, country, logo and screenshot', async () => {
    assets.logo = 'logos/acme-insurance.com.png';
    assets.screenshot = 'screens/acme-insurance.com.webp';
    const page = {
      data: {
        markdown: PAGE,
        screenshot: 'https://storage.googleapis.com/firecrawl-scrape-media/shot.png',
        rawHtml: '<html><head><link rel="apple-touch-icon" href="/apple-touch-icon.png"></head><body></body></html>',
        metadata: { title: 'Acme Insurance', url: 'https://www.acme-insurance.com/', favicon: 'https://www.acme-insurance.com/favicon.ico' },
      },
    };
    route(new Response(JSON.stringify(page)), classifierReply(GOOD));
    const body = await (await post(profileRoute.POST, { url: 'acme-insurance.com', headcount: 200, email: 'ada@acme-insurance.com' })).json();
    expect(body.profile).toMatchObject({
      title: 'Acme Insurance',
      offerings: ['Home insurance', 'Car insurance', 'Pet insurance'],
      hqCountry: 'GB',
      logoUrl: 'https://proj.supabase.co/storage/v1/object/public/simulator-screens/logos/acme-insurance.com.png',
      screenshotUrl: 'https://proj.supabase.co/storage/v1/object/public/simulator-screens/screens/acme-insurance.com.webp',
    });
    expect(body.profile.summary).not.toMatch(/https?:|@/);
    expect(body.profile.summary.length).toBeLessThanOrEqual(200);
    expect(body.profile.name).toBe('Acme Insurance');
    expect(body.profile.aiRole).not.toMatch(/https?:|@/);
    expect(body.profile.aiRole.length).toBeLessThanOrEqual(320);
    expect(body.profile.levers).toEqual(['Faster quotes for brokers', 'Claims triage without analyst hours', 'Renewal outreach at scale']);
    expect(assets.calls).toContainEqual(['screenshot', 'acme-insurance.com', 'https://storage.googleapis.com/firecrawl-scrape-media/shot.png']);
    expect(assets.calls).toContainEqual([
      'logo', 'acme-insurance.com', ['https://www.acme-insurance.com/apple-touch-icon.png', 'https://www.acme-insurance.com/favicon.ico'],
    ]);
    const sent = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(sent.response_format.json_schema.schema.required).toEqual(expect.arrayContaining(['summary', 'offerings', 'hq_country']));
  });

  it('still classifies when the images fail', async () => {
    route(new Response(JSON.stringify({ data: { markdown: PAGE } })), classifierReply({ ...GOOD, hq_country: '' }));
    const body = await (await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' })).json();
    expect(body.ok).toBe(true);
    expect(body.profile).toMatchObject({ logoUrl: null, screenshotUrl: null, hqCountry: null });
  });

  it('serves a cached profile without any paid call', async () => {
    store.cached = {
      domain: 'acme.com', sector: 'software', confidence: 0.8, alternatives: [], functionMix: GOOD.scores,
      signals: { mentionsAi: false, b2b: true }, source: 'firecrawl',
      title: null, summary: null, offerings: [], name: null, aiRole: null, levers: [], hqCountry: null, logoUrl: null, screenshotUrl: null,
    };
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' });
    expect((await res.json()).profile.sector).toBe('software');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('drops a bot to the manual path without scraping', async () => {
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com', _gotcha: 'filled' });
    expect(await res.json()).toEqual({ ok: false, reason: 'manual', domain: 'acme.com' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['http://127.0.0.1', 'http://localhost:3000', 'http://169.254.169.254/latest', 'file:///etc/passwd'])(
    'never fetches %s',
    async (url) => {
      const res = await post(profileRoute.POST, { url, headcount: 50, email: 'ada@acme.com' });
      expect(await res.json()).toEqual({ ok: false, reason: 'manual', domain: null });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('reads the site directly, spending no scrape credit, when the daily budget is spent', async () => {
    store.budget = false;
    assets.html = `<html><head><title>Acme Insurance</title></head><body>${'<p>Home, car and pet insurance for families. Get a quote in 90 seconds.</p>'.repeat(6)}</body></html>`;
    route(null, classifierReply(GOOD));
    const body = await (await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' })).json();
    expect(body.ok).toBe(true);
    expect(body.profile.source).toBe('direct');
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('firecrawl'))).toBe(false);
  });

  it('uses the manual path when the budget is spent and the site cannot be read directly', async () => {
    store.budget = false;
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' });
    expect((await res.json()).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves the visitor as a lead as soon as the step passes the guard', async () => {
    route(firecrawlOk(), classifierReply(GOOD));
    await post(profileRoute.POST, { url: 'acme-insurance.com', headcount: 200, email: 'Ada@Acme-Insurance.com' });
    await Promise.all(leads.tasks.map((t) => t()));
    expect(leads.saved).toHaveLength(1);
    expect(leads.saved[0]).toMatchObject({ email: 'ada@acme-insurance.com', company_name: 'Acme Insurance', website: 'https://acme-insurance.com', source: 'simulator' });
  });

  it('saves a lead on the pick-a-sector path without scraping', async () => {
    const res = await post(profileRoute.POST, { url: '', headcount: 40, email: 'ada@acme.com' });
    expect(await res.json()).toEqual({ ok: false, reason: 'manual', domain: null });
    await Promise.all(leads.tasks.map((t) => t()));
    expect(leads.saved[0]).toMatchObject({ email: 'ada@acme.com', website: 'https://acme.com' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or invalid email and saves nothing', async () => {
    for (const email of [undefined, 'nope']) {
      const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email });
      expect(res.status).toBe(400);
    }
    expect(leads.saved).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not save a lead for a dropped bot', async () => {
    await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com', _gotcha: 'filled' });
    await Promise.all(leads.tasks.map((t) => t()));
    expect(leads.saved).toHaveLength(0);
  });

  it('uses the manual path when the site cannot be read', async () => {
    route(new Response(JSON.stringify({ data: { markdown: 'too short' } })));
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' });
    expect((await res.json()).ok).toBe(false);
  });

  it('retries once, then uses the manual path for an off-list sector', async () => {
    route(firecrawlOk(), classifierReply({ ...GOOD, sector: 'crypto' }), classifierReply({ ...GOOD, sector: 'crypto' }));
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' });
    expect((await res.json()).ok).toBe(false);
    expect(fetchMock.mock.calls.filter(([u]) => String(u).includes('openrouter'))).toHaveLength(2);
    expect(store.saved).toHaveLength(0);
  });

  it('recovers on the retry after malformed JSON', async () => {
    route(firecrawlOk(), new Response(JSON.stringify({ choices: [{ message: { content: 'not json' } }] })), classifierReply(GOOD));
    const res = await post(profileRoute.POST, { url: 'acme.com', headcount: 50, email: 'ada@acme.com' });
    expect((await res.json()).ok).toBe(true);
  });
});

const INPUTS = {
  domain: 'acme.com',
  headcount: 200,
  sector: 'professional-services',
  providers: ['anthropic', 'google'],
  cap: 50,
  dataRule: 'internal',
  pace: 'steady',
  overrides: { hourlyCost: 60 },
};

describe('POST /api/simulator/runs', () => {
  it('re-runs the engine on the server and ignores client numbers', async () => {
    const res = await post(runsRoute.POST, { inputs: { ...INPUTS, result: { fake: true } }, companyName: 'Acme', result: { headline: 'forged' } });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ slug: 'abcdefghij', ownerToken: 'owner-token' });
    const saved = store.runs[0] as { inputs: Record<string, unknown>; result: { headline: { runCost: { central: number } } }; companyName: string | null };
    expect(saved.inputs).not.toHaveProperty('result');
    expect(Math.round(saved.result.headline.runCost.central)).toBe(11589);
    expect(saved.companyName).toBe('Acme');
  });

  it('shares with the company profile by default: no opt-in flag, the name falls back to the cached profile', async () => {
    store.cached = { name: 'Acme Insurance' } as unknown as CompanyProfile;
    await post(runsRoute.POST, { inputs: { ...INPUTS, domain: 'acme-insurance.com' } });
    const saved = store.runs[0] as { showCompanyName: boolean; companyName: string };
    expect(saved.showCompanyName).toBe(true);
    expect(saved.companyName).toBe('Acme Insurance');
  });

  it.each([
    { ...INPUTS, headcount: 3 },
    { ...INPUTS, sector: 'crypto' },
    { ...INPUTS, providers: ['anthropic', 'evil'] },
    { ...INPUTS, cap: 75 },
    { ...INPUTS, overrides: { hourlyCost: 5000 } },
  ])('rejects inputs it cannot model (%#)', async (inputs) => {
    const res = await post(runsRoute.POST, { inputs });
    expect(res.status).toBe(400);
    expect(store.runs).toHaveLength(0);
  });
});

describe('DELETE /api/simulator/runs/<slug> and share', () => {
  const del = (slug: string) =>
    runRoute.DELETE(new NextRequest(`http://localhost/api/simulator/runs/${slug}`, { method: 'DELETE', headers: { 'x-owner-token': 't' } }), {
      params: Promise.resolve({ slug }),
    });

  it('maps outcomes to 204 / 403 / 404', async () => {
    expect((await del('abcdefghij')).status).toBe(204);
    store.deleteOutcome = 'forbidden';
    expect((await del('abcdefghij')).status).toBe(403);
    store.deleteOutcome = 'not-found';
    expect((await del('abcdefghij')).status).toBe(404);
  });

  it('counts a share', async () => {
    const res = await shareRoute.POST(new NextRequest('http://localhost/x', { method: 'POST' }), { params: Promise.resolve({ slug: 'abcdefghij' }) });
    expect(res.status).toBe(204);
    expect(store.shares).toEqual(['abcdefghij']);
  });
});
