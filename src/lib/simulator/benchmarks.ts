import type { FunctionId, Scenario } from './types';

/**
 * Evidence rows and the per-function parameters the engine uses (spec 7.1, 7.2).
 * Every row was opened live on 2026-10-12 and its number confirmed in the
 * abstract, PDF or publisher record. Self-reported figures are illustrations
 * only (ILLUSTRATIONS), never parameters.
 */
export const BENCHMARKS_VERSION = '2026-10-12';
export const BENCHMARKS_READ_ON = '2026-10-12';

export type EvidenceRow = {
  id: string;
  function: string;
  effect: string;
  setting: string;
  caveat: string;
  citation: string;
  url: string;
  /** Small or negative effect: the counterweights the sources panel must always show. */
  counterweight: boolean;
};

export const EVIDENCE: readonly EvidenceRow[] = [
  {
    id: 'A',
    function: 'Customer support',
    effect: '+15% issues resolved per hour; lowest-skill quintile +36%',
    setting: '5,179 agents, field rollout',
    caveat: 'Near zero for top performers',
    citation: 'Brynjolfsson, Li and Raymond, Quarterly Journal of Economics 140(2), 2025',
    url: 'https://doi.org/10.1093/qje/qjae044',
    counterweight: false,
  },
  {
    id: 'B',
    function: 'Writing',
    effect: 'Time -40%, quality +18%',
    setting: '453 professionals, online RCT',
    caveat: 'Short, researcher-set tasks',
    citation: 'Noy and Zhang, Science, 2023',
    url: 'https://doi.org/10.1126/science.adh2586',
    counterweight: false,
  },
  {
    id: 'C',
    function: 'Consulting and analysis',
    effect: '+12.2% tasks, 25.1% faster, about 40% higher quality inside the frontier; correctness fell from 84% to 60-70% outside it',
    setting: '758 BCG consultants',
    caveat: 'The outside-the-frontier penalty is the main risk',
    citation: "Dell'Acqua et al., Organization Science 37(2), 2026",
    url: 'https://doi.org/10.1287/orsc.2025.21838',
    counterweight: false,
  },
  {
    id: 'D',
    function: 'Product innovation',
    effect: 'Time -16.4% (individuals), -12.7% (teams); quality +0.37 SD',
    setting: '776 P&G professionals, preregistered RCT',
    caveat: 'Working paper',
    citation: "Dell'Acqua et al., NBER w33641, 2025",
    url: 'https://www.nber.org/papers/w33641',
    counterweight: false,
  },
  {
    id: 'F',
    function: 'Software',
    effect: '+26.08% completed tasks (SE 10.3%)',
    setting: '4,867 developers at three firms',
    caveat: 'Noisy; juniors gain more',
    citation: 'Cui et al., Management Science, 2026',
    url: 'https://doi.org/10.1287/mnsc.2025.00535',
    counterweight: false,
  },
  {
    id: 'G',
    function: 'Software, experienced developers',
    effect: '19% slower (CI +2% to +39%); developers believed they were about 20% faster',
    setting: '16 open-source developers, 246 issues',
    caveat: 'Small sample, mature codebases',
    citation: 'METR, 2025',
    url: 'https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/',
    counterweight: true,
  },
  {
    id: 'H',
    function: 'Software, late-2025 tools',
    effect: 'Returning developers -18% (CI -38% to +9%); new -4%',
    setting: '57 developers, 800+ tasks',
    caveat: 'METR calls it a biased lower bound',
    citation: 'METR, 2026-02-24',
    url: 'https://metr.org/blog/2026-02-24-uplift-update/',
    counterweight: true,
  },
  {
    id: 'I',
    function: 'Legal',
    effect: '+50% to +130% productivity on 5 of 6 tasks',
    setting: 'Upper-level law students, RCT',
    caveat: 'Students, not practicing lawyers',
    citation: 'Schwarcz et al., 2025',
    url: 'https://repository.law.umich.edu/pub_law_archive/772',
    counterweight: false,
  },
  {
    id: 'K',
    function: 'Marketing (ad creation)',
    effect: '+50% ads per worker; better text, worse images',
    setting: '2,234 participants, RCT',
    caveat: 'Lab-to-field hybrid',
    citation: 'Ju and Aral, arXiv, 2026',
    url: 'https://arxiv.org/abs/2503.18238',
    counterweight: false,
  },
  {
    id: 'L',
    function: 'Sales, e-commerce',
    effect: 'Sales 0% to +16.3%',
    setting: 'Field RCTs on a marketplace',
    caveat: 'Revenue, not time',
    citation: 'Fang et al., arXiv, 2026',
    url: 'https://arxiv.org/abs/2510.12049',
    counterweight: false,
  },
  {
    id: 'M',
    function: 'Small-business management',
    effect: 'Average null; top performers +15%, weaker about -8%',
    setting: 'Kenyan entrepreneurs, RCT',
    caveat: 'AI can hurt weak users',
    citation: 'Otis et al., Harvard Growth Lab',
    url: 'https://www.hks.harvard.edu/centers/cid/publications/uneven-impact-generative-ai-entrepreneurial-performance',
    counterweight: true,
  },
  {
    id: 'N',
    function: 'Accounting',
    effect: 'About 8.5% of time moved off data entry; close 7.5 days faster',
    setting: '79 firms and 277 accountants',
    caveat: 'Observational, vendor data',
    citation: 'Choi and Xie, Stanford GSB working paper, 2025',
    url: 'https://www.gsb.stanford.edu/faculty-research/working-papers/human-ai-accounting-early-evidence-field',
    counterweight: false,
  },
  {
    id: 'O',
    function: 'Economy-wide, US',
    effect: 'Users save 5.4% of hours; all workers 1.4%',
    setting: 'US survey, November 2024',
    caveat: 'Self-reported',
    citation: 'Bick, Blandin and Deming, St. Louis Fed, 2025',
    url: 'https://www.stlouisfed.org/on-the-economy/2025/feb/impact-generative-ai-work-productivity',
    counterweight: true,
  },
  {
    id: 'P',
    function: 'Economy-wide, Denmark',
    effect: 'Users save 2.8-3% of hours (marketing with employer encouragement 6.8%); earnings and hours effects zero',
    setting: '25,000 workers, 7,000 workplaces',
    caveat: 'Self-reported, 2023-24 chatbots',
    citation: 'Humlum and Vestergaard, BFI working paper 2025-56',
    url: 'https://bfi.uchicago.edu/wp-content/uploads/2025/04/BFI_WP_2025-56-3.pdf',
    counterweight: true,
  },
];

export type FunctionParams = {
  /** Share of an active person's hours saved, per scenario. */
  s: Record<Scenario, number>;
  /** Share of the function's hours on tasks like those studied (central and optimistic only). */
  e: number;
  /** Evidence rows behind s, per scenario. */
  rows: Record<Scenario, string[]>;
  /** True when no study covers the function and the values are our extrapolation. */
  extrapolated: boolean;
  /** e_f is always our assumption. */
  eAssumption: true;
};

export const FUNCTION_PARAMS: Record<FunctionId, FunctionParams> = {
  support: {
    s: { conservative: 0.03, central: 0.13, optimistic: 0.26 },
    e: 0.6,
    rows: { conservative: ['P'], central: ['A'], optimistic: ['A'] },
    extrapolated: false,
    eAssumption: true,
  },
  software: {
    s: { conservative: 0, central: 0.15, optimistic: 0.21 },
    e: 0.5,
    rows: { conservative: ['G', 'H'], central: ['D'], optimistic: ['F'] },
    extrapolated: false,
    eAssumption: true,
  },
  marketing: {
    s: { conservative: 0.03, central: 0.2, optimistic: 0.4 },
    e: 0.5,
    rows: { conservative: ['P'], central: ['P', 'K'], optimistic: ['B'] },
    extrapolated: false,
    eAssumption: true,
  },
  operations: {
    s: { conservative: 0, central: 0.15, optimistic: 0.25 },
    e: 0.4,
    rows: { conservative: ['C'], central: ['D'], optimistic: ['C'] },
    extrapolated: false,
    eAssumption: true,
  },
  legal: {
    s: { conservative: 0.03, central: 0.25, optimistic: 0.45 },
    e: 0.5,
    rows: { conservative: ['P'], central: ['I'], optimistic: ['I'] },
    extrapolated: false,
    eAssumption: true,
  },
  finance: {
    s: { conservative: 0.03, central: 0.08, optimistic: 0.15 },
    e: 0.4,
    rows: { conservative: ['P'], central: ['N'], optimistic: ['N'] },
    extrapolated: true,
    eAssumption: true,
  },
  people: {
    s: { conservative: 0.03, central: 0.08, optimistic: 0.15 },
    e: 0.4,
    rows: { conservative: ['P'], central: [], optimistic: [] },
    extrapolated: true,
    eAssumption: true,
  },
  // The sales evidence (L, M) is about revenue, not time: shown as a note, never counted.
  sales: {
    s: { conservative: 0, central: 0, optimistic: 0 },
    e: 0,
    rows: { conservative: ['L', 'M'], central: ['L', 'M'], optimistic: ['L', 'M'] },
    extrapolated: false,
    eAssumption: true,
  },
};

export type Illustration = {
  id: string;
  text: string;
  status: string;
  /** Repo path or URL; never a model parameter. */
  source: string;
  selfReported: true;
};

/** Hover-only illustrations (spec 7.4). Self-reported; never parameters. */
export const ILLUSTRATIONS: readonly Illustration[] = [
  {
    id: 'proptech-client',
    text: 'Our proptech client: an estimated 7 to 11 hours a week saved per trained person; 7 people trained',
    status: 'Client estimate, published',
    source: '/case-studies/european-proptech-rag',
    selfReported: true,
  },
  {
    id: 'paddle-alma',
    text: 'Paddle: 91% company-wide adoption, 114 builders. Alma: 87% monthly active',
    status: 'Vendor-published',
    source: 'research/personas/driver-model.md',
    selfReported: true,
  },
  {
    id: 'holiday-extras',
    text: 'Holiday Extras: 500+ hours a week saved',
    status: 'Vendor-published, self-reported',
    source: 'research/personas/driver-model.md',
    selfReported: true,
  },
  {
    id: 'mit-nanda',
    text: 'MIT NANDA: 95% of the enterprise generative AI pilots it studied showed no measurable P&L return',
    status: 'Published report, scope-sensitive',
    source: 'research/personas/driver-model.md',
    selfReported: true,
  },
  {
    id: 'workslop',
    text: 'Workslop: 1 hour 56 minutes lost per instance, $186 per employee per month',
    status: 'Survey, self-reported',
    source: 'research/personas/driver-model.md',
    selfReported: true,
  },
];
