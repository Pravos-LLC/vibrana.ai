// Legal citations behind /eu-ai-act-readiness, the assessment and its report.
//
// Every entry comes from the Vibrana knowledge base through scripts/eu-ai-act-evidence/sync.mjs:
// a verified finding that quotes its provision verbatim from the hub's legal corpus
// (knowledge/corpus/eu-ai-act/). Nothing here is written by hand.
import ledger from './evidence-ledger.json';

export type LegalFinding = {
  claim: string;
  quote: string;
  locator: string;
  url: string;
  corpus: string;
  source: { id: string; title: string; published: string; version: string };
};

export const EU_FINDINGS = ledger.findings as Record<string, LegalFinding>;
export const EU_SYNCED_FROM = ledger.syncedFrom;

// The short act name a citation shows, by knowledge-base source page.
const ACT_LABELS: Record<string, string> = {
  'sources/eu-2026-ai-act-consolidated-2026-07-27': 'Reg. (EU) 2024/1689',
  'sources/eu-2024-ai-act-regulation-2024-1689': 'Reg. (EU) 2024/1689',
  'sources/eu-2026-digital-omnibus-ai-regulation-2026-1744': 'Reg. (EU) 2026/1744',
  'sources/eu-2003-sme-definition-recommendation-2003-361': 'Rec. 2003/361/EC',
  'sources/eu-2025-smc-definition-recommendation-2025-1099': 'Rec. (EU) 2025/1099',
  'sources/ec-2026-draft-implementing-regulation-ai-act-75c-75d': 'Draft implementing reg. (Oct 2026)',
};

export interface LegalCitation {
  slug: string;
  url: string;
  /** Short, for source lines: "Reg. (EU) 2024/1689, Art. 26(7), as amended" */
  label: string;
  /** Full: "Reg. (EU) 2024/1689, Article 26(7) (as amended by Reg. (EU) 2026/1744)" */
  fullLabel: string;
  quote: string;
}

export function legalCite(slug: string): LegalCitation {
  const f = EU_FINDINGS[slug];
  if (!f) throw new Error(`Finding missing from the EU AI Act ledger snapshot: ${slug}`);
  const act = ACT_LABELS[f.source.id];
  if (!act) throw new Error(`No act label for source ${f.source.id}`);
  const locator = f.locator.replace(/^Draft Implementing Regulation, /, '');
  const short = locator
    .replace(/^Article /, 'Art. ')
    .replace(/ \(as amended by Reg\. \(EU\) 2026\/1744\)$/, ', as amended');
  return { slug, url: f.url, label: `${act}, ${short}`, fullLabel: `${act}, ${locator}`, quote: f.quote };
}
