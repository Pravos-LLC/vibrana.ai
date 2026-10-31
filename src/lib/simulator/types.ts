/**
 * Shared types for the AI Transformation Simulator (VIB-430).
 * Spec: hub gtm/simulator/SPEC.md. The engine is pure and runs in the browser
 * (instant re-runs) and on the server (stored results, OG image, PDF).
 */

export const FUNCTIONS = [
  'support',
  'sales',
  'marketing',
  'operations',
  'finance',
  'legal',
  'people',
  'software',
] as const;
export type FunctionId = (typeof FUNCTIONS)[number];

export const SECTOR_IDS = [
  'professional-services',
  'financial-services',
  'insurance',
  'real-estate',
  'software',
  'marketing-media',
  'ecommerce-retail',
  'healthcare',
  'manufacturing-logistics',
  'education',
  'public-nonprofit',
  'other',
] as const;
export type SectorId = (typeof SECTOR_IDS)[number];

export const PROVIDERS = ['anthropic', 'openai', 'google', 'open-weight'] as const;
export type ProviderId = (typeof PROVIDERS)[number];

export const CAPS = [20, 50, 100, 200, 500] as const;
export type Cap = (typeof CAPS)[number];

export const DATA_RULES = ['public', 'internal', 'client'] as const;
export type DataRule = (typeof DATA_RULES)[number];

export const PACES = ['cautious', 'steady', 'ambitious'] as const;
export type Pace = (typeof PACES)[number];

export const SCENARIOS = ['conservative', 'central', 'optimistic'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const REGIONS = ['us', 'uk', 'eu', 'de', 'fr', 'nl'] as const;
export type Region = (typeof REGIONS)[number];

/** The six dimensions of the short readiness check; each maps to a dimension of the full assessment. */
export const READINESS_DIMENSIONS = ['leadership', 'data', 'technology', 'talent', 'governance', 'culture'] as const;
export type ReadinessDimension = (typeof READINESS_DIMENSIONS)[number];
/** The assessment's four answer scores. A dimension left out means "not sure" and counts as 40. */
export const READINESS_ANSWERS = [100, 70, 40, 0] as const;
export type ReadinessAnswer = (typeof READINESS_ANSWERS)[number];
export type ReadinessInput = Partial<Record<ReadinessDimension, ReadinessAnswer>>;

export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

import type { StackId, ToolId } from './tooling';

export const DELIVERIES = ['consultant', 'diy'] as const;
export type Delivery = (typeof DELIVERIES)[number];

export type FunctionMix = Record<FunctionId, number>;

/** Optional drawer overrides. Absent means "use the sourced default". */
export type AssumptionOverrides = {
  functionMix?: FunctionMix;
  /** Loaded hourly cost in USD. */
  hourlyCost?: number;
  region?: Region;
  /** Working weeks a year (default 48). */
  workingWeeks?: number;
  /** Annual outsourced / agency spend in USD. Enables the cash-saving line. */
  outsourcedAnnual?: number;
  /**
   * Multiplier on e_f, the share of each team's time on tasks like those studied.
   * 1 (default) = about half; 0 = trial gains switched off (whole-job evidence only).
   */
  taskShare?: number;
  /** Name the visitor gives the "new work" cluster in the visual. */
  newWorkLabel?: string;
};

/** The seven inputs plus drawer overrides. */
export type SimulatorInputs = {
  /** Registrable domain, or null when the visitor skipped the website step. */
  domain: string | null;
  headcount: number;
  sector: SectorId;
  providers: ProviderId[];
  cap: Cap;
  dataRule: DataRule;
  pace: Pace;
  /**
   * Share of people using AI at full rollout, 0.40 to 0.95 (the pace slider). When set, it
   * drives the adoption curve and `pace` is derived from it; older runs only carry `pace`.
   */
  adoptionTarget?: number;
  /** Function mix suggested by the classifier for this domain, if any. */
  classifiedMix?: FunctionMix | null;
  /** Self-reported AI readiness baseline. Absent means neutral (score 50): the model is unchanged. */
  readiness?: ReadinessInput;
  /** Who delivers the rollout. Absent means with outside help, the calibration case. */
  delivery?: Delivery;
  /** The tool lines a rollout pays for. Absent means the defaults. */
  tools?: ToolId[];
  /** Work tools the company already uses; the AI add-on seat of each is priced in. */
  stack?: StackId[];
  overrides?: AssumptionOverrides;
};

export type Range = { low: number; central: number; high: number };

export type CostLines = {
  seats: number;
  /** Builders: premium seats, coding-agent tokens and the build-burst for each new workflow. */
  builders: number;
  usage: number;
  agents: number;
  /** Hosting, data, email, media and the other tools builders end up paying for. */
  tooling: number;
  /** AI add-on seats of work tools the company already uses (Slack, Notion, Copilot, ...). */
  addOns: number;
  /** Buffer for model spend that swings month to month. */
  reserve: number;
  governance: number;
  /** Training time valued at the hourly rate (capacity cost, not cash). */
  trainingTime: number;
  /** One-off governance setup time valued at the hourly rate. */
  governanceSetup: number;
  /** Outside fees spread over the build months, then monthly support through month 12. Zero when you do it yourself. */
  outsideFees: number;
  /** Your own people's hours to build and accept the workflows built that month, valued at pay levels. */
  buildTime: number;
};

export type MonthPoint = {
  month: number;
  adoption: number;
  builders: number;
  workflows: number;
  hoursFreed: number;
  capacityValue: number;
  /** Null when the visitor gave no outsourced spend. */
  cashSaving: number | null;
  costs: CostLines;
  /** seats + builders + usage + agents + tooling + add-ons + reserve + governance. */
  runCost: number;
  /** Cap x active people: the usage + seat ceiling drawn as a dashed line. */
  ceiling: number;
  hoursByFunction: FunctionMix;
  /** Capacity value by department: hours x that department's loaded rate. Sums to capacityValue. */
  valueByFunction: FunctionMix;
};

export type ScenarioRun = {
  scenario: Scenario;
  /** Running total by month: capacity and cash saved, less run cost, training, setup and outside fees. */
  cumulativeNet: number[];
  /** First month the running total is at or above zero after going below it; 0 if it never dips; null if not within 24 months. */
  breakEven: number | null;
  /** Σ m_f h_f: share of an active person's hours saved, firm-wide. */
  shareSaved: number;
  months: MonthPoint[];
};

export const TEAM = ['john', 'stephan', 'abe', 'chetan', 'fatma'] as const;
export type TeamMemberId = (typeof TEAM)[number];

export const OFFERS = [
  'readiness-free',
  'readiness-assessment',
  'workshop',
  'workflows',
  'custom-build',
  'harness',
  'software-factory',
  'company-brain',
  'governance',
  'people-culture',
  'training-platform',
  'program',
  'support',
] as const;
export type OfferId = (typeof OFFERS)[number];

/** USD. A menu, never a total: nothing here is summed. */
export type OfferPrice =
  | { kind: 'free' }
  | { kind: 'from'; low: number }
  | { kind: 'range'; low: number; high: number; per?: 'each' | 'month' }
  | { kind: 'quote' };

export type OfferCard = {
  id: OfferId;
  price: OfferPrice;
  /** How many the model assumes for this company (workflows, custom builds), where it applies. */
  quantity?: number;
  /** Program only: typical figure and length at this pace. */
  typical?: { usd: number; weeks: string };
  leads: TeamMemberId[];
  /** Our read for this company's baseline: worth looking at first. */
  recommended?: boolean;
};

export type ReadinessResolved = {
  /** 0 to 100, or null when the visitor gave no answers (neutral). */
  score: number | null;
  /** Answers given out of six. */
  answered: number;
  /** Centered index r from -1 to +1; 0 is neutral. */
  index: number;
  /** Applied to the adoption half-time (below 1 is faster). */
  t0Multiplier: number;
  /** Applied to training hours per person. */
  trainingMultiplier: number;
  /** Applied to one-off governance setup time. */
  governanceMultiplier: number;
};

export type SimulatorResult = {
  engineVersion: string;
  benchmarksVersion: string;
  pricesVersion: string;
  inputs: SimulatorInputs;
  resolved: {
    functionMix: FunctionMix;
    hourlyCost: number;
    region: Region;
    workingHoursPerMonth: number;
    seatPrice: number;
    blendedTokenPrice: number;
    workflowsAt12: number;
    customProducts: number;
    trainingHoursPerPerson: number;
    governanceSetupHours: number;
    governanceTools: number;
    /** Loaded rate by department, USD an hour; mix-weighted it averages to hourlyCost. */
    hourlyByFunction: FunctionMix;
    adoptionCurve: { aMax: number; t0: number; k: number; beta: number };
    pace: Pace;
    readiness: ReadinessResolved;
    delivery: Delivery;
    /** The outside help assumed, when chosen: the cheaper of our program and the itemized menu, and how long it runs. */
    program: { kind: 'program' | 'plan'; fee: number; months: number; weeks: string | null } | null;
  };
  scenarios: Record<Scenario, ScenarioRun>;
  /** The outside-help menu, priced for this company's size and pace. */
  offers: OfferCard[];
  /** Total training hours (H x T_h). */
  trainingHours: number;
  /** Headline values at month 12, as ranges. */
  headline: {
    hoursFreed: Range;
    /** Capacity value a month at month 12 (capacity, not cash). */
    capacityValue: Range;
    runCost: Range;
    ceiling: number;
    adoption: number;
    trainingHours: number;
    trainingValue: number;
  };
};
