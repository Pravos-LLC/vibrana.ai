// Evidence behind the /ai-readiness page.
//
// Every finding, case fact and client quote comes from the Vibrana knowledge base through
// scripts/readiness-evidence/sync.mjs (verified, public or anonymized only). The page copy in
// src/ai-readiness-content.ts names a finding slug next to every number; tests check that the
// number and the slug agree with this snapshot. Nothing here is written by hand.
import ledger from './evidence-ledger.json';

type LedgerFinding = {
  claim: string;
  quote: string;
  locator: string;
  url: string;
  publishable: string;
  source: { id: string; publisher: string; title: string; published: string; method: string };
};
type LedgerEngagement = { client: string; caseStudy: string; facts: string[]; quotes: string[] };

export const READINESS_FINDINGS = ledger.findings as Record<string, LedgerFinding>;
export const READINESS_ENGAGEMENTS = ledger.engagements as Record<string, LedgerEngagement>;
export const READINESS_SYNCED_FROM = ledger.syncedFrom;

export interface Citation {
  slug: string;
  url: string;
  /** e.g. "McKinsey & Company" (the parenthetical imprint is dropped for space). */
  publisher: string;
  title: string;
  year: string;
}

export function cite(slug: string): Citation {
  const f = READINESS_FINDINGS[slug];
  if (!f) throw new Error(`Finding missing from the /ai-readiness ledger snapshot: ${slug}`);
  return {
    slug,
    url: f.url,
    publisher: f.source.publisher.replace(/\s*\(.*\)\s*$/, ''),
    title: f.source.title,
    year: f.source.published.slice(0, 4),
  };
}
