// Default time-saving ranges for the Workflow ROI calculator, with their sources.
//
// Every percentage, unit and study design comes from the Vibrana knowledge base page
// knowledge/questions/how-much-time-does-ai-save-by-workflow.md through
// scripts/roi-evidence/sync.mjs, and every finding passed the hub's publishing ledger.
// Nothing here is typed by hand: edit evidence-selection.json and re-run the sync.
import ledger from './evidence-ledger.json';

export const WORKFLOW_IDS = ['support', 'documents', 'reports', 'research', 'email-crm', 'onboarding', 'software'] as const;
export type WorkflowId = (typeof WORKFLOW_IDS)[number];

export function isWorkflowId(value: unknown): value is WorkflowId {
  return typeof value === 'string' && (WORKFLOW_IDS as readonly string[]).includes(value);
}

export interface RoiFinding {
  slug: string;
  claim: string;
  url: string;
  /** e.g. "NBER Working Paper 33795 (revised November 2025), "Shifting Work Patterns with Generative AI" (2025)" */
  sourceLabel: string;
  /** Who was studied, from the source page's method line. */
  method: string;
  /** Set when the authors work for the company whose tool was studied. */
  vendorNote?: string;
}

export interface WorkflowEvidence {
  id: WorkflowId;
  /** Percent less time on the task, from the weakest credible field evidence. */
  conservativePct: number;
  /** Percent less time on the task, from the best realistic study. */
  expectedPct: number;
  /** A short lab-task result, shown only as a labeled ceiling, never used as a default. */
  ceilingPct?: number;
  /** What the percentages measure, from the KB table. */
  unit: string;
  /** Study design, from the KB table. */
  design: string;
  conservative: RoiFinding;
  expected: RoiFinding;
  ceiling?: RoiFinding;
  /** Further findings named in the KB row. */
  also: RoiFinding[];
}

type LedgerFinding = (typeof ledger.findings)[keyof typeof ledger.findings] & { vendorNote?: string };
type LedgerRow = {
  conservative: { pct: number; finding: string };
  expected: { pct: number; finding: string };
  ceiling?: { pct: number; finding: string };
  unit: string;
  design: string;
  also: string[];
};
const FINDINGS = ledger.findings as Record<string, LedgerFinding>;
const ROWS = ledger.workflows as Record<string, LedgerRow>;

/** Hub commit the snapshot was taken from. */
export const EVIDENCE_SYNCED_FROM = ledger.syncedFrom;

function toFinding(slug: string): RoiFinding {
  const f = FINDINGS[slug];
  if (!f) throw new Error(`ROI finding missing from ledger snapshot: ${slug}`);
  const year = f.source.published.slice(0, 4);
  return {
    slug,
    claim: f.claim,
    url: f.url,
    sourceLabel: `${f.source.publisher}, "${f.source.title}"${f.source.title.includes(year) || f.source.publisher.includes(year) ? '' : ` (${year})`}`,
    method: f.source.method,
    ...(f.vendorNote ? { vendorNote: f.vendorNote } : {}),
  };
}

/** The KB says conservative/expected; the page says low end/high end, so "expected" never reads as a forecast. */
const pageWords = (text: string) =>
  text
    .replace(/\bConservative:/g, 'Low end:')
    .replace(/\bExpected:/g, 'High end:')
    .replace(/\s*\(contested\)/g, '');

function toEvidence(id: WorkflowId, row: LedgerRow): WorkflowEvidence {
  return {
    id,
    conservativePct: row.conservative.pct,
    expectedPct: row.expected.pct,
    ...(row.ceiling ? { ceilingPct: row.ceiling.pct, ceiling: toFinding(row.ceiling.finding) } : {}),
    unit: pageWords(row.unit),
    design: pageWords(row.design),
    conservative: toFinding(row.conservative.finding),
    expected: toFinding(row.expected.finding),
    also: row.also.map(toFinding),
  };
}

export const WORKFLOW_EVIDENCE: Record<WorkflowId, WorkflowEvidence> = Object.fromEntries(
  WORKFLOW_IDS.map((id) => {
    const row = ROWS[id];
    if (!row) throw new Error(`ROI workflow missing from ledger snapshot: ${id}`);
    return [id, toEvidence(id, row)];
  }),
) as Record<WorkflowId, WorkflowEvidence>;

/** Self-reported time saved across a whole job (percent of all work hours), the sanity check on any total. */
export const WHOLE_JOB = {
  lowPct: ledger.wholeJob.conservative.pct,
  highPct: ledger.wholeJob.expected.pct,
  finding: toFinding(ledger.wholeJob.conservative.finding),
  average: toFinding(ledger.wholeJob.also[0]),
};

/** Why time freed is not cash saved. */
export const TIME_IS_NOT_MONEY: RoiFinding[] = ledger.timeIsNotMoney.map(toFinding);

export const CASE_FACTS = ledger.engagements as Record<string, { engagement: string; fact: string }>;
