// Research and case evidence shown next to each assessment area.
//
// Every finding comes from the Vibrana knowledge base through its publishing ledger
// (verified, public or anonymized only); see evidence-selection.json and
// scripts/assessment-evidence/sync.mjs. Nothing here is written by hand.
import selection from './evidence-selection.json';
import ledger from './evidence-ledger.json';

export interface EvidenceFinding {
  slug: string;
  claim: string;
  url: string;
  /** e.g. Boston Consulting Group, "AI at Work: Momentum Builds, but Gaps Remain" (2025) */
  sourceLabel: string;
  /** Who was studied, from the source page's method line. */
  method: string;
  /** Our caveat, e.g. that the publisher sells what it measures. */
  note?: string;
}

export interface EvidenceCase {
  label: string;
  fact: string;
  href: string;
}

export interface DimensionEvidence {
  findings: EvidenceFinding[];
  caseFact: EvidenceCase | null;
}

type LedgerFinding = (typeof ledger.findings)[keyof typeof ledger.findings];
type Selection = {
  framing: string;
  dimensions: Record<string, { findings: string[]; case?: { engagement: string; fact: string } }>;
  engagements: Record<string, { label: string; href: string }>;
  /** For sources whose title already names the publisher and year. */
  sourceLabels?: Record<string, string>;
  notes?: Record<string, string>;
};
const SELECTION = selection as Selection;
const FINDINGS = ledger.findings as Record<string, LedgerFinding>;

function toFinding(slug: string): EvidenceFinding {
  const f = FINDINGS[slug];
  if (!f) throw new Error(`Evidence finding missing from ledger snapshot: ${slug}`);
  const year = f.source.published.slice(0, 4);
  return {
    slug,
    claim: f.claim,
    url: f.url,
    sourceLabel: SELECTION.sourceLabels?.[slug] ??
      `${f.source.publisher}, "${f.source.title}"${f.source.title.includes(year) ? '' : ` (${year})`}`,
    method: f.source.method,
    note: SELECTION.notes?.[slug],
  };
}

export const FRAMING_FINDING: EvidenceFinding = toFinding(SELECTION.framing);

export function evidenceForDimension(dimension: string): DimensionEvidence | null {
  const d = SELECTION.dimensions[dimension];
  if (!d) return null;
  const engagement = d.case ? SELECTION.engagements[d.case.engagement] : null;
  return {
    findings: d.findings.map(toFinding),
    caseFact: d.case && engagement ? { label: engagement.label, fact: d.case.fact, href: engagement.href } : null,
  };
}

export const EVIDENCE_DIMENSIONS = Object.keys(SELECTION.dimensions);

/** The two lowest areas under 100: the same two the report's "Shore up" steps cover. */
export function lowestDimensions<T extends { dimension: string; score: number }>(scores: T[], count = 2): T[] {
  return scores
    .filter((d) => d.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

/** One finding from the snapshot by slug, or null when it is not in it. */
export function evidenceFindingBySlug(slug: string): EvidenceFinding | null {
  return FINDINGS[slug] ? toFinding(slug) : null;
}
