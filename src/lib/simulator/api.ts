/**
 * Wire contracts between the simulator UI and its routes. Types only, so both the
 * client bundle and the server import it freely.
 *
 *   POST   /api/simulator/profile              ProfileRequest  -> ProfileResponse
 *   POST   /api/simulator/runs                 CreateRunRequest -> CreateRunResponse
 *   POST   /api/simulator/runs/<slug>/share    (no body)       -> 204, counts a share
 *   DELETE /api/simulator/runs/<slug>          header x-owner-token -> 204; the link then returns 410
 *   POST   /api/assessment-leads               LeadRequest (source 'simulator') -> { success }
 */
import type { FunctionMix, SectorId, SimulatorInputs, SimulatorResult } from './types';

/** Guard fields (_gotcha, _ft) are spread in from useFormGuard().payload(). */
export type ProfileRequest = {
  url: string;
  headcount: number;
  [guardField: string]: unknown;
};

export type CompanyProfile = {
  /** Timestamp of classification, including when this profile came from cache. */
  researchedAt?: string;
  domain: string;
  sector: SectorId;
  confidence: number;
  /** Next-best sectors, shown as choices when confidence is below 0.5. */
  alternatives: SectorId[];
  functionMix: FunctionMix;
  signals: { mentionsAi: boolean; b2b: boolean };
  source: 'firecrawl' | 'browser_run' | 'direct';
  /** The homepage title. Null on profiles cached before v2. */
  title: string | null;
  /** What the company does, at most 200 characters, written by the classifier from the homepage only. */
  summary: string | null;
  /** Up to three short noun phrases from the homepage. */
  offerings: string[];
  /** The company's name as its homepage writes it. */
  name: string | null;
  /** How AI changes the economics of this kind of business (at most 320 characters). */
  aiRole: string | null;
  /** Up to three places AI could lift profit for this company. */
  levers: string[];
  /** ISO 3166-1 alpha-2 country of the head office, when the homepage says. */
  hqCountry: string | null;
  /** Re-hosted logo in our storage bucket (public URL), or null. */
  logoUrl: string | null;
  /** Re-hosted 1280-wide homepage screenshot in our storage bucket (public URL), or null. */
  screenshotUrl: string | null;
};

/**
 * `manual` covers every failure (unreadable site, guard drop, budget spent,
 * classifier off-list): the visitor picks a sector by hand. A bot learns nothing.
 */
export type ProfileResponse =
  | { ok: true; profile: CompanyProfile }
  | { ok: false; reason: 'manual'; domain: string | null };

export type CreateRunRequest = {
  inputs: SimulatorInputs;
  showCompanyName: boolean;
  /** Display name for the share card, only stored when showCompanyName is true. */
  companyName?: string;
  [guardField: string]: unknown;
};

export type CreateRunResponse = { slug: string; ownerToken: string };

/** What /r/<slug> and the OG image read. The result is the server's own re-run, never the client's numbers. */
export type StoredRun = {
  slug: string;
  createdAt: string;
  domain: string | null;
  showCompanyName: boolean;
  companyName: string | null;
  result: SimulatorResult;
};

/** Extra fields the simulator adds to POST /api/assessment-leads. */
export type SimulatorLeadFields = {
  source: 'simulator';
  /** The run slug; the route resolves it to simulator_runs.id. Anyone viewing /r/<slug> may ask for the PDF. */
  simulatorRunSlug: string;
  /** 'plan' = email me the full model PDF; 'talk' = also notify the team for a call. */
  intent: 'plan' | 'talk';
  note?: string;
};
