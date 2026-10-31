/**
 * The website step (spec 10, request sequence 2-7): normalize, cache, budget,
 * scrape, classify, adjust the mix, cache again. Any failure returns a manual
 * result so the visitor picks a sector by hand; a bot learns nothing from it.
 * The screenshot and logo (profile/assets.ts) are stored while the classifier
 * runs; a failure there only leaves the header without an image.
 */
import type { CompanyProfile, ProfileResponse } from '../api';
import { assetPublicUrl, budgetHit, getCachedProfile, saveProfile, sweepExpiredAssets } from '../server/db';
import { storeLogo, storeScreenshot } from './assets';
import { classifierModel, classifyPage } from './classify';
import { normalizeWebsite } from './domain';
import { adjustMix } from './mix';
import { scrapeHomepage } from './scrape';

/**
 * Paid scrapes a day across all visitors; over the cap everyone gets the manual path (still a full result).
 * Default 25 matches our Firecrawl plan (1,000 credits a month); raise SIMULATOR_DAILY_SCRAPE_CAP with the plan.
 */
function cap(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isInteger(v) && v > 0 ? v : fallback;
}
export const DAILY_SCRAPE_CAP = cap('SIMULATOR_DAILY_SCRAPE_CAP', 25);
export const DAILY_CLASSIFY_CAP = cap('SIMULATOR_DAILY_CLASSIFY_CAP', 300);
/** Share of fresh profiles that also sweep expired screenshots and logos. */
const ASSET_SWEEP_RATE = 0.02;

export async function buildProfile(rawUrl: unknown): Promise<ProfileResponse> {
  const site = normalizeWebsite(rawUrl);
  if (!site) return { ok: false, reason: 'manual', domain: null };
  const manual: ProfileResponse = { ok: false, reason: 'manual', domain: site.domain };

  try {
    const cached = await getCachedProfile(site.domain);
    if (cached) return { ok: true, profile: cached };

    // Over the daily paid cap the site is still read directly (no credits, no screenshot).
    const paid = await budgetHit('scrapes', DAILY_SCRAPE_CAP);
    const page = await scrapeHomepage(site.url, { paid });
    if (!page) return manual;

    // Images are copied while the classifier runs. Neither step can throw.
    const assets = Promise.all([storeLogo(site.domain, page.iconCandidates), storeScreenshot(site.domain, page.screenshotUrl)]);

    if (!(await budgetHit('classifications', DAILY_CLASSIFY_CAP))) return manual;
    const c = await classifyPage(page.markdown);
    if (!c) return manual;
    const [logoPath, screenshotPath] = await assets;

    const profile: CompanyProfile = {
      domain: site.domain,
      sector: c.sector,
      confidence: c.confidence,
      alternatives: c.alternatives,
      functionMix: adjustMix(c.sector, c.scores),
      signals: { mentionsAi: c.mentionsAi, b2b: c.b2b },
      source: page.source,
      title: page.meta?.title ?? null,
      summary: c.summary,
      offerings: c.offerings,
      name: c.companyName,
      aiRole: c.aiRole,
      levers: c.levers,
      hqCountry: c.hqCountry,
      logoUrl: assetPublicUrl(logoPath),
      screenshotUrl: assetPublicUrl(screenshotPath),
    };
    await saveProfile(profile, classifierModel(), { logoPath, screenshotPath });
    if (Math.random() < ASSET_SWEEP_RATE) void sweepExpiredAssets();
    return { ok: true, profile };
  } catch (err) {
    console.error('[simulator] profile failed; manual path.', err instanceof Error ? err.message : err);
    return manual;
  }
}
