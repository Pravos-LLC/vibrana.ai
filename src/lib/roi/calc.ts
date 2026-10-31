/**
 * Workflow ROI calculator maths. Pure functions, no copy, no React.
 *
 * Ported from the generic part of an earlier calculator (task hours x share of time saved
 * x loaded hourly cost, then payback against a fixed price), with three changes:
 *  - savings are ranges (conservative and expected), never one point estimate;
 *  - percentages apply only to the hours spent on the task, never to whole jobs,
 *    headcount or payroll (KB: how-much-time-does-ai-save-by-workflow, "What not to claim");
 *  - no invented multipliers or ramp-up curve: payback is straight-line from the month the
 *    work is in use, and the page says so.
 */
import { FX } from '@/src/lib/simulator/prices';
import { HOURS_PER_WEEK, WORKING_WEEKS } from '@/src/lib/simulator/assumptions';
import { WHOLE_JOB, WORKFLOW_EVIDENCE, isWorkflowId, type WorkflowId } from './evidence';

export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];
export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value);
}

/** Sprints start from this price in US dollars (vibrana.ai #159, John 2026-10-12). */
export const SPRINT_FROM_USD = 10_000;

/** Same working-year arithmetic as the simulator and our published case studies. */
export const DEFAULT_WEEKS_PER_YEAR = WORKING_WEEKS.value;
export const DEFAULT_WORK_WEEK_HOURS = HOURS_PER_WEEK.value;

export const LIMITS = {
  people: 100_000,
  hoursPerWeek: 80,
  hourlyCost: 10_000,
  weeksPerYear: 52,
  sprintCost: 10_000_000,
  runCostPerMonth: 1_000_000,
} as const;

export interface WorkflowInput {
  id: WorkflowId;
  /** People who do this work. */
  people: number;
  /** Hours each of them spends on it in a typical week. */
  hoursPerWeek: number;
  /** Loaded cost of one hour of their time, in the chosen currency. */
  hourlyCost: number;
  /** Percent less time on the task, low end. */
  conservativePct: number;
  /** Percent less time on the task, high end. */
  expectedPct: number;
}

export interface Assumptions {
  currency: Currency;
  weeksPerYear: number;
  /** A full working week, used only for the whole-job check. */
  workWeekHours: number;
  /** What the first sprint costs, in the chosen currency. */
  sprintCost: number;
  /** What the new workflow costs to run each month (models, licenses, support), in the chosen currency. */
  runCostPerMonth?: number;
}

export interface Range {
  conservative: number;
  expected: number;
}

export interface WorkflowResult {
  id: WorkflowId;
  /** Hours a year all these people spend on the task today. */
  taskHours: number;
  hoursFreed: Range;
  /** Time value of the hours freed, in the chosen currency. Not cash saved. */
  timeValue: Range;
  /** Hours freed as a share of each person's whole working week (0 to 1). */
  shareOfWorkWeek: Range;
  /** True when the expected share is above the highest whole-job figure any occupation reports. */
  aboveWholeJobCheck: boolean;
}

export interface RoiResult {
  workflows: WorkflowResult[];
  totals: { taskHours: number; hoursFreed: Range; timeValue: Range };
  /** The workflow with the most hours freed at the high end; null when nothing is freed. */
  startWith: WorkflowId | null;
  /** The workflow with the most hours freed at the low end, when that differs; null otherwise. */
  safestBet: WorkflowId | null;
  /** Months of time value to match the sprint cost. Infinity when the value is zero. */
  paybackMonths: { fastest: number; slowest: number };
}

const finite = (n: unknown, fallback = 0) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback);
const clamp = (n: unknown, min: number, max: number, fallback = 0) => Math.min(max, Math.max(min, finite(n, fallback)));

/** Keeps every input in range, so the maths never sees a negative, a NaN or a share above 100%. */
export function sanitizeWorkflow(w: WorkflowInput): WorkflowInput {
  const conservativePct = clamp(w.conservativePct, 0, 100);
  const expectedPct = clamp(w.expectedPct, 0, 100);
  return {
    id: w.id,
    people: clamp(w.people, 0, LIMITS.people),
    hoursPerWeek: clamp(w.hoursPerWeek, 0, LIMITS.hoursPerWeek),
    hourlyCost: clamp(w.hourlyCost, 0, LIMITS.hourlyCost),
    // The low end is never above the high end, whatever order they were typed in.
    conservativePct: Math.min(conservativePct, expectedPct),
    expectedPct: Math.max(conservativePct, expectedPct),
  };
}

export function sanitizeAssumptions(a: Assumptions): Assumptions {
  return {
    currency: isCurrency(a.currency) ? a.currency : 'USD',
    weeksPerYear: clamp(a.weeksPerYear, 1, LIMITS.weeksPerYear, DEFAULT_WEEKS_PER_YEAR),
    workWeekHours: clamp(a.workWeekHours, 1, LIMITS.hoursPerWeek, DEFAULT_WORK_WEEK_HOURS),
    sprintCost: clamp(a.sprintCost, 0, LIMITS.sprintCost),
    runCostPerMonth: clamp(a.runCostPerMonth, 0, LIMITS.runCostPerMonth),
  };
}

/** A new workflow row with the KB defaults for its time saved and nothing else filled in. */
export function defaultWorkflow(id: WorkflowId): WorkflowInput {
  const e = WORKFLOW_EVIDENCE[id];
  return { id, people: 0, hoursPerWeek: 0, hourlyCost: 0, conservativePct: e.conservativePct, expectedPct: e.expectedPct };
}

/** The sprint's "from" price converted at the simulator's published ECB rate, rounded to 10. */
export function sprintFromPrice(currency: Currency): number {
  return Math.round((SPRINT_FROM_USD * FX.perUsd[currency]) / 10) * 10;
}

export function defaultAssumptions(currency: Currency = 'USD'): Assumptions {
  return { currency, weeksPerYear: DEFAULT_WEEKS_PER_YEAR, workWeekHours: DEFAULT_WORK_WEEK_HOURS, sprintCost: sprintFromPrice(currency), runCostPerMonth: 0 };
}

export function workflowResult(input: WorkflowInput, assumptions: Assumptions): WorkflowResult {
  const w = sanitizeWorkflow(input);
  const a = sanitizeAssumptions(assumptions);
  const taskHours = w.people * w.hoursPerWeek * a.weeksPerYear;
  const freed = (pct: number) => taskHours * (pct / 100);
  const share = (pct: number) => (w.hoursPerWeek * (pct / 100)) / a.workWeekHours;
  const hoursFreed = { conservative: freed(w.conservativePct), expected: freed(w.expectedPct) };
  const shareOfWorkWeek = { conservative: share(w.conservativePct), expected: share(w.expectedPct) };
  return {
    id: w.id,
    taskHours,
    hoursFreed,
    timeValue: { conservative: hoursFreed.conservative * w.hourlyCost, expected: hoursFreed.expected * w.hourlyCost },
    shareOfWorkWeek,
    aboveWholeJobCheck: w.people > 0 && shareOfWorkWeek.expected > WHOLE_JOB.highPct / 100,
  };
}

/**
 * Months of time value needed to match the cost, after the monthly running cost.
 * 0 when the cost is 0; Infinity when the net monthly value is zero or less.
 */
export function paybackMonths(cost: number, annualValue: number, runCostPerMonth = 0): number {
  const net = annualValue / 12 - Math.max(0, finite(runCostPerMonth));
  if (!(cost > 0)) return 0;
  if (!(net > 0)) return Infinity;
  return cost / net;
}

export function calculate(inputs: WorkflowInput[], assumptions: Assumptions): RoiResult {
  const a = sanitizeAssumptions(assumptions);
  const seen = new Set<WorkflowId>();
  const workflows = inputs
    .filter((w) => isWorkflowId(w.id) && !seen.has(w.id) && seen.add(w.id))
    .map((w) => workflowResult(w, a));
  const sum = (pick: (r: WorkflowResult) => number) => workflows.reduce((s, r) => s + pick(r), 0);
  const totals = {
    taskHours: sum((r) => r.taskHours),
    hoursFreed: { conservative: sum((r) => r.hoursFreed.conservative), expected: sum((r) => r.hoursFreed.expected) },
    timeValue: { conservative: sum((r) => r.timeValue.conservative), expected: sum((r) => r.timeValue.expected) },
  };
  const top = (pick: (r: WorkflowResult) => number): WorkflowId | null => {
    let id: WorkflowId | null = null;
    let best = 0;
    for (const r of workflows) {
      if (pick(r) > best) {
        best = pick(r);
        id = r.id;
      }
    }
    return id;
  };
  const startWith = top((r) => r.hoursFreed.expected);
  const lowTop = top((r) => r.hoursFreed.conservative);
  return {
    workflows,
    totals,
    startWith,
    safestBet: lowTop !== startWith ? lowTop : null,
    paybackMonths: {
      fastest: paybackMonths(a.sprintCost, totals.timeValue.expected, a.runCostPerMonth),
      slowest: paybackMonths(a.sprintCost, totals.timeValue.conservative, a.runCostPerMonth),
    },
  };
}

const SYMBOL: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£' };

export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency];
}

/** Rounds to two significant figures above 100, so the page never shows false precision. */
export function roundAbout(n: number): number {
  if (!Number.isFinite(n) || n === 0) return 0;
  const abs = Math.abs(n);
  if (abs < 100) return Math.round(n);
  const step = 10 ** (Math.floor(Math.log10(abs)) - 1);
  return Math.round(n / step) * step;
}

export function formatHours(n: number): string {
  return roundAbout(n).toLocaleString('en-US');
}

/** "$12,000", "€1.2M". Two significant figures. */
export function formatMoney(n: number, currency: Currency): string {
  const v = roundAbout(n);
  const s = SYMBOL[currency];
  if (Math.abs(v) >= 1_000_000) return `${s}${(v / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  return `${s}${v.toLocaleString('en-US')}`;
}

/** Whole-number months, at least 1 when there is any payback at all. */
export function formatMonths(n: number): string | null {
  if (!Number.isFinite(n)) return null;
  if (n === 0) return '0';
  return String(Math.max(1, Math.ceil(n)));
}
