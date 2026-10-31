/**
 * The simulator engine: a pure function from inputs to a 25-month, three-scenario
 * model (spec section 8). No I/O, no randomness, no dates: the same inputs and
 * config versions always give the same result, in the browser and on the server.
 *
 * Scenarios pair benefits and costs pessimistically: conservative takes the low
 * end of every benefit and the high end of every cost; optimistic the reverse.
 */
import { BENCHMARKS_VERSION, FUNCTION_PARAMS } from './benchmarks';
import {
  ADOPTION,
  BUILD_BURST,
  BUILDER_TOKENS,
  COMPANY_BRAIN_BANDS,
  CUSTOM_PRODUCTS,
  DELIVERY,
  FEES,
  GATEWAY_FEE,
  GOVERNANCE_HOURS,
  GOVERNANCE_SETUP_HOURS,
  GOVERNANCE_TOOLS,
  HOURLY_COST,
  HOURS_PER_WEEK,
  INPUT_TOKEN_SHARE,
  OUTSOURCED_REDUCTION,
  PEOPLE_PER_WORKFLOW,
  PLAN_MONTHS,
  PROGRAM,
  PROGRAM_MONTHS,
  RUNS_PER_WORKFLOW,
  SPEND_RESERVE,
  SUPPORT_MONTHLY,
  TOKENS_PER_PERSON,
  TOKENS_PER_RUN,
  TRAINING_HOURS,
  WORKFLOW_BUILD_HOURS,
  WORKING_WEEKS,
  departmentPay,
} from './assumptions';
import { PRICES_VERSION, SEAT_PRICES, builderSeatPrice, midTier } from './prices';
import { DEFAULT_TOOLS, STACK, TOOLING, addOnCost, toolCost } from './tooling';
import { resolveReadiness, trainingHoursFor, validReadinessAnswer } from './readiness';
import { sectorById } from './sectors';
import {
  DELIVERIES,
  FUNCTIONS,
  READINESS_DIMENSIONS,
  REGIONS,
  SCENARIOS,
  type FunctionMix,
  type MonthPoint,
  type Delivery,
  type OfferCard,
  type Pace,
  type ReadinessInput,
  type ReadinessResolved,
  type Range,
  type Scenario,
  type ScenarioRun,
  type SimulatorInputs,
  type SimulatorResult,
} from './types';

export const ENGINE_VERSION = '2.3.0';
export const MONTHS = 24;
export const HEADLINE_MONTH = 12;

const MILLION = 1_000_000;

export type AdoptionCurve = { aMax: number; t0: number; k: number; beta: number };

export const ADOPTION_TARGET_MIN = 0.4;
export const ADOPTION_TARGET_MAX = 0.95;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The pace label nearest a slider value: the discrete assumptions (training hours, workflows) follow it. */
export function paceForTarget(target: number): Pace {
  if (target < 0.7) return 'cautious';
  if (target < 0.86) return 'steady';
  return 'ambitious';
}

/**
 * The adoption curve for a slider value: linear in aMax between the three calibrated
 * curves (spec 8.2), extrapolated past the ends and clamped to sane bounds. At 0.60,
 * 0.80 and 0.92 it returns the calibrated curves exactly.
 */
export function curveForTarget(target: number): AdoptionCurve {
  const pts = [ADOPTION.cautious.value, ADOPTION.steady.value, ADOPTION.ambitious.value];
  const a = clamp(target, ADOPTION_TARGET_MIN, ADOPTION_TARGET_MAX);
  const [lo, hi] = a <= pts[1].aMax ? [pts[0], pts[1]] : [pts[1], pts[2]];
  const f = (a - lo.aMax) / (hi.aMax - lo.aMax);
  const lerp = (x: number, y: number) => x + (y - x) * f;
  return {
    aMax: a,
    t0: clamp(lerp(lo.t0, hi.t0), 2, 12),
    k: clamp(lerp(lo.k, hi.k), 0.4, 0.9),
    beta: clamp(lerp(lo.beta, hi.beta), 0.02, 0.12),
  };
}

export function curveFor(inputs: Pick<SimulatorInputs, 'pace' | 'adoptionTarget'>): AdoptionCurve {
  return inputs.adoptionTarget === undefined ? ADOPTION[inputs.pace].value : curveForTarget(inputs.adoptionTarget);
}

/** a(t) = aMax / (1 + e^(-k (t - t0))) */
export function adoptionAt(pace: Pace | AdoptionCurve, t: number): number {
  const { aMax, k, t0 } = typeof pace === 'string' ? ADOPTION[pace].value : pace;
  return aMax / (1 + Math.exp(-k * (t - t0)));
}

export function normalizeMix(mix: FunctionMix): FunctionMix {
  const clean = Object.fromEntries(FUNCTIONS.map((f) => [f, Math.max(0, Number(mix[f]) || 0)])) as FunctionMix;
  const sum = FUNCTIONS.reduce((acc, f) => acc + clean[f], 0);
  if (sum <= 0) throw new Error('Function mix must have at least one positive share');
  return Object.fromEntries(FUNCTIONS.map((f) => [f, clean[f] / sum])) as FunctionMix;
}

/**
 * h_f: share of an active person's hours saved in function f.
 * Conservative uses whole-job evidence directly. Central and optimistic scale
 * task-level evidence by e_f (times the drawer's task-share multiplier), and never
 * fall below the whole-job evidence.
 */
export function hoursSavedShare(f: (typeof FUNCTIONS)[number], scenario: Scenario, taskShare = 1): number {
  const p = FUNCTION_PARAMS[f];
  if (scenario === 'conservative') return p.s.conservative;
  const e = Math.min(1, p.e * Math.max(0, taskShare));
  return Math.max(p.s.conservative, e * p.s[scenario]);
}

export function firmShareSaved(mix: FunctionMix, scenario: Scenario, taskShare = 1): number {
  return FUNCTIONS.reduce((acc, f) => acc + mix[f] * hoursSavedShare(f, scenario, taskShare), 0);
}

/** One seat per active person: the dearest seat among the chosen providers. */
export function seatPrice(providers: SimulatorInputs['providers']): number {
  return Math.max(0, ...providers.map((p) => SEAT_PRICES[p].usd));
}

/** Blended USD per 1M tokens: the chosen providers' mid tiers, averaged, weighted by input share. */
export function blendedTokenPrice(providers: SimulatorInputs['providers']): number {
  const rho = INPUT_TOKEN_SHARE.value;
  const rows = providers.map(midTier);
  const input = rows.reduce((a, r) => a + r.input, 0) / rows.length;
  const output = rows.reduce((a, r) => a + r.output, 0) / rows.length;
  return input * rho + output * (1 - rho);
}

export function workflowsAt12(headcount: number, pace: Pace): number {
  return Math.max(0, Math.round(headcount / PEOPLE_PER_WORKFLOW[pace].value));
}

function range(low: number, central: number, high: number): Range {
  return { low, central, high };
}

/** Readiness answer for one dimension: a missing answer is "not sure", scored as neutral-low. */
const answerOf = (input: ReadinessInput | undefined, d: keyof ReadinessInput) => input?.[d];

/**
 * The outside-help menu (John's prices, 2026-10-13 and 2026-10-15). A menu, never summed.
 * Prices never move with readiness; what moves is scope: how many workshops, whether a build
 * count is capped, which size band the company brain falls in, and which items are worth
 * looking at first for this baseline (research/simulator-v3/07-readiness-to-cost.md, 3c).
 */
export function offerMenu(headcount: number, pace: Pace, readiness?: ReadinessInput, dataRule: SimulatorInputs['dataRule'] = 'internal'): OfferCard[] {
  const rd = resolveReadiness(readiness);
  const known = rd.score !== null;
  const score = rd.score ?? 50;
  const bandIndex = COMPANY_BRAIN_BANDS.value.findIndex((b) => headcount <= b.maxPeople);
  const dataLow = known && (answerOf(readiness, 'data') ?? 40) <= 40;
  const brain = COMPANY_BRAIN_BANDS.value[Math.min(COMPANY_BRAIN_BANDS.value.length - 1, bandIndex + (dataLow ? 1 : 0))];
  const build = FEES.build.value;
  // Less ready companies run a longer program; more ready ones a shorter one.
  const programPace: Pace = !known ? pace : score >= 70 ? 'cautious' : score >= 40 ? 'steady' : 'ambitious';
  const program = PROGRAM.value.byPace[programPace];
  const baseBuilds = workflowsAt12(headcount, pace);
  const noAccess = known && (answerOf(readiness, 'data') === 0 || answerOf(readiness, 'technology') === 0);
  const workflows = noAccess ? Math.ceil(baseBuilds * 0.5) : baseBuilds;
  const workshops = !known ? undefined : score >= 70 ? 1 : score >= 40 ? 2 : 3;
  const govAnswer = answerOf(readiness, 'governance') ?? 40;
  const governanceFirst = known && (govAnswer <= 40 || (dataRule === 'client' && govAnswer < 70));
  return [
    { id: 'readiness-free', price: { kind: 'free' }, leads: ['john'] },
    { id: 'readiness-assessment', price: { kind: 'from', low: FEES.readinessAssessment.value.low }, leads: ['john', 'stephan', 'fatma'], ...(known && score < 60 ? { recommended: true } : {}) },
    { id: 'workshop', price: { kind: 'range', ...FEES.workshop.value }, ...(workshops ? { quantity: workshops } : {}), leads: ['john'] },
    { id: 'workflows', price: { kind: 'range', ...build, per: 'each' }, quantity: workflows, leads: ['abe'] },
    { id: 'custom-build', price: { kind: 'range', ...build, per: 'each' }, quantity: CUSTOM_PRODUCTS[pace].value, leads: ['abe'] },
    { id: 'harness', price: { kind: 'from', low: FEES.harness.value.low }, leads: ['abe'] },
    { id: 'software-factory', price: { kind: 'from', low: FEES.softwareFactory.value.low }, leads: ['abe', 'john'] },
    { id: 'company-brain', price: { kind: 'range', low: brain.low, high: brain.high }, leads: ['john', 'chetan'] },
    { id: 'governance', price: { kind: 'from', low: FEES.governance.value.low }, leads: ['stephan'], ...(governanceFirst ? { recommended: true } : {}) },
    { id: 'people-culture', price: { kind: 'quote' }, leads: ['fatma'] },
    { id: 'training-platform', price: { kind: 'from', low: FEES.trainingPlatform.value.low }, leads: ['fatma', 'abe'] },
    { id: 'program', price: { kind: 'from', low: PROGRAM.value.low }, typical: { usd: program.typical, weeks: program.weeks }, leads: ['john'] },
    { id: 'support', price: { kind: 'range', ...FEES.supportMonthly.value, per: 'month' }, leads: ['abe'] },
  ];
}

/**
 * Loaded rate by department: the company rate times each department's relative pay,
 * normalized over the mix so the mix-weighted average stays the company rate.
 */
export function hourlyByFunction(hourly: number, mix: FunctionMix, pay: FunctionMix): FunctionMix {
  const weighted = FUNCTIONS.reduce((acc, f) => acc + mix[f] * pay[f], 0);
  return Object.fromEntries(FUNCTIONS.map((f) => [f, (hourly * pay[f]) / weighted])) as FunctionMix;
}

export function simulate(inputs: SimulatorInputs): SimulatorResult {
  validateInputs(inputs);
  const o = inputs.overrides ?? {};
  const H = inputs.headcount;
  const region = o.region ?? 'us';
  const mix = normalizeMix(o.functionMix ?? inputs.classifiedMix ?? sectorById(inputs.sector).mix);
  const hourly = o.hourlyCost ?? HOURLY_COST[region][inputs.sector];
  const weeks = o.workingWeeks ?? WORKING_WEEKS.value;
  const W = (HOURS_PER_WEEK.value * weeks) / 12;
  const taskShare = o.taskShare ?? 1;
  const seat = seatPrice(inputs.providers);
  const premiumSeat = builderSeatPrice(inputs.providers);
  const toolIds = inputs.tools ?? DEFAULT_TOOLS;
  const stack = inputs.stack ?? [];
  const blend = blendedTokenPrice(inputs.providers);
  const rd = resolveReadiness(inputs.readiness);
  const baseCurve = curveFor(inputs);
  // Readiness moves the month of half adoption; the visitor's pace still owns the ceiling.
  const delivery = inputs.delivery ?? 'consultant';
  const dv = DELIVERY[delivery].value;
  const curve = { ...baseCurve, t0: clamp(baseCurve.t0 * rd.t0Multiplier * dv.t0, 2, 12), beta: baseCurve.beta * dv.builders };
  const pace = inputs.adoptionTarget === undefined ? inputs.pace : paceForTarget(inputs.adoptionTarget);
  const n12 = Math.round(workflowsAt12(H, pace) * dv.workflows);
  const beta = curve.beta;
  const trainingHoursPerPerson = trainingHoursFor(TRAINING_HOURS[pace].value, rd) * dv.training;
  const rateByFunction = hourlyByFunction(hourly, mix, departmentPay(region));
  const setupHours = GOVERNANCE_SETUP_HOURS[inputs.dataRule].value * rd.governanceMultiplier;
  const tools = GOVERNANCE_TOOLS.value;
  const outsourced = o.outsourcedAnnual && o.outsourcedAnnual > 0 ? o.outsourcedAnnual : null;

  // Training time is spread over the months people start using AI, so it sums to H x T_h.
  const a = Array.from({ length: MONTHS + 1 }, (_, t) => adoptionAt(curve, t));
  const deltas = a.map((v, t) => v - (t === 0 ? 0 : a[t - 1]));
  const deltaSum = deltas.reduce((s, d) => s + d, 0);
  const trainingHoursTotal = H * trainingHoursPerPerson;

  // Outside help: the cheaper of our program and the itemized menu this company would buy, spread over the
  // months it runs, then support through month 12. Prices are John's; quantities come from the menu shown below.
  const programPace: Pace = rd.score === null ? pace : rd.score >= 70 ? 'cautious' : rd.score >= 40 ? 'steady' : 'ambitious';
  const programInfo = PROGRAM.value.byPace[programPace];
  const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2;
  const menu = offerMenu(H, pace, inputs.readiness, inputs.dataRule);
  const qty = (id: string) => menu.find((o) => o.id === id)?.quantity ?? 0;
  const brainCard = menu.find((o) => o.id === 'company-brain')!.price;
  const planFee =
    Math.max(1, qty('workshop')) * mid(FEES.workshop.value) +
    (qty('workflows') + qty('custom-build')) * mid(FEES.build.value) +
    (brainCard.kind === 'range' ? mid(brainCard) : 0);
  const outside =
    delivery !== 'consultant'
      ? null
      : programInfo.typical <= planFee
        ? { kind: 'program' as const, fee: programInfo.typical, months: PROGRAM_MONTHS[programInfo.weeks] ?? 3, weeks: programInfo.weeks }
        : { kind: 'plan' as const, fee: planFee, months: PLAN_MONTHS.value, weeks: null };
  const feesAt = (t: number, scenario: Scenario) => {
    if (!outside) return 0;
    const building = t >= 1 && t <= outside.months ? outside.fee / outside.months : 0;
    const support = t > outside.months && t <= HEADLINE_MONTH ? SUPPORT_MONTHLY[scenario].value : 0;
    return building + support;
  };
  const buildHoursPerWorkflow = WORKFLOW_BUILD_HOURS[delivery].value;

  const runScenario = (scenario: Scenario): ScenarioRun => {
    const h = Object.fromEntries(FUNCTIONS.map((f) => [f, hoursSavedShare(f, scenario, taskShare) * dv.gains])) as FunctionMix;
    const perPersonTokens = TOKENS_PER_PERSON[scenario].value;
    const g = GOVERNANCE_HOURS[scenario].value;
    const r = OUTSOURCED_REDUCTION[scenario].value;

    const months: MonthPoint[] = a.map((at, t) => {
      const active = H * at;
      const hoursByFunction = Object.fromEntries(FUNCTIONS.map((f) => [f, H * mix[f] * W * h[f] * at])) as FunctionMix;
      const hoursFreed = FUNCTIONS.reduce((s, f) => s + hoursByFunction[f], 0);
      const valueByFunction = Object.fromEntries(FUNCTIONS.map((f) => [f, hoursByFunction[f] * rateByFunction[f]])) as FunctionMix;
      const capacityValue = FUNCTIONS.reduce((s, f) => s + valueByFunction[f], 0);
      const workflows = (n12 * t) / HEADLINE_MONTH;
      const builders = H * beta * at;
      const newWorkflows = n12 / HEADLINE_MONTH;
      const gateway = GATEWAY_FEE[scenario].value;
      const seats = active * seat;
      const usage = active * Math.min(Math.max(0, inputs.cap - seat), (perPersonTokens / MILLION) * blend);
      const builderTokens = builders * BUILDER_TOKENS[scenario].value;
      // Each new workflow costs a burst of model spend in the month it is built (months 1 to 12 ramp it in).
      const burst = t >= 1 && t <= HEADLINE_MONTH ? newWorkflows * BUILD_BURST[scenario].value : 0;
      const builderCost = builders * (premiumSeat - seat) + builderTokens + burst;
      const agents = ((workflows * RUNS_PER_WORKFLOW.value * TOKENS_PER_RUN.value * blend) / MILLION) * (1 + gateway);
      const tooling = toolIds.reduce((sum, id) => sum + toolCost(TOOLING[id], scenario, builders), 0);
      const addOns = addOnCost(stack, active, builders);
      const reserve = (usage + builderTokens + burst + agents) * SPEND_RESERVE[scenario].value;
      const governance = (g * H * hourly) / 100 + tools;
      const governanceSetup = t === 1 || t === 2 ? (setupHours * hourly) / 2 : 0;
      const trainingTime = deltaSum > 0 ? (trainingHoursTotal * hourly * deltas[t]) / deltaSum : 0;
      return {
        month: t,
        adoption: at,
        builders,
        workflows,
        hoursFreed,
        capacityValue,
        cashSaving: outsourced === null ? null : (outsourced / 12) * r * at,
        costs: { seats, builders: builderCost, usage, agents, tooling, addOns, reserve, governance, trainingTime, governanceSetup, outsideFees: feesAt(t, scenario), buildTime: t >= 1 && t <= HEADLINE_MONTH ? newWorkflows * buildHoursPerWorkflow * hourly : 0 },
        runCost: seats + builderCost + usage + agents + tooling + addOns + reserve + governance,
        ceiling: inputs.cap * active,
        hoursByFunction,
        valueByFunction,
      };
    });
    // Running total of everything that is gained or spent, capacity valued at pay levels.
    let running = 0;
    const cumulativeNet = months.map((m) => {
      running += m.capacityValue + (m.cashSaving ?? 0) - m.runCost - m.costs.trainingTime - m.costs.governanceSetup - m.costs.outsideFees - m.costs.buildTime;
      return running;
    });
    const firstDip = cumulativeNet.findIndex((v) => v < 0);
    const breakEven = firstDip === -1 ? 0 : (() => { const i = cumulativeNet.findIndex((v, t) => t > firstDip && v >= 0); return i === -1 ? null : i; })();
    return { scenario, shareSaved: firmShareSaved(mix, scenario, taskShare) * dv.gains, cumulativeNet, breakEven, months };
  };

  const scenarios = Object.fromEntries(SCENARIOS.map((s) => [s, runScenario(s)])) as Record<Scenario, ScenarioRun>;
  const at12 = (s: Scenario) => scenarios[s].months[HEADLINE_MONTH];

  return {
    engineVersion: ENGINE_VERSION,
    benchmarksVersion: BENCHMARKS_VERSION,
    pricesVersion: PRICES_VERSION,
    inputs,
    resolved: {
      functionMix: mix,
      hourlyCost: hourly,
      region,
      workingHoursPerMonth: W,
      seatPrice: seat,
      blendedTokenPrice: blend,
      workflowsAt12: n12,
      customProducts: CUSTOM_PRODUCTS[pace].value,
      trainingHoursPerPerson,
      governanceSetupHours: setupHours,
      governanceTools: tools,
      hourlyByFunction: rateByFunction,
      adoptionCurve: curve,
      pace,
      readiness: rd,
      delivery,
      program: outside,
    },
    scenarios,
    offers: offerMenu(H, pace, inputs.readiness, inputs.dataRule),
    trainingHours: trainingHoursTotal,
    headline: {
      hoursFreed: range(at12('conservative').hoursFreed, at12('central').hoursFreed, at12('optimistic').hoursFreed),
      capacityValue: range(at12('conservative').capacityValue, at12('central').capacityValue, at12('optimistic').capacityValue),
      runCost: range(at12('optimistic').runCost, at12('central').runCost, at12('conservative').runCost),
      ceiling: at12('central').ceiling,
      adoption: at12('central').adoption,
      trainingHours: trainingHoursTotal,
      trainingValue: trainingHoursTotal * hourly,
    },
  };
}

/** Both ways of getting there, side by side: the same company, the same everything else. */
export function compareDelivery(inputs: SimulatorInputs): Record<Delivery, SimulatorResult> {
  return { consultant: simulate({ ...inputs, delivery: 'consultant' }), diy: simulate({ ...inputs, delivery: 'diy' }) };
}

export class SimulatorInputError extends Error {}

/** Throws SimulatorInputError on anything the engine can't model. The server calls this on untrusted input. */
export function validateInputs(inputs: SimulatorInputs): void {
  const fail = (m: string) => {
    throw new SimulatorInputError(m);
  };
  if (!Number.isInteger(inputs.headcount) || inputs.headcount < 5 || inputs.headcount > 100_000) fail('headcount');
  if (!Array.isArray(inputs.providers) || inputs.providers.length === 0) fail('providers');
  const o = inputs.overrides;
  if (o?.hourlyCost !== undefined && !(o.hourlyCost > 0 && o.hourlyCost <= 1000)) fail('hourlyCost');
  if (o?.workingWeeks !== undefined && !(o.workingWeeks >= 30 && o.workingWeeks <= 52)) fail('workingWeeks');
  if (o?.outsourcedAnnual !== undefined && !(o.outsourcedAnnual >= 0 && o.outsourcedAnnual <= 1e10)) fail('outsourcedAnnual');
  if (inputs.adoptionTarget !== undefined && !(inputs.adoptionTarget >= ADOPTION_TARGET_MIN && inputs.adoptionTarget <= ADOPTION_TARGET_MAX)) fail('adoptionTarget');
  if (o?.region !== undefined && !(REGIONS as readonly string[]).includes(o.region)) fail('region');
  if (o?.taskShare !== undefined && !(o.taskShare >= 0 && o.taskShare <= 2)) fail('taskShare');
  if (inputs.delivery !== undefined && !(DELIVERIES as readonly string[]).includes(inputs.delivery)) fail('delivery');
  if (inputs.tools !== undefined && !(Array.isArray(inputs.tools) && inputs.tools.every((t) => t in TOOLING))) fail('tools');
  if (inputs.stack !== undefined && !(Array.isArray(inputs.stack) && inputs.stack.every((t) => t in STACK))) fail('stack');
  if (inputs.readiness !== undefined) {
    if (!inputs.readiness || typeof inputs.readiness !== 'object') fail('readiness');
    for (const [dim, v] of Object.entries(inputs.readiness)) {
      if (!(READINESS_DIMENSIONS as readonly string[]).includes(dim) || !validReadinessAnswer(v)) fail('readiness');
    }
  }
}
