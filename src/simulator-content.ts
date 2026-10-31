import { siteContent } from '@/src/site-content'
// AI Transformation Simulator copy (VIB-430, v2 dashboard). Copy is data (DESIGN.md § Page copy is data).
//
// v2 brief (John, 2026-10-15): the reader is about to go all-in on AI transformation with no
// view of the up-front or monthly cost and no way to model the efficiency gain. "Like launching
// a new venture without a P&L." Compact labels, short headlines, a CFO dashboard, our offers as a
// menu (never a total). Prices: John, 2026-10-13 and 2026-10-15.
// The full copy suite (copy-brief through persona-review) runs on this file before ship.
//
// Rules this file must keep (tests/simulator/content.test.ts enforces them):
// - no headcount language (no FTE, roles, jobs, headcount reductions)
// - every number printed with its range
// - American spelling, no em dashes

import type { DataRule, FunctionId, OfferId, Pace, ProviderId, ReadinessAnswer, ReadinessDimension, SectorId, TeamMemberId } from '@/src/lib/simulator/types'

export const SIM_META = siteContent("simulator-content.SIM_META", {
  title: 'AI Transformation Simulator: your AI Transformation Roadmap | Vibrana',
  description:
    'Before you go all-in on AI, see what it costs to run, the time it takes and the capacity it frees, team by team. Outside help is priced separately, with prices shown up front. Ranges from published studies; every assumption editable.',
  ogAlt: 'Vibrana AI Transformation Simulator: an AI Transformation Roadmap for your company.',
  sharedTitle: (sector: string, band: string) => `AI Transformation Simulator: ${sector}, ${band} people | Vibrana`,
  sharedDescription: 'A two-year AI P&L for a company like this one: run cost, capacity freed by department, and where outside help fits.',
} as const)

export const SIM_OG = siteContent("simulator-content.SIM_OG", {
  eyebrow: 'AI Transformation Simulator',
  headline: { lead: 'Your AI', accent: 'Transformation', trail: 'Roadmap' },
  alt: SIM_META.ogAlt,
} as const)

// ---------------------------------------------------------------------------
// Landing and input flow
// ---------------------------------------------------------------------------

export const SIM_INTRO = siteContent("simulator-content.SIM_INTRO", {
  eyebrow: 'AI Transformation Simulator',
  title: 'Your AI Transformation Roadmap',
  subtitle: 'You would not launch a new venture without a P&L. Before you go all-in on AI, see what it costs to run, the time it takes and the capacity it frees, team by team.',
  sampleCaption: 'An illustrative result for a 240-person insurer. Yours uses your website and your numbers.',
  sampleName: 'Sample insurer',
  sampleUrl: 'vibrana.ai/simulator',
} as const)

export const SIM_STEPS = siteContent("simulator-content.SIM_STEPS", {
  company: {
    label: 'Start with your company',
    urlLabel: 'Company website',
    urlPlaceholder: 'yourcompany.com',
    urlHint: 'We read your homepage once for your sector, team mix, logo and a screenshot. We never keep the page text.',
    emailLabel: 'Work email',
    emailPlaceholder: 'you@yourcompany.com',
    emailHint: 'Needed to see your result. No newsletter.',
    peopleLabel: 'Headcount',
    peoplePlaceholder: '200',
    peopleHint: (band: string | null) => (band ? `${band} people` : 'Everyone on payroll, 5 to 100,000.'),
    submit: 'Build my model',
    skip: 'No website? Pick a sector instead',
    errors: {
      people: 'Enter a number of people between 5 and 100,000.',
      email: 'Enter a work email.',
      failed: 'Something went wrong. Try again in a moment.',
      url: 'Enter a website, or pick a sector instead.',
    },
  },
  reading: {
    label: 'Reading your homepage',
    lines: ['Reading your homepage', 'Matching your sector', 'Starting from your sector’s typical team mix', 'Pricing your model'],
    note: 'Usually 10 to 20 seconds.',
  },
  profile: {
    label: 'Is this you?',
    sectorLabel: 'Sector',
    other: 'Other sector',
    continue: 'Looks right',
    notYou: 'Different company',
    manualTitle: 'Pick your sector',
    manualNote: 'We could not read the site. Pick the closest sector and you still get a full result.',
  },
  setup: {
    label: 'Set your model',
    sectorLabel: 'Sector',
    sectorFound: (domain: string) => `Suggested from ${domain}. Change it if it's wrong.`,
    sectorUnsure: (domain: string) => `We weren't sure about ${domain}. Which fits best?`,
    sectorManual: 'We could not read the website, so pick the closest sector. You still get a full result.',
    sectorPick: 'Pick the closest sector.',
    providersLabel: 'Model providers',
    providersHint: 'Pick one or more. Prices come from each provider’s price page.',
    capLabel: 'AI spend ceiling per person, a month',
    capHint: 'Seat included. Per-person limits need an AI gateway or per-person keys; workspace limits cap the total.',
    dataLabel: 'What data may reach a model',
    paceLabel: 'How far you roll out',
    paceHint: 'Share of your people using AI once the rollout settles.',
    paceValue: (pct: string) => `${pct} using AI`,
    submit: 'Show my model',
  },
} as const)

/** The read shown in the top card when no website was read: where AI changes the economics of the sector. */
export const SIM_SECTOR_READ: Record<SectorId, { aiRole: string; levers: string[] }> = siteContent("simulator-content.SIM_SECTOR_READ", {
  'professional-services': {
    aiRole: 'Your product is expert time. AI takes the drafting, research and review out of that time, so the same people can deliver more work, with their own review on every output.',
    levers: ['Faster proposals and first drafts', 'Research and review in hours, not days', 'More capacity per expert'],
  },
  'financial-services': {
    aiRole: 'Much of the cost sits in checks, reconciliations and service queues. AI shortens each of them, and each step can be logged for review.',
    levers: ['Quicker onboarding and compliance checks', 'Fewer manual reconciliations', 'Faster answers for customers'],
  },
  insurance: {
    aiRole: 'Claims, underwriting and service are document-heavy. AI reads and routes them, so people spend their time on the cases that need judgment.',
    levers: ['Faster claims intake and triage', 'Underwriting file summaries', 'Shorter service handling'],
  },
  'real-estate': {
    aiRole: 'Deals run on documents, data rooms and reporting. AI turns leases and contracts into summaries and flagged clauses that your people sign off, so teams can cover more assets and deals.',
    levers: ['Faster lease and contract review', 'Reporting without the manual pull', 'More deals covered per team'],
  },
  software: {
    aiRole: 'AI changes how fast software gets built, tested and supported. Teams that change how they work around it gain capacity, which they can spend on shipping more or on the backlog.',
    levers: ['Faster build and review cycles', 'Faster first answers for customers', 'Quicker documentation and release notes'],
  },
  'marketing-media': {
    aiRole: 'Output is the product. AI cuts the cost of each draft, version and report, so the same team has room to serve more clients and campaigns.',
    levers: ['Faster content and creative variants', 'Campaign and client reports drafted automatically', 'Room for more accounts per team'],
  },
  'ecommerce-retail': {
    aiRole: 'Margins depend on service volume, catalog work and marketing spend. AI handles the repetitive load and sharpens the spend.',
    levers: ['Support handled faster', 'Catalog and listing work automated', 'Better-targeted marketing'],
  },
  healthcare: {
    aiRole: 'Clinicians lose hours to documentation and admin. AI returns that time to patients while keeping people in charge of every decision.',
    levers: ['Less time on notes and forms', 'Faster scheduling and billing', 'Quicker coding and claims'],
  },
  'manufacturing-logistics': {
    aiRole: 'Margins live in planning, quoting and exceptions. AI speeds up the office work around the floor and flags problems earlier.',
    levers: ['Faster quoting and order handling', 'Earlier exception alerts', 'Less manual planning and reporting'],
  },
  education: {
    aiRole: 'Teaching quality is limited by prep and admin time. AI takes on the preparation and paperwork so staff can teach and support learners.',
    levers: ['Faster lesson and content prep', 'Less admin per learner', 'More personal support'],
  },
  'public-nonprofit': {
    aiRole: 'Demand for services outgrows budgets. AI clears the casework and reporting backlog so more people are served with the same staff.',
    levers: ['Faster case handling', 'Reporting and grant paperwork', 'Quicker responses to the public'],
  },
  other: {
    aiRole: 'Every company has repeatable work in service, finance, operations and sales. AI takes the repetitive share, and your people take the rest.',
    levers: ['Repetitive admin automated', 'Faster internal answers', 'More time for the work that grows the business'],
  },
})

export const SIM_SECTOR_LABELS: Record<SectorId, string> = siteContent("simulator-content.SIM_SECTOR_LABELS", {
  'professional-services': 'Professional services',
  'financial-services': 'Financial services',
  insurance: 'Insurance',
  'real-estate': 'Real estate and proptech',
  software: 'Software and SaaS',
  'marketing-media': 'Marketing and media',
  'ecommerce-retail': 'E-commerce and retail',
  healthcare: 'Healthcare and life sciences',
  'manufacturing-logistics': 'Manufacturing and logistics',
  education: 'Education',
  'public-nonprofit': 'Public sector and nonprofit',
  other: 'Other',
})

export const SIM_PROVIDER_LABELS: Record<ProviderId, string> = siteContent("simulator-content.SIM_PROVIDER_LABELS", {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google Gemini',
  'open-weight': 'Open-weight',
})

/** Open-weight models are priced through OpenRouter; its mark identifies the option. */
export const SIM_PROVIDER_LOGOS: Record<ProviderId, { src: string; alt: string; mono?: boolean }> = siteContent("simulator-content.SIM_PROVIDER_LOGOS", {
  anthropic: { src: 'public-demo:logo', alt: 'Anthropic', mono: true },
  openai: { src: 'public-demo:logo', alt: 'OpenAI', mono: true },
  google: { src: 'public-demo:logo', alt: 'Google Gemini' },
  'open-weight': { src: 'public-demo:logo', alt: 'OpenRouter', mono: true },
})

export const SIM_DATA_RULES: Record<DataRule, { label: string; hint: string }> = siteContent("simulator-content.SIM_DATA_RULES", {
  public: { label: 'Public data only', hint: 'Nothing internal reaches a model.' },
  internal: { label: 'Internal data', hint: 'Your admin asks each provider for zero-data-retention terms. Not every plan offers them; if yours doesn’t, keep to public data or change plans.' },
  client: { label: 'Client data', hint: 'Under a data processing agreement reviewed by your legal or data protection lead.' },
})

export const SIM_PACES: Record<Pace, { label: string }> = siteContent("simulator-content.SIM_PACES", {
  cautious: { label: 'Cautious' },
  steady: { label: 'Steady' },
  ambitious: { label: 'Ambitious' },
})

export const SIM_FUNCTION_LABELS: Record<FunctionId, string> = siteContent("simulator-content.SIM_FUNCTION_LABELS", {
  support: 'Customer support',
  sales: 'Sales',
  marketing: 'Marketing',
  operations: 'Operations',
  finance: 'Finance',
  legal: 'Legal',
  people: 'People',
  software: 'Product and engineering',
})

/** Short labels for the network visual. */
export const SIM_FUNCTION_SHORT: Record<FunctionId | 'aiops', string> = siteContent("simulator-content.SIM_FUNCTION_SHORT", {
  aiops: 'AI Ops',
  support: 'Customer',
  sales: 'Sales',
  marketing: 'Marketing',
  operations: 'Operations',
  finance: 'Finance',
  legal: 'Legal',
  people: 'People',
  software: 'Product',
})

export const SIM_REGION_LABELS = siteContent("simulator-content.SIM_REGION_LABELS", {
  us: 'United States',
  uk: 'United Kingdom',
  eu: 'European Union',
  de: 'Germany',
  fr: 'France',
  nl: 'Netherlands',
} as const)

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

/** The short readiness check: one plain question per dimension of the full assessment, scored 100 / 70 / 40 / 0. */
export const SIM_READINESS: {
  heading: string
  sub: string
  notSure: string
  questions: Record<ReadinessDimension, { label: string; options: { score: ReadinessAnswer; label: string }[] }>
  card: {
    title: string
    outOf: string
    bands: Record<'limited' | 'emerging' | 'developing' | 'established' | 'broad', string>
    effect: (halfAdoption: string, typical: string, training: string) => string
    neutral: string
    answer: string
    cta: string
  }
} = siteContent("simulator-content.SIM_READINESS", {
  heading: 'Where you start',
  sub: 'Six answers. The more ready you are, the sooner value arrives and the less it costs to get there.',
  notSure: 'Not sure',
  questions: {
    leadership: {
      label: 'Who owns AI at your company?',
      options: [
        { score: 100, label: 'A named executive, and most leaders use AI weekly' },
        { score: 70, label: 'A named owner, but only some leaders use it' },
        { score: 40, label: 'Interest at the top, no named owner' },
        { score: 0, label: 'No one owns it' },
      ],
    },
    data: {
      label: 'How easy is it to point AI at the documents and data for one workflow?',
      options: [
        { score: 100, label: 'Same day, in systems we already govern' },
        { score: 70, label: 'A few days, some chasing' },
        { score: 40, label: 'Weeks, spread across many systems' },
        { score: 0, label: 'We do not know where it lives' },
      ],
    },
    technology: {
      label: 'What AI tools can your people use for real work today?',
      options: [
        { score: 100, label: 'An approved enterprise account for most staff' },
        { score: 70, label: 'Approved for some teams or pilots' },
        { score: 40, label: 'Personal accounts, nothing approved' },
        { score: 0, label: 'Blocked, or none' },
      ],
    },
    talent: {
      label: 'How much AI training do your people have?',
      options: [
        { score: 100, label: 'A fifth or more trained this year, managers know the limits' },
        { score: 70, label: '10 to 20% trained, mixed understanding' },
        { score: 40, label: 'A few enthusiasts, little structured training' },
        { score: 0, label: 'Almost none' },
      ],
    },
    governance: {
      label: 'Do you have written rules for what data may go into AI?',
      options: [
        { score: 100, label: 'A written policy, enforced, with logging' },
        { score: 70, label: 'A basic policy, inconsistently followed' },
        { score: 40, label: 'Informal guidance only' },
        { score: 0, label: 'Nothing' },
      ],
    },
    culture: {
      label: 'How do employees feel about AI at work?',
      options: [
        { score: 100, label: 'Positive, and it is safe to say "I don’t know how to use this"' },
        { score: 70, label: 'Mostly positive, some worry' },
        { score: 40, label: 'Divided, or quiet worry' },
        { score: 0, label: 'Fearful or hostile' },
      ],
    },
  },
  card: {
    title: 'AI readiness',
    outOf: 'of 100',
    bands: { limited: 'Limited', emerging: 'Emerging', developing: 'Developing', established: 'Established', broad: 'Broad' },
    effect: (halfAdoption, typical, training) => `Half your people are on board by month ${halfAdoption} (${typical} at a typical baseline). Training: ${training} hours each.`,
    neutral: 'Answer six questions to set your baseline. It changes the timing and the training in your model.',
    answer: 'Set my baseline',
    cta: 'Take the full assessment',
  },
})

/** Optional inputs: the tools a company already runs, and what its builders will pay for. */
export const SIM_ADVANCED = siteContent("simulator-content.SIM_ADVANCED", {
  heading: 'Advanced',
  sub: 'Optional. Cost the tools your teams build with, and the AI seats of the tools you already use.',
  stackLabel: 'Tools you already use',
  stackHint: 'Where a tool sells an AI tier, its seat is added for the people using AI. The AI Software Factory builds on the rest.',
  stackAddOn: (usd: string, per: 'active' | 'builder') => `+${usd} per ${per === 'active' ? 'person' : 'builder'} a month`,
  buildLabel: 'What your builders will pay for',
  buildHint: 'Each line scales with how many people build. Turn off what you will not use.',
  monthly: (usd: string) => `about ${usd} a month`,
} as const)

export const SIM_STACK_LABELS = siteContent("simulator-content.SIM_STACK_LABELS", {
  notion: 'Notion',
  slack: 'Slack',
  linear: 'Linear',
  'google-workspace': 'Google Workspace',
  'microsoft-365': 'Microsoft 365',
  github: 'GitHub',
  jira: 'Jira',
  hubspot: 'HubSpot',
  salesforce: 'Salesforce',
} as const)

/** The two ways to get there, and the running total that compares them. */
export const SIM_DELIVERY = siteContent("simulator-content.SIM_DELIVERY", {
  label: 'How you get there',
  options: { consultant: 'With Vibrana', diy: 'On your own' },
  hints: {
    consultant: 'We build with your team and train them.',
    diy: 'Your people build it. Fewer workflows, a slower start.',
  },
  net: {
    heading: 'Net position',
    axis: 'Running total: value freed, less everything spent',
    zero: 'Break-even',
    breakEven: (m: number | null) => (m === null ? 'Not within 24 months' : m === 0 ? 'Ahead from the start' : `Break-even in month ${m}`),
    after: 'after 24 months',
  },
  verdict: {
    ahead: (delta: string) => `With Vibrana you finish ${delta} ahead after 24 months.`,
    behind: 'At your size, doing it yourself pays back faster.',
  },
  outside: (fee: string, months: number, support: string) => `Outside fees: ${fee} over ${months} months, then ${support} a month of support until month 12.`,
} as const)

export const SIM_DASH = siteContent("simulator-content.SIM_DASH", {
  nav: {
    overview: 'Overview',
    efficiency: 'Efficiency',
    pnl: 'P&L projection',
    departments: 'Departments',
    roadmap: 'Roadmap',
    why: 'Outside help',
    help: 'Services',
    sources: 'Sources',
  },
  sidebar: {
    inputs: 'Your inputs',
    edit: 'Edit inputs',
    done: 'Done',
    assumptions: 'Assumptions',
    pdf: 'Get the PDF',
    providers: (n: number) => (n === 1 ? '1 provider' : `${n} providers`),
    cap: (v: string) => `${v} ceiling`,
    people: (n: string) => `${n} people`,
  },
  header: {
    aiRole: (name: string) => `Where AI pays off at ${name}`,
    size: (band: string) => `${band} people`,
    costs: (region: string) => `Pay levels: ${region}`,
    screenshotAlt: (domain: string) => `The homepage of ${domain}`,
    logoAlt: (domain: string) => `${domain} logo`,
  },
  example: {
    heading: (company: string) => `How ${company} rolled out AI`,
    reported: { company: 'Company-reported', vendor: 'Published by the vendor' },
    source: 'Source',
  },
  kpi: {
    value: {
      label: 'Extra capacity a year',
      unit: 'At month-12 pace',
      sub: (hours: string) => `${hours} hours a month back by month 12`,
    },
    run: {
      label: 'AI running cost a month',
      sub: (ceiling: string) => `Up to a ${ceiling} spend ceiling`,
    },
    adoption: {
      label: 'Work time freed',
      sub: (people: string) => `Of all working hours at month 12, across ${people} people`,
    },
    training: {
      label: 'AI training hours',
      sub: (value: string) => `About ${value} of paid time`,
      unit: 'hours',
    },
    range: 'Range',
  },
  efficiency: {
    heading: 'Organizational efficiency',
    kpiLabel: 'Extra capacity at month 12',
    kpiUnit: 'hours a month',
    body: 'A workflow built in finance gets reused by operations. The company brain is where that knowledge lives.',
    growth: 'Capacity for growth',
    growthLine: 'Hours your teams can put into growth, quality or the backlog.',
    brain: 'Company brain',
    play: 'Play',
    pause: 'Pause',
    month: (m: number) => `Month ${m}`,
    scrub: 'Month',
    dotLegend: (per: number) => (per === 1 ? 'One dot is one person' : `One dot is ${per} people`),
    builderLegend: 'Ringed: builds workflows',
    linkLegend: 'Knowledge in and out',
    agents: {
      toggle: 'AI agents on the team',
      legend: 'An AI agent running a workflow',
      note: 'Agents run workflows between teams and the brain, on platforms such as Dots, OpenClaw or Hermes.',
    },
    frames: [
      { from: 0, title: 'Today', body: 'Every team, before the rollout starts.' },
      { from: 1, title: 'First users', body: 'Teams with the most to gain start first. A few people start building.' },
      { from: 4, title: 'Shared know-how', body: 'The company brain goes live: what one team builds, others reuse.' },
      { from: 13, title: 'Capacity for growth', body: 'Freed hours move into work you choose.' },
    ],
  },
  pnl: {
    heading: 'AI P&L projection, 24 months',
    sub: 'Monthly. Costs above the line, extra capacity below.',
    series: {
      run: 'AI running cost',
      oneOff: 'Training, setup and build time',
      capacity: 'Extra capacity',
      cash: 'Cash saving on outsourced work',
      ceiling: 'Spend ceiling',
      band: 'Range',
    },
    axisUp: 'Costs',
    axisDown: 'Capacity',
    tooltip: {
      month: (m: number) => `Month ${m}`,
      lines: {
        seats: 'Seats',
        builders: 'Builders',
        usage: 'Model usage',
        agents: 'Workflow runs',
        tooling: 'Build tools',
        addOns: 'AI add-on seats',
        reserve: 'Spend reserve',
        governance: 'Governance',
        training: 'AI training hours',
        setup: 'Governance setup',
      },
      run: 'AI running cost',
      capacity: 'Extra capacity',
      range: 'Range',
    },
    tableToggle: 'Show as a table',
    tableHide: 'Hide table',
    tableHeaders: ['Month', 'AI running cost', 'Training and setup', 'Extra capacity', 'Hours freed'],
    salesNote: 'Sales hours are not counted: the sales studies measured revenue (0 to +16%; Fang et al., 2026), not time.',
  },
  departments: {
    heading: 'By department',
    sub: 'Month 12. Each team valued at its own pay level. The model holds headcount flat.',
    hours: 'h/mo',
    perMonth: 'a month',
    headers: { team: 'Team', hours: 'Hours a month', value: 'Value a month' },
  },
  roadmap: {
    heading: 'Roadmap',
    sub: 'Four phases, from the first decisions to your own people running it.',
    funded: 'Where outside help can fit (optional)',
    months: (start: number, end: number) => `Months ${start} to ${end}`,
    phases: [
      {
        start: 0,
        end: 3,
        title: 'Decide and set the rules',
        milestones: ['Readiness baseline', 'Spend ceiling and data rule', 'First users trained'],
        offers: ['readiness-assessment', 'workshop', 'governance'],
      },
      {
        start: 3,
        end: 6,
        title: 'First workflows live',
        milestones: ['Each workflow approved before build', 'Training live for the first teams', 'One trained builder named in each team'],
        offers: ['workflows', 'custom-build', 'harness', 'training-platform'],
      },
      {
        start: 6,
        end: 12,
        title: 'Company brain and every team',
        milestones: ['Company brain map signed off', 'Teams onboard in waves'],
        offers: ['company-brain', 'people-culture', 'software-factory'],
      },
      {
        start: 12,
        end: 24,
        title: 'Your people run it',
        milestones: ['Your builders ship the next workflows', 'Support optional and capped'],
        offers: ['support'],
      },
    ] satisfies { start: number; end: number; title: string; milestones: string[]; offers: OfferId[] }[],
  },
  help: {
    heading: 'Services and prices',
    sub: 'What each costs, before any call. Pick what you need; each is quoted per scope.',
    free: 'Free',
    from: (v: string) => `From ${v}`,
    each: 'each',
    month: 'a month',
    quote: 'Quoted per scope',
    quantity: (n: number) => `Your model assumes ${n}`,
    typical: (v: string, weeks: string) => `About ${v} over ${weeks} weeks at your pace`,
    ledBy: 'Led by',
    book: 'Book a call',
    bookHref: 'https://calendar.app.google/2DswLVndhkpMVx7K7',
    scrollHint: 'Scroll the services',
    prev: 'Previous',
    next: 'Next',
    pause: 'Pause scrolling',
    play: 'Resume scrolling',
  },
  why: {
    heading: 'Why bring in outside help',
    sub: 'AI transformation is mostly a people-and-process problem, tangled up with technology, governance, finance and office politics. The research below shows where programs stall, and what the one study that compares builders found.',
    cards: [
      {
        stat: '70%',
        title: 'Of the effort is people and process',
        body: 'BCG found AI leaders put 10% of their resources into algorithms, 20% into technology and data, and 70% into people and processes.',
        source: { label: 'BCG, Where’s the Value in AI?', url: 'https://web-assets.bcg.com/a5/37/be4ddf26420e95aa7107a35aae8d/bcg-wheres-the-value-in-ai.pdf' },
      },
      {
        stat: '30%',
        title: 'Of digital transformations reach their goals',
        body: 'In BCG’s study of 70 companies and 825 executives, only 30% of digital transformations achieved their objectives. The people dimension was usually what decided it.',
        source: { label: 'BCG, Increasing the Odds of Success in Digital Transformation', url: 'https://www.bcg.com/publications/2020/increasing-odds-of-success-in-digital-transformation' },
      },
      {
        stat: '67% vs 33%',
        title: 'Partner-built versus built in-house',
        body: 'In MIT NANDA’s preliminary report, tools built with an outside partner reached deployment about 67% of the time, against about 33% for internal builds. It compares vendor and partner tools, not consultants, the authors call the sample directional, and we found no independent replication.',
        source: { label: 'MIT NANDA, The GenAI Divide', url: 'https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf' },
      },
    ],
    evidenceHeading: 'More from the research',
    evidence: [
      {
        text: 'MIT NANDA’s survey ranked resistance to adopting new tools as the top barrier to scaling pilots. It covered 52 organizations.',
        source: { label: 'MIT NANDA, The GenAI Divide', url: 'https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf' },
      },
      {
        text: 'In the same BCG study, three in four executives felt leadership was engaged, but only one in three had committed middle management.',
        source: { label: 'BCG, Increasing the Odds of Success in Digital Transformation', url: 'https://www.bcg.com/publications/2020/increasing-odds-of-success-in-digital-transformation' },
      },
      {
        text: 'Prosci reports 88% of projects rated excellent at managing the people side of change met their objectives, against 13% of those rated poor. It is a correlation, self-reported, and Prosci sells training in it.',
        source: { label: 'Prosci, Best Practices benchmarking report, 12th edition', url: 'https://prosci.com/hubfs/Website_English/2.downloads/webinars/EN-EUR%20Webinar/Best-Practices-in-Change-Management-12th-Edition-Executive-Summary.pdf' },
      },
      {
        text: 'The same MIT NANDA report found 95% of organizations getting zero measurable P&L return from generative AI. It is a preliminary report, 153 survey respondents, and contested.',
        source: { label: 'MIT NANDA, The GenAI Divide', url: 'https://mlq.ai/media/quarterly_decks/v0.1_State_of_AI_in_Business_2025_Report.pdf' },
      },
    ],
    close: 'Only the MIT figure compares who builds, and it is a preliminary sample. BCG and Prosci show where the work is, not who should do it, and both sell related work.',
    cta: 'Book a call',
  },
  assessment: {
    eyebrow: 'Free readiness assessment',
    title: 'Know where you stand before you spend.',
    body: '24 questions, with your scores on screen when you finish and your size and website already filled in. Want every team surveyed? The Comprehensive AI Readiness Assessment covers governance risk, psychological readiness and technical barriers, from $10k. Responses are anonymous and reported by team.',
    primary: 'Take the free assessment',
    secondary: 'Ask about the full assessment',
    screenshotAlt: 'A sample AI readiness report: an overall score and a bar for each area',
  },
  sources: {
    heading: 'How we got these numbers',
    open: 'Show sources',
    close: 'Hide sources',
    body:
      'Low end: whole-job studies that found small gains (Humlum and Vestergaard; Bick, Blandin and Deming), paired with the high end of every cost. High end: task-level trials that found large gains (Brynjolfsson et al.; Noy and Zhang; Dell’Acqua et al.), paired with the low end of every cost.',
    nationalLine: 'For scale: a US survey found 1.4% of all work hours saved (Bick, Blandin and Deming, 2025), and a Danish study about 3% of users’ hours (Humlum and Vestergaard, 2025).',
    evidence: 'Studies',
    illustrations: 'Illustrations, not used in the math',
    selfReported: 'Self-reported',
    prices: 'Prices',
    pay: 'Pay levels',
    readOn: (date: string) => `Read on ${date}`,
    seat: (plan: string, usd: number) => `${plan}: $${usd} a person a month`,
    tokenUnit: 'Model prices per 1M tokens, input / output, USD.',
    tools: 'Build tools',
    toolsNote: (date: string) => `Unit prices read on ${date}. The monthly figure is our estimate for a rollout of about ten builders, scaled by how many you have.`,
    toolRange: (low: string, high: string) => `${low} to ${high} a month`,
    link: 'Source',
  },
  fineprint: (date: string) =>
    `Ranges use published research and model prices read on ${date}. Client and vendor figures are illustrations only and never enter the math. Not financial advice or a quote.`,
} as const)

/** Service cards for the gallery, keyed by engine offer id. Images are manifest ids. */
export const SIM_OFFERS: Record<OfferId, { title: string; body: string; image: string; imageAlt: string; priceNote?: string }> = siteContent("simulator-content.SIM_OFFERS", {
  'readiness-free': {
    title: 'Free readiness assessment',
    body: '24 questions, with your scores on screen when you finish.',
    image: 'sprint-prototype-laptop',
    imageAlt: 'A laptop displaying a prototype',
  },
  'readiness-assessment': {
    title: 'Comprehensive AI Readiness Assessment',
    body: 'Every team surveyed: governance risks, psychological readiness and technical barriers, with a full analysis. Responses are anonymous and reported by team.',
    image: 'prism-grid-solar',
    imageAlt: 'Sunlight through a prism grid',
  },
  workshop: {
    title: 'Workshop on one real problem',
    body: 'One problem, worked end to end. No obligation to continue.',
    image: 'ppl-stickynotes-v2',
    imageAlt: 'A team thinking out loud at a wall of sticky notes',
  },
  workflows: {
    title: 'Workflow automation',
    body: 'Named workflows, each approved by your operations lead before build.',
    image: 'sprint-track-workflow',
    imageAlt: 'A workflow laid out step by step',
  },
  'custom-build': {
    title: 'Custom build',
    body: 'One prototype taken to production, built in your own tools.',
    image: 'sprint-prototype-laptop',
    imageAlt: 'A prototype open on a laptop',
  },
  harness: {
    title: 'Custom harness development',
    body: 'The setup your builders and agents work inside: your tools, permissions, checks and logs, built around the way your company works.',
    image: 'sprint-hands-keyboard',
    imageAlt: 'Hands on a keyboard',
  },
  'software-factory': {
    title: 'AI Software Factory',
    body: 'A working studio inside your company. It includes the training product, design, and your engineers learning how to build this way.',
    image: 'sprint-whiteboard-team',
    imageAlt: 'A team planning at a whiteboard',
  },
  'company-brain': {
    title: 'Company brain',
    body: 'A searchable map of your documents, processes and decisions, owned by you. Each person reviews what is recorded about their work; your operations lead signs it off and decides who can see it.',
    image: 'prism-grid-solar',
    imageAlt: 'Light refracting through a glass grid',
  },
  governance: {
    title: 'Governance and compliance strategy',
    body: 'EU AI Act readiness, policy, controls and the data rules your admin enforces.',
    image: 'sprint-track-governance',
    imageAlt: 'A governance checklist on a desk',
  },
  'people-culture': {
    title: 'People and culture',
    body: 'How teams adopt AI: change, habits and leadership, so the tools get used.',
    image: 'sprint-track-people',
    imageAlt: 'People working together around a table',
  },
  'training-platform': {
    title: 'Training platform',
    body: 'Curricula built for each team from your own tools and work: 1:1 coaching, team workshops, a personalized curriculum for each person and a custom harness.',
    priceNote: 'Entry price. The full model is a base from $30k, $250 to $600 per learner, and from $2,000 for each live week.',
    image: 'eng-journeys-laptop',
    imageAlt: 'A learning journey open on a laptop',
  },
  program: {
    title: 'The full program',
    body: 'The assessment, workshop, workflows, company brain, governance and training as one engagement: a fixed fee per stage, with a gate after each where you can stop.',
    image: 'eng-transformation-call',
    imageAlt: 'A company-wide transformation call',
  },
  support: {
    title: 'Optional support',
    body: 'After delivery, capped at a monthly figure, with scope and cancellation terms agreed in writing.',
    image: 'phase-embed',
    imageAlt: 'A handover between two teams',
  },
})

/** What each person leads, as John set it on 2026-10-15. Names and photos come from ABOUT_TEAM. */
export const SIM_TEAM: Record<TeamMemberId, { name: string; focus: string; first: string; word: string }> = siteContent("simulator-content.SIM_TEAM", {
  john: { name: 'John Ellison', focus: 'Strategy', first: 'John', word: 'Strategy' },
  stephan: { name: 'Stephan Ledain', focus: 'Governance and behavioral science', first: 'Stephan', word: 'Governance' },
  abe: { name: 'Abe Isleem', focus: 'Workflow automation and engineering', first: 'Abe', word: 'Engineering' },
  chetan: { name: 'Chetan Nandakumar', focus: 'Company brain', first: 'Chetan', word: 'Brain' },
  fatma: { name: 'Fatma Ghedira', focus: 'People and culture', first: 'Fatma', word: 'People' },
})

// ---------------------------------------------------------------------------
// Assumptions drawer
// ---------------------------------------------------------------------------

export const SIM_DRAWER = siteContent("simulator-content.SIM_DRAWER", {
  open: 'Assumptions',
  title: 'Assumptions',
  intro: 'Every value the model uses. Change any of them and the model re-runs at once.',
  reset: 'Reset to defaults',
  yourValue: 'Your value.',
  assumption: 'Our assumption.',
  mix: {
    label: 'Team mix',
    hint: 'Share of people in each team. We rescale so it adds to 100%.',
    sourceClassified: (domain: string) => `Suggested from ${domain}, starting from the sector default (our assumption).`,
    sourceDefault: 'Sector default (our assumption).',
  },
  hourly: {
    label: 'Average loaded hourly cost',
    hint: 'Wages plus employer costs, per hour worked. Each team is then valued at its own pay level.',
    caveat: 'Average for all employees in your sector; office staff usually cost more.',
    period: (p: string) => `Period: ${p}.`,
    pay: 'Pay by team relative to the average:',
  },
  region: {
    label: 'Pay levels and currency',
    fx: (date: string) => `Converted at the ECB reference rate of ${date}.`,
  },
  weeks: { label: 'Working weeks a year', hint: 'Our assumption: 48, the same arithmetic as our published case studies.' },
  outsourced: {
    label: 'Annual outsourced or agency spend',
    hint: 'Optional. Enter it and the model shows the share that could fall (10 to 30% at full use, our assumption).',
    placeholder: '0',
  },
  taskShare: {
    label: 'Apply trial gains to',
    hint: 'Task-level trials measured specific tasks, not whole days. This sets how much of each team’s time looks like those tasks.',
    options: [
      { value: 0, label: 'None (whole-job studies only)' },
      { value: 1, label: 'About half of each team’s time (default)' },
      { value: 1.5, label: 'Most of each team’s time (beyond what the trials measured)' },
    ],
  },
  newWork: { label: 'Name the capacity for growth', hint: 'What the freed hours go to in the picture.', placeholder: 'Capacity for growth' },
} as const)

/** Drill-down inside the assumptions drawer: where each number comes from. Display only. */
export const SIM_DRILL = siteContent("simulator-content.SIM_DRILL", {
  heading: 'Where the numbers come from',
  intro: 'Open a group to see each value the model used, with its source.',
  ours: 'Our assumption',
  source: 'Source',
  sections: {
    adoption: { title: 'Adoption' },
    pricing: { title: 'Pricing' },
    tooling: { title: 'Tooling' },
    labor: { title: 'Labor cost' },
    benchmarks: { title: 'Benchmarks' },
  },
  adoption: {
    ceiling: 'Share of people using AI once the rollout settles',
    halfway: 'Month when half of them are using AI',
    months: (n: number) => `Month ${n}`,
    halfwayNote: 'Moved earlier or later by your readiness answers. Our assumption.',
    perWorkflow: 'People per automated workflow by month 12',
    people: (n: number) => `${n} people`,
    training: 'Training time per person',
    hours: (n: number) => `${n} hours`,
  },
  pricing: {
    seat: (provider: string) => `${provider} seat`,
    perPerson: (v: string) => `${v} a person a month`,
    tokens: (provider: string, model: string) => `${provider} ${model}`,
    perMillion: (input: string, output: string) => `${input} in / ${output} out per 1M tokens`,
    tokensNote: 'Mid-tier model, USD list price.',
    reserve: 'Reserve on variable model spend',
    gateway: 'Gateway fee on workflow spend',
    fx: 'Currency conversion',
    fxValue: (date: string) => `ECB rate of ${date}`,
  },
  tooling: {
    monthly: (v: string) => `${v} a month`,
    estimate: 'Unit prices come from the vendor page; the monthly figure is our estimate.',
    addOn: (v: string) => `${v} a person a month`,
    governance: 'Logging and gateway tools',
  },
  labor: {
    hourly: 'Loaded hourly cost, company average',
    perHour: (v: string) => `${v} an hour`,
    pay: 'Pay by department',
    spread: (low: string, high: string) => `${low} to ${high} an hour`,
    weeks: 'Working weeks a year',
    weeksValue: (n: number) => `${n} weeks`,
  },
  benchmarks: {
    saved: (low: string, high: string) => `${low} to ${high} of hours`,
    extrapolated: 'No study covers this team directly; the range is our extrapolation.',
  },
} as const)

// ---------------------------------------------------------------------------
// Leads and sharing
// ---------------------------------------------------------------------------

export const SIM_LEAD = siteContent("simulator-content.SIM_LEAD", {
  heading: 'Take this to your leadership team',
  sub: 'The full model as a PDF: every line item, the month-by-month plan and the assumptions appendix.',
  planCta: 'Get the full model (PDF)',
  talkCta: 'Talk it through',
  planTitle: 'Get the full model (PDF)',
  talkTitle: 'Talk it through',
  talkIntro: 'A 30-minute call to walk through your model. We’ll reply to set a time.',
  email: 'Work email',
  company: 'Company name (optional)',
  note: 'Anything you want us to look at (optional)',
  submitPlan: 'Email me the model',
  submitTalk: 'Request a call',
  sending: 'Sending',
  donePlan: (email: string) => `On its way to ${email}, with the link to this model.`,
  doneTalk: (email: string) => `Thanks. Your full model (PDF) is on its way to ${email}. We’ll reply to set a time for the call.`,
  error: 'Something went wrong. Try again, or email hello@vibrana.ai.',
  consentBefore: 'One email with the plan and, if you asked, one reply about a call. No newsletter unless you opt in. Read the ',
  privacyLink: 'privacy policy',
  consentAfter: ', or email hello@vibrana.ai to delete your data.',
  cancel: 'Cancel',
} as const)

export const SIM_SHARE = siteContent("simulator-content.SIM_SHARE", {
  heading: 'Share this dashboard',
  sub: 'An unlisted link with a preview card, using your company name, logo and homepage imagery. Anyone with the link can see it, and you can delete it any time.',
  copy: 'Copy link',
  copying: 'Creating link',
  copied: 'Link copied',
  download: 'Download image',
  error: 'Could not create the link. Try again.',
  cardLine: 'Modeled with headcount flat',
} as const)

export const SIM_SHARED_PAGE = siteContent("simulator-content.SIM_SHARED_PAGE", {
  eyebrow: 'A shared simulation',
  intro: 'Someone shared this model with you. Run your own to change the numbers.',
  runYours: 'Run it for your company',
  gone: { title: 'This simulation was deleted', body: 'Its creator removed it. You can run your own; it is free.' },
} as const)

/** Share card (OG image and downloadable PNG). */
export const SIM_CARD = siteContent("simulator-content.SIM_CARD", {
  eyebrow: 'AI Transformation Simulator',
  sizeLine: (sector: string, band: string, name: string | null) => `${name ? `${name} · ` : ''}${sector} · ${band} people`,
  value: 'Extra capacity a year',
  valueUnit: 'at month-12 pace',
  run: 'AI running cost a month',
  adoption: 'Work time freed',
  line: SIM_SHARE.cardLine,
  footer: (date: string) => `Model ranges, prices read ${date}. vibrana.ai/simulator`,
} as const)
