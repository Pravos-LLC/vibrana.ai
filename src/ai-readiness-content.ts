// ── /ai-readiness: the AI Readiness Assessment landing page ─────────────────
// Copy is data (DESIGN.md § Page copy is data): src/views/AIReadinessPage.tsx renders these strings.
//
// Persona target: gatekeeper-coo (primary; drivers proof-hunger, governance-control,
// org-chart-threat), founder-visionary (secondary). Copy suite record in the PR that added it.
//
// Evidence rules (tests/readiness-page/evidence.test.ts enforces them):
// - Every number on this page sits in an object with a `finding` slug (research) or an
//   `engagement` slug (our own cases). The number must appear in that finding's claim or quote,
//   or verbatim in the engagement's approved facts, in src/lib/readiness-page/evidence-ledger.json.
// - Every `sample` line's numbers must appear in that source's method line or a finding from it.
// - Quotes are verbatim from a finding's quote or an engagement's Approved quotes.
// - To add a number: add its finding to evidence-selection.json, run the sync, then cite it here.

export const ASSESSMENT_HREF = '/ai-transformation/assessment'
export const CALL_HREF = 'https://calendar.app.google/2DswLVndhkpMVx7K7'

export const READINESS_CTA = {
  primary: { label: 'Take the assessment', href: ASSESSMENT_HREF },
  secondary: { label: 'Book a 30-min call', href: CALL_HREF },
} as const

export const READINESS_META = {
  title: 'AI Readiness Assessment: 24 questions, six areas, research behind your results | Vibrana',
  description:
    'Most companies cannot yet show a return on AI. See where your organization stands across six areas of readiness, with published research behind your two lowest areas.',
  ogTitle: 'AI Readiness Assessment | Vibrana',
} as const

export const READINESS_OG = {
  eyebrow: 'AI Readiness Assessment',
  headline: { lead: 'Before the next AI budget, see ', accent: 'what’s in the way.', trail: '' },
  alt: 'Vibrana AI Readiness Assessment: before the next AI budget, see what’s in the way.',
} as const

export const READINESS_HERO = {
  eyebrow: 'AI Readiness Assessment',
  headline: 'Before the next AI budget, see what’s in the way.',
  subtitle: 'Free. 24 questions about what your organization does today give you a six-area profile, not a peer rank, with research behind your two lowest areas.',
  image: {
    id: 'obj-magnifier-notes-orion',
    alt: 'A brass magnifying glass over handwritten notes on a worn desk, lit by one warm lamp',
  },
} as const

// ── 1. The problem ───────────────────────────────────────────────────────────

export interface ReadinessStat {
  value: string
  label: string
  finding: string
  /** Who was studied, in our words; numbers checked against the source's method line. */
  sample: string
  /** A finding from the same report that states the sample, when the cited one does not. */
  sampleFrom?: string
}

export const READINESS_PROBLEM = {
  heading: 'Most companies can’t yet show what AI returns.',
  intro:
    'Three large surveys, three different measures. In each one, most companies can’t yet show a return. Read them side by side, not as one trend.',
  stats: [
    {
      value: '56%',
      label: 'of CEOs say AI brought neither higher revenue nor lower costs in the past year.',
      finding: 'pwc-ceo-survey-2026-56-percent-no-ai-benefit',
      sample: '4,454 CEOs in 95 countries',
    },
    {
      value: '37%',
      label: 'of respondents attribute any EBIT impact to AI, about the same share as the year before.',
      finding: 'mckinsey-state-of-ai-2026-ebit-impact-flat',
      sample: '1,719 participants in 97 nations',
    },
    {
      value: '60%',
      label: 'of companies reap hardly any material value from AI, despite substantial investment.',
      finding: 'bcg-widening-ai-value-gap-60-percent-no-material-value',
      sample: '1,250 executives',
      sampleFrom: 'bcg-widening-ai-value-gap-2025-maturity-distribution',
    },
  ] satisfies ReadinessStat[],
  split: {
    heading: 'Where the hard part sits',
    caption: 'Share of the challenges companies face implementing AI, as BCG reports it.',
    finding: 'bcg-wheres-the-value-in-ai-70-percent-challenges-people-process',
    sample: '1,000 CxOs and senior executives in 59 countries',
    segments: [
      { value: 70, label: 'People and process' },
      { value: 20, label: 'Technology' },
      { value: 10, label: 'AI algorithms' },
    ],
    takeaway: 'Most of the hard part is people and process, not the model.',
  },
} as const

// ── 2. What separates the companies getting value ──────────────────────────

export interface GapRow {
  label: string
  leaders: number
  rest: number
  finding: string
}

export const READINESS_FACTORS = {
  heading: 'What the companies getting value do differently',
  lead: {
    text: 'Of 25 attributes McKinsey tested, redesigning workflows had the biggest effect on whether a company saw EBIT impact from gen AI. In its report published in early 2025, only 21% of respondents whose organizations use gen AI said they had fundamentally redesigned at least some workflows. In its 2026 survey, nearly three-quarters of AI high performers, a much smaller group, said the same.',
    findings: ['mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect', 'mckinsey-state-of-ai-2025-only-21-percent-redesigned', 'mckinsey-state-of-ai-2026-high-performers-redesign-workflows'],
  },
  chart: {
    title: 'Leaders and everyone else, on four practices',
    subtitle: 'Share of each group that reports the practice. Each survey defines its own leaders.',
    legend: { leaders: 'Leaders', rest: 'Comparison group' },
    tableToggle: 'Show as a table',
    chartToggle: 'Show as a chart',
    columns: { practice: 'Practice', leaders: 'Leaders', rest: 'Comparison group', source: 'Source' },
    groups: [
      {
        source: 'McKinsey',
        definition: 'Leaders are AI high performers, about 6% of respondents, who report 5% or more of EBIT from AI and significant value from it. The rest are all other respondents.',
        finding: 'mckinsey-state-of-ai-nov-2025-tech-infrastructure-60-vs-23',
        sample: '1,993 participants in 105 nations, 2025',
        rows: [
          { label: 'Infrastructure supports core AI initiatives', leaders: 60, rest: 23, finding: 'mckinsey-state-of-ai-nov-2025-tech-infrastructure-60-vs-23' },
          { label: 'More than 20% of the digital budget goes to AI', leaders: 35, rest: 7, finding: 'mckinsey-state-of-ai-nov-2025-high-performers-ai-budget-over-20-percent' },
        ],
      },
      {
        source: 'Gartner',
        definition: 'Leaders are high AI maturity organizations. The rest are low-maturity organizations.',
        finding: 'gartner-ai-maturity-2025-business-unit-trust-57-vs-14',
        sample: '432 respondents in six countries, Q4 2024',
        rows: [
          { label: 'Business units trust new AI and are ready to use it', leaders: 57, rest: 14, finding: 'gartner-ai-maturity-2025-business-unit-trust-57-vs-14' },
          { label: 'AI initiatives stay in production three years or more', leaders: 45, rest: 20, finding: 'gartner-ai-maturity-2025-45-percent-operational-three-years' },
        ],
      },
    ] satisfies { source: string; definition: string; finding: string; sample: string; rows: GapRow[] }[],
  },
  practices: [
    {
      title: 'Their leaders commit, and measure',
      body: 'High performers are twice as likely to say their senior leaders show commitment to AI, and to have defined ways to measure its impact.',
      finding: 'mckinsey-state-of-ai-2026-senior-leader-commitment',
    },
    {
      title: 'The CEO is in it personally',
      body: 'BCG reports that where the CEO personally owns the AI program, results are better on all three things it measured: value captured, employee joy and trust.',
      finding: 'bcg-ai-at-work-2026-ceo-ownership-outperforms',
    },
    {
      title: 'They track outcomes',
      body: 'Of 12 adoption practices, tracking well-defined KPIs for gen AI had the most impact on the bottom line.',
      finding: 'mckinsey-state-of-ai-2025-kpis-most-impact',
    },
    {
      title: 'People get real training',
      body: 'Regular AI use is sharply higher among people with at least five hours of training plus in-person coaching. Only a third say they were properly trained.',
      finding: 'bcg-ai-at-work-2025-five-hours-training',
    },
  ],
  caveat: {
    heading: 'No study settles how much each factor matters',
    body: 'Every link above is a correlation from surveys, mostly self-reported. McKinsey’s model of 25 attributes explains about a fifth of the variation in reported EBIT impact (an R-squared of 0.20). In its 2025 ranking, technology and data infrastructure matter but sit behind practices like workflow redesign. So our assessment gives you a profile across six areas, not a verdict on which one matters most.',
    findings: ['mckinsey-state-of-ai-2025-25-attributes-r-squared-020', 'mckinsey-state-of-ai-nov-2025-tech-data-meaningful-not-top'],
  },
} as const

// ── 3. Enterprise cases ──────────────────────────────────────────────────────

export interface EnterpriseCase {
  company: string
  reported: string
  evidence: string
  caveat: string
  lesson: string
  findings: string[]
  /** Klarna: the honest counter-case. */
  counterCase?: boolean
}

export const READINESS_CASES = {
  heading: 'What the famous AI cases actually show',
  intro:
    'Read at their primary sources, the best-known enterprise cases report adoption and task time, nearly all self-reported. None publishes an audited return on AI. Here is what each one does show, and the caveat that goes with it.',
  labels: { reported: 'What they report', evidence: 'Kind of evidence', caveat: 'The caveat', lesson: 'What to take from it', counterCase: 'The counter-case' },
  cases: [
    {
      company: 'Uber',
      reported: '16 agentic pods (two-week teams pairing engineers with a business expert) in two months. Capital allocation across 150 cities went from 15 hours to 30 minutes, and financial pacing reports from 2 days to 10 minutes.',
      evidence: 'Self-reported by Uber’s CTO, with no stated baseline method.',
      caveat: 'Uber’s COO says it’s hard to link AI usage stats to more useful features. In the same interview he confirmed the CTO had said Uber blew through its 2026 AI budget early in the year.',
      lesson: 'The CTO’s own lesson: the wins come from redesigning a whole workflow, not automating one task.',
      findings: [
        'uber-2026-agentic-pods-task-time-reductions',
        'uber-2026-coo-no-line-from-ai-stats-to-features',
        'uber-2026-ai-budget-blown-early',
        'uber-2026-agentic-pods-workflow-unit-of-automation',
      ],
    },
    {
      company: 'JPMorganChase',
      reported: 'Over 200,000 employees have access to its LLM Suite platform.',
      evidence: 'Statements at investor events. Usage, not a return.',
      caveat: 'Jamie Dimon says about 150,000 weekly users believe they save about four hours a week, and the bank does not count that in its NPVs. The bank’s COO writes that the gains will free capacity for growth, and that the goal is not fewer people.',
      lesson: 'Count outcomes, not self-reported hours.',
      findings: [
        'jpmorgan-2025-llm-suite-200k-employees-access',
        'jpmorgan-2026-dimon-genai-time-savings-not-in-npv',
        'jpmorgan-2026-coo-goal-not-fewer-headcount',
      ],
    },
    {
      company: 'Moderna',
      reported: 'A goal of 100% adoption and proficiency within six months, run by a dedicated team. Its internal chatbot reached more than 80% of employees.',
      evidence: 'A vendor customer story (OpenAI), plus Moderna’s leadership page, which in late 2024 showed one executive leading both people and digital technology.',
      caveat: 'This is adoption. No business outcome is published.',
      lesson: 'The tool came with people work: a dedicated team ran the change alongside the rollout.',
      findings: [
        'openai-2024-moderna-100-percent-adoption-target',
        'openai-2024-moderna-mchat-80-percent-adoption',
        'moderna-2024-hr-and-digital-under-one-leader',
      ],
    },
    {
      company: 'Shopify',
      reported: 'The CEO made AI use a baseline expectation, added it to performance reviews, and asks teams to show why AI can’t do the work before requesting more people.',
      evidence: 'The CEO’s published memo and the company’s annual filing.',
      caveat: 'The filing shows about 7,600 employees at the end of 2025, down from about 8,100 a year earlier, while revenue grew from $8,880 million to $11,556 million. It does not attribute either change to AI.',
      lesson: 'A policy to copy or reject on its merits, not a measured result.',
      findings: [
        'shopify-2025-memo-ai-in-performance-reviews',
        'shopify-2025-memo-headcount-gate',
        'shopify-2026-10k-headcount-down-revenue-up',
      ],
    },
    {
      company: 'Klarna',
      counterCase: true,
      reported: 'Its IPO prospectus says the AI assistant handled 69% of customer service chats in the year to June 2025, did work equal to over 700 full-time agents, and saved about $39 million in 2024.',
      evidence: 'An SEC filing. The agent equivalence and the savings are Klarna’s own estimates. Audited customer service and operations costs fell $37 million, or 15%, in 2024, which the filing attributes to efforts to optimize customer service costs.',
      caveat: 'In May 2025 the CEO admitted he had overstated how fast AI would take on the work, and said Klarna was hiring people for higher-end service conversations while expanding AI.',
      lesson: 'The honest model is two tracks: AI handles volume, and people handle the conversations that need judgment.',
      findings: [
        'klarna-2025-prospectus-ai-assistant-69-percent-chats',
        'klarna-2025-prospectus-customer-service-costs-down-15-percent',
        'klarna-2025-ceo-ahead-of-reality-humans-and-ai',
      ],
    },
  ] satisfies EnterpriseCase[],
} as const

// ── 4. Our own proof ─────────────────────────────────────────────────────────

export interface OwnCaseStat {
  value: string
  label: string
}

export interface OwnCase {
  name: string
  profile: string
  engagement: string
  summary: string
  stats: OwnCaseStat[]
  href: string
}

export const READINESS_OWN_CASES = {
  heading: 'What it looked like in our own work',
  intro: 'Three engagements, with only the numbers each client approved for publication. Most are adoption and time figures. Two look forward and are not audited returns: the real-estate firm’s hours are the client’s estimate, and the tech company’s payout hours are projected.',
  readCase: 'Read the case',
  pseudonymNote: 'Clients are anonymized under NDA; the work, the approach and the numbers are real. To speak with a client reference, email hello@vibrana.ai.',
  cases: [
    {
      name: 'A UK insurtech scale-up',
      profile: 'A 70-person UK insurtech',
      engagement: 'samplec0be66822d27-insurance',
      summary: 'Two weeks on-site, with the strategy run in parallel with building two prototypes. Their senior expert moved from spot-checks and answering questions to training the floor.',
      stats: [
        { value: '5% to 100%', label: 'of calls reviewed for quality and compliance, up from a monthly spot-check' },
        { value: '1,441', label: 'answers in a knowledge base that started as a PDF of FAQs' },
      ],
      href: '/case-studies/insurtech-qa-knowledge-base',
    },
    {
      name: 'A European real-estate firm',
      profile: 'A 50-person European real-estate firm',
      engagement: 'meridian-estates',
      summary: 'Twenty years of one person’s expertise made searchable and multilingual, with personal data stripped before anything else happens.',
      stats: [
        { value: '261', label: 'real answers in the knowledge base' },
        { value: '7', label: 'people on their team trained to build with AI' },
        { value: 'Up to 528 hrs', label: 'saved per trained person per year, by the client’s estimate: 7 to 11 hrs a week x 48 weeks' },
      ],
      href: '/case-studies/european-proptech-rag',
    },
    {
      name: 'A mid-sized tech company',
      profile: 'A tech company of 100+ people, over six weeks',
      engagement: 'orion-tech',
      summary: 'It opened with a readiness assessment and a shadow AI audit. Then strategy, people, governance and engineering ran at the same time.',
      stats: [
        { value: 'About 80%', label: 'of the organization completed a readiness assessment in week one, across 20+ job functions' },
        { value: '3,200+', label: 'personalized daily lessons completed' },
        { value: '4.4 / 5', label: 'pulse score on how the change connects to day-to-day work' },
        { value: 'About 720 hrs', label: 'a year projected from one payout automation' },
      ],
      href: '/case-studies/orion-tech',
    },
  ] satisfies OwnCase[],
} as const

// ── 5. What the assessment measures, and why ────────────────────────────────

export const READINESS_METHOD = {
  heading: 'What the assessment measures, and what it doesn’t',
  intro:
    'Six areas, 24 multiple-choice questions about what your organization does today (22 for teams of 50 or fewer, who skip two that assume several teams). Next to each area: what we ask about, and how strong the published research behind it is, in our reading of it.',
  strengthLabel: 'Research behind it',
  questionsLabel: (n: number) => `${n} questions`,
  areas: [
    { name: 'Leadership & Strategy', questions: 5, asks: 'Who is accountable for AI results, how many AI uses are part of daily work, whether results are measured against how the work went before, how many workflows were redesigned around AI, and whether work is timed before it changes.', strength: 'Strong, replicated across surveys' },
    { name: 'Data Readiness', questions: 4, asks: 'How much of the information your work needs is digital, how people get data from other teams, how data is checked for errors, and whether each source has a named owner.', strength: 'Moderate on how common gaps are, thin on effect' },
    { name: 'Technology Infrastructure', questions: 4, asks: 'An approved AI tool that works with your internal data, whether your systems connect to other tools, where they run, and how fast a working pilot reaches daily use.', strength: 'Thin to moderate' },
    { name: 'Talent & Capability', questions: 3, asks: 'The share of staff who can use an approved AI tool, the share with at least five hours of training or practice, and who could build or look after an AI workflow.', strength: 'Moderate' },
    { name: 'Governance & Responsible AI', questions: 4, asks: 'A written policy staff know, a review step for AI output, a list of AI tools and uses, and who approves new uses.', strength: 'Moderate for adoption, thin for value' },
    { name: 'Culture & Change Readiness', questions: 4, asks: 'The share of staff using AI weekly, who designs changes to the work, whether people talk openly about their AI use, and a plan for people whose work changes.', strength: 'Moderate' },
  ],
  principles: [
    { title: 'Self-reported', body: 'You answer for your organization, about what it does today: owners, counts, written policies, not ratings. Nothing is verified against your systems, so the report is as accurate as the answers.' },
    { title: 'A profile, not a benchmark', body: 'You see your six areas side by side, not a rank against other companies. The overall score is a plain average of the six, each counting the same, because no study we found fits readiness weights to outcomes. Read the areas first.' },
    { title: 'Research where you’re lowest', body: 'For your two lowest areas, the report shows published findings, with who was studied, and a case from our own work.' },
  ],
  benchmark: {
    title: 'For context: how other organizations rate themselves',
    subtitle: 'Share of leaders who rate their organization highly prepared for broad AI adoption, by area. Other organizations, not a comparison with yours.',
    finding: 'deloitte-state-of-ai-2026-preparedness-by-area',
    sample: '3,235 director to C-suite respondents in 24 countries, surveyed August to September 2025',
    note: 'Deloitte did not report culture as an area.',
    tableToggle: 'Show as a table',
    chartToggle: 'Show as a chart',
    columns: { area: 'Area', value: 'Highly prepared' },
    bars: [
      { label: 'Technology infrastructure', value: 43 },
      { label: 'Strategy', value: 42 },
      { label: 'Data management', value: 40 },
      { label: 'Risk and governance', value: 30 },
      { label: 'Talent', value: 20 },
    ],
  },
} as const

// ── 6. What you get, how long it takes, what happens to your data ──────────

export const READINESS_DETAILS = {
  heading: 'What you get, and what happens to your answers',
  screenshot: {
    src: '/assets/imagery/homepage/prism-grid-solar.webp',
    alt: 'A question from the AI Readiness Assessment: four answer options, with the six-area profile and a two-axis map filling in as you answer',
    width: 1280,
    height: 800,
  },

  blocks: [
    {
      title: 'What you do',
      items: [
        'Give your work email, team size and revenue band. We fill in your company and website from the email domain.',
        'Answer 24 multiple-choice questions (22 for teams of 50 or fewer), four options each, with nothing to write out.',
        'If you like, name up to three workflows your team repeats, with how many people do them and for how many hours a week.',
      ],
    },
    {
      title: 'What you get',
      items: [
        'A score for each area and an overall score, on screen as soon as you finish, so you see your two lowest areas before the next AI budget is set.',
        'Published research and a case from our work for your two lowest areas, so you see what others found there before you spend.',
        'For each workflow you name, the hours AI could free a year, as a range from published studies of that type of task, and which one to start with.',
        'A written analysis that reads your results against your company’s public context, as a PDF and an emailed copy you can forward.',
      ],
    },
    {
      title: 'What happens to your data',
      items: [
        'We save your contact details, answers, scores and any workflows you name. Your score comes only from your answers.',
        'We read your company’s public website with Firecrawl. To write your analysis, an open-weight AI model gets that page, your company name, your answers and scores, any workflows you name, and signals about how the assessment was completed, such as the time taken. A second model checks the analysis. Both run only on providers that OpenRouter routes with zero data retention and no training on your data.',
        'Records are removed when no longer needed. Ask us for your retention date at any time.',
        'Up to four follow-up emails about your results over the next two weeks. Each one has an unsubscribe link that cancels the rest, and replying “stop” works too.',
        'Email hello@vibrana.ai to access, correct, object to follow-up, or delete your data.',
      ],
    },
  ],
  privacyLink: { label: 'Read the privacy policy', href: '/privacy' },
  noObligation: 'No obligation to buy anything. If you want help afterward, our build sprints start from $10,000.',
} as const

// ── 7. Quotes ────────────────────────────────────────────────────────────────

export type ReadinessQuote =
  | { text: string; finding: string; attribution: string }
  | { text: string; engagement: string; attribution: string }

export const READINESS_QUOTES = {
  heading: 'In their words',
  research: [
    {
      text: 'The biggest barrier to success is leadership.',
      finding: 'mckinsey-superagency-leadership-biggest-barrier',
      attribution: 'McKinsey, Superagency in the workplace, 2025',
    },
    {
      text: 'Adoption tells you that people use AI, not whether it pays off.',
      finding: 'bcg-ai-at-work-2026-measure-value-not-adoption',
      attribution: 'BCG, AI at Work, 2026',
    },
    {
      text: 'The biggest wins rarely come from automating one task. They come from rethinking an entire workflow.',
      finding: 'uber-2026-agentic-pods-workflow-unit-of-automation',
      attribution: 'Uber’s CTO, 2026',
    },
  ] satisfies ReadinessQuote[],
  clients: [
    {
      text: 'Impressed and at the same time scared that you have a very similar understanding of what my perception is.',
      engagement: 'orion-tech',
      attribution: 'Leader of a business unit, a mid-sized tech company',
    },
    {
      text: 'It’s all about coworking.',
      engagement: 'orion-tech',
      attribution: 'An engineer at a mid-sized tech company, after redirecting an AI agent that was going in circles',
    },
  ] satisfies ReadinessQuote[],
} as const

// ── Closing ──────────────────────────────────────────────────────────────────

export const READINESS_CLOSING = {
  eyebrow: 'Start with your own profile',
  title: 'Know your two weakest areas before the next AI budget is set.',
  body: '24 questions. Your profile on screen when you finish, with the research behind your two lowest areas and the hours AI could free in the workflows you name. If it’s useful, book a 30-minute call to walk through it with us.',
  scene: { id: 'scene-desk-wood-b', alt: '' },
} as const

export const READINESS_SOURCE_LABELS = {
  source: 'Source',
  studied: 'Studied',
  ledgerNote: 'Every figure on this page links to its source. Findings come from our research library, checked at source; client numbers are the ones each client approved.',
} as const
