// The assessment's workflow module: up to three workflows the buyer names after the scored
// questions, each a type from the Workflow ROI calculator's library with people, hours a week and
// an optional hourly cost. The estimate reuses the calculator's math and evidence
// (src/lib/roi/calc.ts, src/lib/roi/evidence.ts) so both front doors give the same numbers:
// hours freed as a low-end to high-end range, and time value only when a cost was given, which is
// never cash saved. Not part of the readiness scores.
import {
  CURRENCIES,
  LIMITS,
  calculate,
  defaultAssumptions,
  defaultWorkflow,
  formatHours,
  formatMoney,
  isCurrency,
  type Currency,
  type RoiResult,
} from '@/src/lib/roi/calc';
import { WORKFLOW_EVIDENCE, WORKFLOW_IDS, isWorkflowId, type WorkflowEvidence, type WorkflowId } from '@/src/lib/roi/evidence';
import { ROI_BORROWED_EVIDENCE, ROI_WORKFLOWS } from '@/src/roi-calculator-content';

export const MAX_ASSESSMENT_WORKFLOWS = 3;

export interface AssessmentWorkflow {
  id: WorkflowId;
  /** People who do this work. */
  people: number;
  /** Hours each of them spends on it in a typical week. */
  hoursPerWeek: number;
  /** Loaded cost of one hour, in `currency`. Null when they left it blank. */
  hourlyCost: number | null;
}

export interface AssessmentWorkflows {
  currency: Currency;
  items: AssessmentWorkflow[];
}

export { CURRENCIES, WORKFLOW_IDS };

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);

/**
 * Validates what the form sent. Returns null for nothing named, 'invalid' for a malformed payload.
 * Rows with no people or no hours are dropped: they name a workflow but give nothing to estimate.
 */
export function parseAssessmentWorkflows(input: unknown): AssessmentWorkflows | null | 'invalid' {
  if (input == null) return null;
  if (typeof input !== 'object' || Array.isArray(input)) return 'invalid';
  const v = input as Record<string, unknown>;
  if (!Array.isArray(v.items) || v.items.length > MAX_ASSESSMENT_WORKFLOWS) return 'invalid';
  const currency = v.currency ?? 'USD';
  if (!isCurrency(currency)) return 'invalid';
  const seen = new Set<string>();
  const items: AssessmentWorkflow[] = [];
  for (const raw of v.items) {
    if (!raw || typeof raw !== 'object') return 'invalid';
    const r = raw as Record<string, unknown>;
    if (!isWorkflowId(r.id) || seen.has(r.id)) return 'invalid';
    seen.add(r.id);
    const people = num(r.people);
    const hoursPerWeek = num(r.hoursPerWeek);
    const cost = r.hourlyCost == null || r.hourlyCost === '' ? null : num(r.hourlyCost);
    if (!Number.isFinite(people) || people < 0 || people > LIMITS.people) return 'invalid';
    if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 0 || hoursPerWeek > LIMITS.hoursPerWeek) return 'invalid';
    if (cost !== null && (!Number.isFinite(cost) || cost < 0 || cost > LIMITS.hourlyCost)) return 'invalid';
    if (people === 0 || hoursPerWeek === 0) continue;
    items.push({ id: r.id, people: Math.round(people), hoursPerWeek, hourlyCost: cost === null || cost === 0 ? null : cost });
  }
  return items.length ? { currency, items } : null;
}

export interface WorkflowEstimateRow {
  id: WorkflowId;
  name: string;
  people: number;
  hoursPerWeek: number;
  /** Hours a year on the task today, from their own figures. */
  taskHours: number;
  hoursFreed: { conservative: number; expected: number };
  /** Null when they gave no hourly cost. */
  timeValue: { conservative: number; expected: number } | null;
  conservativePct: number;
  expectedPct: number;
  /** The range comes from a study of a different task. */
  borrowedEvidence: boolean;
  evidence: WorkflowEvidence;
  caveat: string;
}

export interface WorkflowEstimate {
  currency: Currency;
  rows: WorkflowEstimateRow[];
  /** The named workflow with the most hours freed at the high end; null when none frees any. */
  startWith: WorkflowEstimateRow | null;
  /** The workflow with the most hours freed at the low end, when that is a different one (as in the calculator). */
  safestBet: WorkflowEstimateRow | null;
  /** The working year the hours assume (the calculator's default). */
  weeksPerYear: number;
}

/** The calculator's math at its study defaults, for the workflows the buyer named. */
export function estimateAssessmentWorkflows(workflows: AssessmentWorkflows | null | undefined): WorkflowEstimate | null {
  if (!workflows || !workflows.items?.length) return null;
  const currency = isCurrency(workflows.currency) ? workflows.currency : 'USD';
  const assumptions = defaultAssumptions(currency);
  const items = workflows.items.filter((w) => isWorkflowId(w.id));
  const result: RoiResult = calculate(
    items.map((w) => ({ ...defaultWorkflow(w.id), people: w.people, hoursPerWeek: w.hoursPerWeek, hourlyCost: w.hourlyCost ?? 0 })),
    assumptions,
  );
  const rows = result.workflows.map((r): WorkflowEstimateRow => {
    const input = items.find((w) => w.id === r.id)!;
    const e = WORKFLOW_EVIDENCE[r.id];
    return {
      id: r.id,
      name: ROI_WORKFLOWS[r.id].name,
      people: input.people,
      hoursPerWeek: input.hoursPerWeek,
      taskHours: r.taskHours,
      hoursFreed: r.hoursFreed,
      timeValue: input.hourlyCost ? r.timeValue : null,
      conservativePct: e.conservativePct,
      expectedPct: e.expectedPct,
      borrowedEvidence: ROI_BORROWED_EVIDENCE.includes(r.id),
      evidence: e,
      caveat: ROI_WORKFLOWS[r.id].caveat,
    };
  });
  if (!rows.length) return null;
  return {
    currency,
    rows,
    startWith: rows.find((r) => r.id === result.startWith) ?? null,
    safestBet: rows.find((r) => r.id === result.safestBet) ?? null,
    weeksPerYear: assumptions.weeksPerYear,
  };
}

/** "120 to 290", or one figure when the ends round to the same number. */
export function formatHoursRange(range: { conservative: number; expected: number }): string {
  const low = formatHours(range.conservative);
  const high = formatHours(range.expected);
  return low === high ? low : `${low} to ${high}`;
}

export function formatMoneyRange(range: { conservative: number; expected: number }, currency: Currency): string {
  const low = formatMoney(range.conservative, currency);
  const high = formatMoney(range.expected, currency);
  return low === high ? low : `${low} to ${high}`;
}

/** The workflow lines the analysis model sees. Every number here is then allowed in its output. */
export function workflowFactsBlock(estimate: WorkflowEstimate | null): string {
  if (!estimate) return '';
  const lines = estimate.rows.map((r) => {
    const value = r.timeValue ? ` Time value of those hours (not cash saved): ${formatMoneyRange(r.timeValue, estimate.currency)} a year.` : '';
    return `- ${r.name}: ${r.people} ${r.people === 1 ? 'person' : 'people'}, ${r.hoursPerWeek} hours a week each, about ${formatHours(r.taskHours)} hours a year on the task. Range used for this type of task: ${r.conservativePct}% to ${r.expectedPct}% less time (${r.caveat.replace(/\.$/, '')}). Hours freed a year: ${formatHoursRange(r.hoursFreed)}.${value}${r.borrowedEvidence ? ' The range comes from a study of a different task.' : ''}`;
  });
  const start = estimate.startWith ? `\nThe workflow that frees the most hours at the high end: ${estimate.startWith.name}.` : '';
  return `\n\nWORKFLOWS THEY NAMED (their own estimates of people and hours, not measured; the hours freed apply published ranges for that type of task, as time, not money):\n${lines.join('\n')}${start}`;
}
