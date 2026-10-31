import { REGIONS, SECTOR_IDS, type ReadinessDimension, type Currency, type FunctionMix, type DataRule, type Pace, type Region, type Scenario, type SectorId } from './types';
import { FX, type Source } from './prices';

/**
 * Every value the engine uses that is not a study result or a price. Each one is
 * either sourced or flagged `assumption: true` (the config test enforces it).
 */
export const ASSUMPTIONS_VERSION = '2026-10-16';

type Sourced<T> = { value: T; source: Source; assumption?: false; note?: string };
type Assumed<T> = { value: T; assumption: true; note: string };
export type Param<T> = Sourced<T> | Assumed<T>;

const assumed = <T,>(value: T, note: string): Assumed<T> => ({ value, assumption: true, note });

/** Hours a week x working weeks a year / 12 months. 48 weeks matches our published case-study arithmetic. */
export const HOURS_PER_WEEK = assumed(40, 'A 40-hour week.');
export const WORKING_WEEKS = assumed(48, 'A 48-week working year, the same arithmetic as our published case studies.');

export type AdoptionCurve = { aMax: number; t0: number; k: number; beta: number };

/** Logistic adoption a(t) = aMax / (1 + e^(-k (t - t0))) and builder share beta (spec 8.2). */
export const ADOPTION: Record<Pace, Param<AdoptionCurve>> = {
  cautious: assumed({ aMax: 0.6, t0: 9, k: 0.5, beta: 0.03 }, 'Below every published company-wide rollout.'),
  steady: assumed(
    { aMax: 0.8, t0: 6, k: 0.6, beta: 0.06 },
    'Calibrated to Alma (87% monthly active) and SYXPERIANE (80%+ in 3 months), both vendor-published.',
  ),
  ambitious: assumed(
    { aMax: 0.92, t0: 3, k: 0.8, beta: 0.1 },
    'Calibrated to Paddle (91% company-wide) and Applium (90% onboarded in 29 days), both vendor-published.',
  ),
};

/** Monthly tokens per active person, by scenario: conservative takes the high end of every cost. */
export const TOKENS_PER_PERSON: Record<Scenario, Param<number>> = {
  conservative: assumed(10_000_000, 'Builder-level use: 10M tokens a month per active person.'),
  central: assumed(2_000_000, 'Regular use: 2M tokens a month per active person.'),
  optimistic: assumed(500_000, 'Light use: 0.5M tokens a month per active person.'),
};

/**
 * Monthly model spend per builder (a person who builds with coding agents). Anthropic's own docs put
 * the enterprise average at about $13 per developer per active day, $150 to $250 a month, and 90% of
 * users under $30 a day. Conservative is 20 active days at that p90 ceiling.
 */
export const BUILDER_TOKENS: Record<Scenario, Param<number>> = {
  conservative: { value: 600, source: { label: 'Anthropic, Manage costs effectively (p90 under $30 per active day)', url: 'https://code.claude.com/docs/en/costs' }, note: '20 active days at the $30 p90 ceiling.' },
  central: { value: 200, source: { label: 'Anthropic, Manage costs effectively ($150 to $250 per developer-month)', url: 'https://code.claude.com/docs/en/costs' }, note: 'The enterprise average.' },
  optimistic: assumed(100, 'Half the published average: light builders, or a mid-tier model for most work.'),
};

/** One-off model spend for each new workflow built, in the month it is built. John reports about $1,500 for a one-week build. */
export const BUILD_BURST: Record<Scenario, Param<number>> = {
  conservative: assumed(1500, 'About $1,500 for a one-week build, as John Ellison reported from a recent build. Not a published figure.'),
  central: assumed(750, 'Half the heavy-build figure.'),
  optimistic: assumed(200, 'A small build on a mid-tier model.'),
};

/** Spend swings: Ramp advises a 40 to 50% volatility buffer, and top spenders see 50%+ jumps about one month in four. */
export const SPEND_RESERVE: Record<Scenario, Param<number>> = {
  conservative: { value: 0.5, source: { label: 'Ramp, How much do AI tokens cost businesses', url: 'https://ramp.com/blog/ai-token-cost-for-businesses' }, note: 'Top of the advised 40 to 50% buffer.' },
  central: { value: 0.4, source: { label: 'Ramp, How much do AI tokens cost businesses', url: 'https://ramp.com/blog/ai-token-cost-for-businesses' }, note: 'The advised 40% buffer on variable model spend.' },
  optimistic: assumed(0.2, 'Half the advised buffer, for a steady workload with caps in place.'),
};

/** Gateway fee on workflow model spend: OpenRouter takes 5.5% on credit purchases, 0 when you bring your own key. */
export const GATEWAY_FEE: Record<Scenario, Param<number>> = {
  conservative: { value: 0.08, source: { label: 'OpenRouter pricing', url: 'https://openrouter.ai/pricing' }, note: 'Business tier, 8%.' },
  central: { value: 0.055, source: { label: 'OpenRouter pricing', url: 'https://openrouter.ai/pricing' }, note: 'Standard tier, 5.5%.' },
  optimistic: { value: 0, source: { label: 'OpenRouter pricing', url: 'https://openrouter.ai/pricing' }, note: 'Bring your own key.' },
};

export const INPUT_TOKEN_SHARE = assumed(0.8, 'Four in five tokens are input (prompts, documents), one in five output.');

/** People per automated workflow live by month 12 (spec 8.5). */
export const PEOPLE_PER_WORKFLOW: Record<Pace, Param<number>> = {
  cautious: assumed(50, 'One workflow per 50 people by month 12.'),
  steady: assumed(35, 'One workflow per 35 people by month 12.'),
  ambitious: assumed(25, 'One workflow per 25 people by month 12.'),
};
export const RUNS_PER_WORKFLOW = assumed(500, '500 runs a month per workflow.');
export const TOKENS_PER_RUN = assumed(20_000, '20,000 tokens per workflow run.');

/** Governance owner hours a month per 100 people (spec 8.5). */
export const GOVERNANCE_HOURS: Record<Scenario, Param<number>> = {
  conservative: assumed(24, '24 hours a month per 100 people.'),
  central: assumed(16, '16 hours a month per 100 people.'),
  optimistic: assumed(8, '8 hours a month per 100 people.'),
};
export const GOVERNANCE_TOOLS: Param<number> = {
  value: 200,
  source: { label: 'Cloudflare AI Gateway (core features free, logging paid)', url: 'https://developers.cloudflare.com/ai-gateway/' },
  note: 'Logging and gateway tools: $0 to $500 a month; we use $200.',
};
export const GOVERNANCE_SETUP_HOURS: Record<DataRule, Param<number>> = {
  public: assumed(20, 'One-off policy and review time when only public data reaches a model.'),
  internal: assumed(40, 'One-off policy, retention-terms and review time for internal data.'),
  client: assumed(80, 'One-off DPA review, retention terms and policy time for client data.'),
};

export const TRAINING_HOURS: Record<Pace, Param<number>> = {
  cautious: assumed(6, 'Six hours of training per person.'),
  steady: assumed(12, 'Twelve hours of training per person.'),
  ambitious: assumed(20, 'Twenty hours of training per person.'),
};

// ---------------------------------------------------------------------------
// AI readiness baseline (research/simulator-v3/07-readiness-to-cost.md)
// ---------------------------------------------------------------------------

const READINESS_NOTE =
  'Direction is evidence-backed (Cisco AI Readiness Index, IDC for Microsoft, MIT CISR, BCG; correlational, self-reported). The size of the effect is a Vibrana modeling choice, not a measured one.';

/** Weights of the six short-check answers. Shifted toward leadership, culture and talent, where the evidence is strongest. */
export const READINESS_WEIGHTS: Record<ReadinessDimension, Param<number>> = {
  leadership: assumed(0.22, 'Vibrana weighting of the short check; the full assessment weights leadership 0.20.'),
  culture: assumed(0.2, 'Vibrana weighting of the short check; the full assessment weights culture 0.15.'),
  talent: assumed(0.2, 'Vibrana weighting of the short check; the full assessment weights talent 0.15.'),
  data: assumed(0.16, 'Vibrana weighting of the short check; the full assessment weights data 0.25.'),
  governance: assumed(0.12, 'Vibrana weighting of the short check; the full assessment weights governance 0.10.'),
  technology: assumed(0.1, 'Vibrana weighting of the short check; the full assessment weights technology 0.15.'),
};
/** A "not sure" answer scores like the assessment's third option. */
export const READINESS_UNSURE = assumed(40, 'A "not sure" answer counts as 40, the same as the assessment\'s third option.');
export const READINESS_NEUTRAL = assumed(50, 'With no answers the baseline is neutral (50) and the model is unchanged.');
/** Adoption half-time t0 scales by (1 - slope x r), r from -1 to +1. */
export const READINESS_T0_SLOPE = assumed(0.3, `Plus or minus 30% on the month of half adoption. ${READINESS_NOTE}`);
/** Training hours per person scale by (1 - slope x r), never below the floor. */
export const READINESS_TRAINING_SLOPE = assumed(0.35, `Plus or minus 35% on training hours per person. ${READINESS_NOTE}`);
export const READINESS_TRAINING_FLOOR = assumed(5, 'At least five hours of training per person: BCG AI at Work 2025 finds regular use is far higher at five hours or more (correlational).');
/** One-off governance setup time: x1.0 from 70, x1.25 from 40, x1.5 below. */
export const READINESS_GOVERNANCE_STEPS = assumed(
  [
    { minScore: 70, multiplier: 1 },
    { minScore: 40, multiplier: 1.25 },
    { minScore: 0, multiplier: 1.5 },
  ],
  READINESS_NOTE,
);

/** Share of outsourced or agency spend that can fall, at full adoption (spec 8.4). */
export const OUTSOURCED_REDUCTION: Record<Scenario, Param<number>> = {
  conservative: assumed(0.1, '10% of outsourced spend at full adoption.'),
  central: assumed(0.2, '20% of outsourced spend at full adoption.'),
  optimistic: assumed(0.3, '30% of outsourced spend at full adoption.'),
};

// ---------------------------------------------------------------------------
// Delivery: do it yourself, or with outside help (research/simulator-v3/04-external-consultant-value.md)
// ---------------------------------------------------------------------------

export type DeliveryFactors = {
  /** Multiplier on the month of half adoption (above 1 is slower). */
  t0: number;
  /** Multiplier on workflows live by month 12. */
  workflows: number;
  /** Multiplier on the share of people who build. */
  builders: number;
  /** Multiplier on the hours saved per active person: the share of the gain actually captured. */
  gains: number;
  /** Multiplier on training hours per person. */
  training: number;
};

const DELIVERY_NOTE =
  'Direction: MIT NANDA found partner-led deployments reached production about twice as often as internal builds (about 67% vs 33%; preliminary, self-reported), and BCG finds most of the work is people and process. The size of each factor is a Vibrana modeling choice, not a measured effect.';

/**
 * Outside help is the calibration case: the adoption curves come from published, vendor-supported
 * rollouts. Doing it yourself is slower to start, builds fewer workflows and captures less of the gain.
 */
export const DELIVERY: Record<'diy' | 'consultant', Assumed<DeliveryFactors>> = {
  consultant: assumed({ t0: 1, workflows: 1, builders: 1, gains: 1, training: 1 }, 'The calibration case: published, vendor-supported rollouts.'),
  diy: assumed({ t0: 1.35, workflows: 0.6, builders: 0.8, gains: 0.85, training: 0.8 }, DELIVERY_NOTE),
};

/**
 * Internal hours to build one workflow. With outside help your people review and sign off; on your own they
 * build it. Capacity cost at pay levels, not cash. No published source: a Vibrana modeling choice.
 */
export const WORKFLOW_BUILD_HOURS: Record<'diy' | 'consultant', Assumed<number>> = {
  consultant: assumed(40, 'About a week of one person\'s time to scope, review and accept a workflow someone else builds.'),
  diy: assumed(160, 'About a month of one person\'s time to build, test and ship a workflow without help.'),
};

/** Months the itemized outside-help plan runs before support starts. */
export const PLAN_MONTHS = assumed(6, 'Workshops, builds and the company brain land over the first six months, then support.');

/** Months a program of each length runs. The fee is spread evenly across them. */
export const PROGRAM_MONTHS: Record<string, number> = { '6': 2, '12': 3, '24 to 36': 7 };

/** Monthly support after the program, through month 12. Pessimistic scenario takes the top of John's range. */
export const SUPPORT_MONTHLY: Record<Scenario, Assumed<number>> = {
  conservative: assumed(7_000, 'Top of the $3k to $7k a month support range (John Ellison, 2026-10-13).'),
  central: assumed(5_000, 'Middle of the $3k to $7k a month support range (John Ellison, 2026-10-13).'),
  optimistic: assumed(3_000, 'Bottom of the $3k to $7k a month support range (John Ellison, 2026-10-13).'),
};

/** Custom builds (prototype to production) by pace. */
export const CUSTOM_PRODUCTS: Record<Pace, Param<number>> = {
  cautious: assumed(0, 'No custom build at a cautious pace.'),
  steady: assumed(1, 'One custom build at a steady pace.'),
  ambitious: assumed(2, 'Two custom builds at an ambitious pace.'),
};

// ---------------------------------------------------------------------------
// Outside support (spec 8.6, prices set by John on 2026-10-13)
// ---------------------------------------------------------------------------

const JOHN_2026_10_13 = 'Vibrana price ranges set by John Ellison, 2026-10-13; quoted per scope.';
const JOHN_2026_10_15 = 'Vibrana price set by John Ellison, 2026-10-15; quoted per scope.';

export const FEES = {
  workshop: assumed({ low: 3_000, high: 5_000 }, JOHN_2026_10_13),
  /** Per workflow and per custom build. */
  build: assumed({ low: 10_000, high: 25_000 }, JOHN_2026_10_13),
  supportMonthly: assumed({ low: 3_000, high: 7_000 }, JOHN_2026_10_13),
  /** The paid, comprehensive readiness assessment (the free one stays free). */
  readinessAssessment: assumed({ low: 10_000 }, JOHN_2026_10_15),
  /** Governance and compliance strategy: EU AI Act, policy, controls. */
  governance: assumed({ low: 15_000 }, JOHN_2026_10_15),
  /**
   * Training platform: entry price. The full model is a base, a per-learner fee and live weeks
   * (src/curriculum-content.ts: base from $30k, $250 to $600 per learner, from $2k per live week).
   */
  trainingPlatform: assumed({ low: 25_000 }, 'Vibrana entry price set by John Ellison, 2026-10-16; the full model is a base, a per-learner fee and live weeks, quoted per scope.'),
  /** Custom harness development. */
  harness: assumed({ low: 10_000 }, 'Vibrana price set by John Ellison, 2026-10-16; quoted per scope.'),
  /** AI Software Factory: includes the training product, design, and engineers learning to build this way. */
  softwareFactory: assumed({ low: 25_000 }, 'Vibrana price set by John Ellison, 2026-10-16; quoted per scope.'),
};

/**
 * Company brain: from $25k, scaling with company size up to $250k. The band
 * edges are our assumption inside John's range.
 */
export const COMPANY_BRAIN_BANDS = assumed(
  [
    { maxPeople: 49, low: 25_000, high: 40_000 },
    { maxPeople: 149, low: 25_000, high: 75_000 },
    { maxPeople: 299, low: 40_000, high: 125_000 },
    { maxPeople: 499, low: 60_000, high: 175_000 },
    { maxPeople: Infinity, low: 100_000, high: 250_000 },
  ],
  `${JOHN_2026_10_13} From $25k to about $250k by company size; the size bands are our assumption.`,
);

/**
 * The whole program as one engagement: from $120k (about 6 weeks) through about
 * $250k (12 weeks) to about $500k (24 to 36 weeks). Shown as an alternative,
 * never added to the itemized total.
 */
export const PROGRAM = assumed(
  {
    low: 120_000,
    high: 500_000,
    byPace: {
      cautious: { typical: 120_000, weeks: '6' },
      steady: { typical: 250_000, weeks: '12' },
      ambitious: { typical: 500_000, weeks: '24 to 36' },
    } satisfies Record<Pace, { typical: number; weeks: string }>,
  },
  JOHN_2026_10_13,
);

// ---------------------------------------------------------------------------
// Loaded hourly cost (spec open question 6: a cited public source per region)
// ---------------------------------------------------------------------------

export type HourlyCostSource = Source & { period: string; measure: string };

export const HOURLY_COST_SOURCES: Record<Region, HourlyCostSource> = {
  us: {
    label: 'US Bureau of Labor Statistics, Employer Costs for Employee Compensation, Table 4 (private industry by industry)',
    url: 'https://www.bls.gov/news.release/ecec.t04.htm',
    period: 'June 2026',
    measure: 'Total compensation (wages and benefits) per hour worked, all employees in the industry.',
  },
  eu: {
    label: 'Eurostat, labour cost levels by NACE Rev. 2 activity (lc_lci_lev), EU-27',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/lc_lci_lev/default/table?lang=en',
    period: '2025 (Eurostat estimate)',
    measure: 'Total hourly labour cost, all employees, enterprises with 10 or more employees.',
  },
  de: {
    label: 'Eurostat, labour cost levels by NACE Rev. 2 activity (lc_lci_lev), Germany',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/lc_lci_lev/default/table?lang=en',
    period: '2025 (Eurostat estimate)',
    measure: 'Total hourly labour cost, all employees, enterprises with 10 or more employees.',
  },
  fr: {
    label: 'Eurostat, labour cost levels by NACE Rev. 2 activity (lc_lci_lev), France',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/lc_lci_lev/default/table?lang=en',
    period: '2025 (Eurostat estimate; public administration, education and health 2020)',
    measure: 'Total hourly labour cost, all employees, enterprises with 10 or more employees.',
  },
  nl: {
    label: 'Eurostat, labour cost levels by NACE Rev. 2 activity (lc_lci_lev), Netherlands',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/lc_lci_lev/default/table?lang=en',
    period: '2024 by sector (Eurostat estimate)',
    measure: 'Total hourly labour cost, all employees, enterprises with 10 or more employees.',
  },
  uk: {
    label: 'ONS Annual Survey of Hours and Earnings, Table 4.5a (mean gross hourly pay by industry), uplifted by the Eurostat 2016 UK ratio of total labour cost to wages',
    url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/industry2digitsicashetable4',
    period: 'April 2025 pay, 2016 uplift',
    measure:
      'Derived: mean gross hourly pay times the sector ratio of total labour cost to wages. Probably runs low: the uplift predates the April 2025 employer National Insurance rise and pay is per paid hour.',
  },
};

/**
 * Loaded hourly cost in local currency, by region and sector: the all-employee
 * average for the closest industry row. Office roles usually cost more, so the
 * drawer lets the visitor set their own rate.
 */
export const HOURLY_COST_LOCAL: Record<Region, Record<SectorId, number>> = {
  // ECEC rows: professional, scientific and technical services; finance and insurance; insurance carriers;
  // real estate and rental and leasing; information; PST (includes advertising); retail trade; health care and
  // social assistance; manufacturing; educational services; state and local government (Table 3); private industry.
  us: {
    'professional-services': 75.97,
    'financial-services': 73.92,
    insurance: 69.22,
    'real-estate': 43.53,
    software: 84.28,
    'marketing-media': 75.97,
    'ecommerce-retail': 27.07,
    healthcare: 49.93,
    'manufacturing-logistics': 48.62,
    education: 55.85,
    'public-nonprofit': 66.45,
    other: 46.89,
  },
  // NACE sections M, K, K, L, J, M, G, Q, C, P, O, and the business economy excluding public administration.
  eu: {
    'professional-services': 48.1,
    'financial-services': 58.6,
    insurance: 58.6,
    'real-estate': 36.1,
    software: 48.2,
    'marketing-media': 48.1,
    'ecommerce-retail': 29.5,
    healthcare: 35.3,
    'manufacturing-logistics': 35.0,
    education: 36.9,
    'public-nonprofit': 37.1,
    other: 34.9,
  },
  // Same NACE mapping as the EU-27 row.
  de: {
    'professional-services': 60.4,
    'financial-services': 69.7,
    insurance: 69.7,
    'real-estate': 47.5,
    software: 58.5,
    'marketing-media': 60.4,
    'ecommerce-retail': 37.2,
    healthcare: 41.7,
    'manufacturing-logistics': 49.5,
    education: 47.0,
    'public-nonprofit': 46.7,
    other: 45.0,
  },
  fr: {
    'professional-services': 55.8,
    'financial-services': 70.5,
    insurance: 70.5,
    'real-estate': 46.9,
    software: 59.2,
    'marketing-media': 55.8,
    'ecommerce-retail': 38.1,
    healthcare: 34.4,
    'manufacturing-logistics': 47.1,
    education: 45.3,
    'public-nonprofit': 38.2,
    other: 44.3,
  },
  nl: {
    'professional-services': 55.2,
    'financial-services': 67.3,
    insurance: 67.3,
    'real-estate': 52.8,
    software: 58.0,
    'marketing-media': 55.2,
    'ecommerce-retail': 38.5,
    healthcare: 48.5,
    'manufacturing-logistics': 47.3,
    education: 54.8,
    'public-nonprofit': 60.0,
    other: 47.9,
  },
  // SIC sections M, K, 65, L, J, 73, G, Q, C, P, O, and all employees.
  uk: {
    'professional-services': 34.26,
    'financial-services': 47.68,
    insurance: 40.73,
    'real-estate': 26.76,
    software: 36.46,
    'marketing-media': 38.09,
    'ecommerce-retail': 21.8,
    healthcare: 26.39,
    'manufacturing-logistics': 26.54,
    education: 30.11,
    'public-nonprofit': 30.05,
    other: 27.85,
  },
};

export const REGION_CURRENCY: Record<Region, Currency> = { us: 'USD', eu: 'EUR', uk: 'GBP', de: 'EUR', fr: 'EUR', nl: 'EUR' };

const EU27 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

/** Cost region for a company's headquarters country (ISO 3166-1 alpha-2). Null when we have no source for it. */
export function regionForCountry(iso: string | null | undefined): Region | null {
  const c = (iso ?? '').toUpperCase();
  if (c === 'US') return 'us';
  if (c === 'GB' || c === 'UK') return 'uk';
  if (c === 'DE') return 'de';
  if (c === 'FR') return 'fr';
  if (c === 'NL') return 'nl';
  if (EU27.includes(c)) return 'eu';
  return null;
}

// ---------------------------------------------------------------------------
// Pay by department (product costs more than customer support)
// ---------------------------------------------------------------------------

/**
 * Each department's mean hourly wage relative to the all-occupation mean. The
 * engine applies them mix-weighted, so a company's average rate stays the sector
 * figure above and only the split across departments changes.
 */
export const DEPARTMENT_PAY: Record<'us' | 'uk', Param<FunctionMix>> = {
  us: {
    value: { support: 0.67, sales: 1.18, marketing: 1.28, operations: 1.16, finance: 1.36, legal: 2.0, people: 1.18, software: 2.12 },
    source: { label: 'US BLS Occupational Employment and Wage Statistics, May 2025, national mean hourly wage by occupation', url: 'https://www.bls.gov/oes/current/oes_nat.htm' },
    note: 'Customer service representatives 43-4051; sales representatives 41-4012; market research and marketing specialists 13-1161; operations an even blend of project management specialists 13-1082 and office and administrative support 43-0000 (the blend is our assumption); accountants and auditors 13-2011; legal occupations 23-0000; human resources specialists 13-1071; software developers 15-1252; all occupations 00-0000.',
  },
  uk: {
    value: { support: 0.67, sales: 1.23, marketing: 1.02, operations: 1.07, finance: 1.23, legal: 1.43, people: 0.88, software: 1.4 },
    source: { label: 'ONS Annual Survey of Hours and Earnings 2025 provisional, Table 14.5a (mean gross hourly pay by SOC 2020 occupation)', url: 'https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14' },
    note: 'Also used for EU countries: Eurostat earnings data only splits occupations into broad groups, and its spread matches the UK more closely than the US.',
  },
};

export function departmentPay(region: Region): FunctionMix {
  return (region === 'us' ? DEPARTMENT_PAY.us : DEPARTMENT_PAY.uk).value;
}

/** Loaded hourly cost by region and sector, in USD (the engine's currency), at the stored FX rate. */
export const HOURLY_COST: Record<Region, Record<SectorId, number>> = Object.fromEntries(
  REGIONS.map((region) => [
    region,
    Object.fromEntries(
      SECTOR_IDS.map((sector) => [
        sector,
        Math.round((HOURLY_COST_LOCAL[region][sector] / FX.perUsd[REGION_CURRENCY[region]]) * 100) / 100,
      ]),
    ),
  ]),
) as Record<Region, Record<SectorId, number>>;
