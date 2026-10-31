import { siteContent } from '@/src/site-content'
// ── Homepage (/) ────────────────────────────────────────────────────────────
// Persona target: founder-visionary (home primary), gatekeeper-coo (secondary), per the
// routing table in .agents/product-marketing-context.md. Drivers: two-speed-anxiety,
// builder-identity (founder); proof-hunger, governance-control (gatekeeper).
//
// Hero copy used to be hardcoded in EnterpriseHomePage.tsx ("page copy is data"
// violation). It now lives here. 2026-10 (JE): the AI-native promise is back as the
// headline, and the subhead makes the AI Build Sprint the way in. Offer facts trace to
// src/ai-build-sprint-content.ts; the price stays off the hero.
export const ENTERPRISE_HERO = siteContent("enterprise-content.ENTERPRISE_HERO", {
  eyebrow: 'AI Build Sprints · AI-Native Transformation',
  headlinePrefix: 'We help enterprises become ',
  headlineGradientWord: 'AI-native',
  headlineSuffix: ' organizations.',
  subhead:
    'Start with a single product or workflow, expand to your entire organization with a company-wide transformation.',
  primaryCta: { text: 'See the AI Build Sprint', href: '/ai-build-sprint' },
  secondaryCta: { text: 'Explore AI-Native Transformation', href: '/ai-transformation' },
})

// Problem statement, ported in spirit from john-ellison.com's "AI Is Everywhere.
// Adoption Is Stalled." section. Red-team history (2026-07-20): v1 opened on an uncited
// "88%/5.5%" stat and was BLOCKed for citation risk; this version makes the point
// structurally with no unsourced number. The closing line (2026-09) resolves the
// section into the Sprint mechanism so it reads as one argument with the hero.
export const ENTERPRISE_PROBLEM = siteContent("enterprise-content.ENTERPRISE_PROBLEM", {
  eyebrow: 'The problem',
  title: 'AI is everywhere. Adoption isn\'t producing results.',
  subtitle:
    'Most companies we talk to have already adopted AI tools. Very few have seen it change how the organization actually works or deliver ROI.',
  points: [
    {
      title: 'Pilot purgatory',
      description: 'The CEO buys a Enterprise Claude or ChatGPT. Departments run pilots, but the board never sees the increased efficiency promised to them.',
    },
    {
      title: 'Nobody redesigns how work actually happens',
      description: 'The habits, hand-offs, and approval chains built for a pre-AI world quietly outlast every tool rollout.',
    },
    {
      title: 'Adoption hits a glass-ceiling with engineering',
      description: "Engineers can often be hesitant to adopt AI, fearing job displacement or being left behind.",
    },
  ],
  close:
    'We realize that AI is first and foremost a people problem, not a technology problem. When you approach transformation with a holistic human-centered approach, you can identify and remove the barriers to real adoption, productivity and performance.',
})

// The four-part Holistic AI Transformation (HAT) methodology, Vibrana's own framework
// (research/ws7-content-proof.md, "Signature Frameworks"). Red-team history (2026-07-20):
// v1's map pillar read as an unscoped surveillance layer and the Agentic OS pillar as an
// open-ended rollout (both BLOCK); v2 added the ownership and approval boundary each
// needed. 2026-09: the map pillar uses the offer name Company Brain (PR #60 renames
// Company Graph sitewide), and the subtitle scopes HAT to company-wide engagements so it
// does not compete with the Sprint in the hero.
export const ENTERPRISE_METHODOLOGY = siteContent("enterprise-content.ENTERPRISE_METHODOLOGY", {
  eyebrow: 'Our methodology',
  title: 'Holistic AI-Native Transformation',
  subtitle:
    'For company-wide change we run Holistic AI Transformation (HAT): a repeatable system grounded in behavioral science, human-centered design and organizational psychology.',
  pillars: [
    {
      title: 'Readiness Assessment',
      description: 'Every person in your organization takes a readiness assessment to understand their AI literacy, limiting beliefs and behavior patterns at work.',
    },
    {
      title: 'Company Brain',
      description: 'A map of how work actually flows between the teams, tools and information in scope. Your team owns it, controls what goes in, and who gets access to what.',
    },
    {
      title: 'Learning Journeys',
      description: 'Role-specific curricula that teach each function AI through the work it already does, not a generic course.',
    },
    {
      title: 'Agentic OS',
      description: 'Workspaces designed for each department that give them access to the Company Brain, Learning Journeys and all the tools they need to build AI-native workflows.',
    },
  ],
})

// Remaining homepage section copy (headers, labels, CTAs) that used to be inline in
// EnterpriseHomePage.tsx. The featured case study's statement, metrics and name come
// from content/case-studies/ (homepageStatement if set, else oneLineOutcome), not here.
export const ENTERPRISE_HOME_SECTIONS = siteContent("enterprise-content.ENTERPRISE_HOME_SECTIONS", {
  featuredCaseStudy: {
    eyebrow: 'REAL ESTATE TRANSFORMATION',
    cta: 'Read the case study',
  },
  secondCaseStudy: {
    eyebrow: 'TECHNOLOGY TRANSFORMATION',
    cta: 'Read the case study',
  },
  idealClient: { eyebrow: 'This is for you if' },
  afterTwelveWeeks: { eyebrow: 'After 12 weeks' },
  engagements: {
    eyebrow: 'How we work',
    title: 'Start small. Prove results. Let it grow.',
    gradientWord: 'Let it grow.',
    subtitle:
      'Start with a focused AI Build Sprint, a team curriculum rollout, or a full transformation. Each one stands on its own.',
    sprintCta: 'Explore the AI Build Sprint',
  },
  phases: {
    eyebrow: 'The 12-week arc',
    title: 'From stuck pilots to company-wide adoption',
    subtitle: 'Four phases. Each one produces something your teams keep and use after we leave.',
    labels: ['Phase one', 'Phase two', 'Phase three', 'Phase four'],
  },
  curriculum: {
    eyebrow: '20 roles',
    title: 'One curriculum per function. Personalized for your organization.',
    body:
      "Generic AI training fails because Finance and Engineering have unique concepts, workflows, and decisions. We built a curriculum for each function through engagements with other enterprises, covering the workflows, tools, and decisions that reflect each role's reality.",
    cta: 'View the full curriculum',
  },
  transformation: {
    eyebrow: 'Need company-wide change?',
    title: 'Company-wide transformation starts with the readiness assessment.',
    body:
      'Use it when the problem spans leadership, governance, skills, and several workflows, not when one focused build will answer the question.',
    cta: 'Explore Transformation',
  },
})

// 2026-07-20 note on the proof strip below: the homepage-reconciliation pass tried
// "150+ people trained" and "2,200+ learning journeys" (the practitioners' career-wide
// totals from john-ellison.com). The red-team BLOCKed both: "150+" blends pre-Vibrana
// personal totals into engagement proof without saying so, and "2,200+" has no citable
// source. If the practitioners' own track record belongs anywhere, it is /about, next to
// their bios, labeled as such.
//
// Persona target: gatekeeper-coo (proof strip — see .agents/product-marketing-context.md routing).
// Drivers: proof-hunger, governance-control. Red-teamed via persona-review before ship.
export const ENTERPRISE_PROOF = siteContent("enterprise-content.ENTERPRISE_PROOF", [
  {
    value: '20',
    label: 'job families with dedicated curricula',
    description: 'Finance, Legal, Product, Engineering, Customer Support - each function learns AI through the work it already does, not a generic course.',
    caseStudyLink: null,
    caseStudyHref: null,
  },
  {
    value: '100+',
    label: 'people through one company-wide season',
    // Anchored to the published Sampleca6cf3fe07ce case study (linked below): a six-week engagement
    // inside the client's season, readiness-assessment uptake, daily lessons. The CEO
    // reference-call line was cut by JE (2026-09-25). Headcount is always "100+" (JE,
    // 2026-10-12: the real count was higher; never quote an exact number).
    description: 'A six-week engagement across every department of a mid-sized tech company: about 80% took the readiness assessment in week one, and 3,200+ personalized daily lessons followed.',
    caseStudyLink: 'Read the AI transformation case study',
    caseStudyHref: '/case-studies/orion-tech',
  },
  {
    value: '$120-250k',
    // JE relabelled this from "scoped and capped before kickoff" to a plain cost label
    // (2026-09-25; his draft said "average"). It is our price range, not an average of past
    // engagements, so it says so (red-team 2026-09: "typical" claimed a track record).
    label: 'transformation price range',
    description: 'The range is set by headcount and job families in scope - fixed before we start, with a defined exit: a named internal lead runs everything when we leave. No license, no retainer.',
    caseStudyLink: null,
    caseStudyHref: null,
  },
])

export const ENTERPRISE_ENGAGEMENTS = siteContent("enterprise-content.ENTERPRISE_ENGAGEMENTS", [
  {
    title: 'Company-Wide Transformation',
    // JE's line (2026-09-25), kept in spirit: "cutting edge" is his ruling (fine as a plain noun
    // phrase). The competitor clause was cut: competitor-panic is disqualifying for the
    // founder-visionary (home primary) and reads as manufactured urgency.
    // Method matches the published Sampleca6cf3fe07ce study's closing section ("We now run
    // AI-Transformation pods... more effective than company-wide engagements") and says
    // plainly that the published reference ran six weeks.
    description: 'We bring AI to the whole company, not just the engineers, one department at a time: one of our engineers pairs with a lead you name. It spreads on proven value, not a top-down rollout.',
    bullets: [
      'A readiness assessment run with your leads: where AI earns its place in your workflows, and where it only adds noise',
      'Department pods: our engineer and your lead build real workflow automations alongside the team',
      'The people side runs from day one (cohorts, listening circles, a lead you name), not bolted on after',
    ],
  },
  {
    title: 'Agentic Learning Journeys',
    description: 'Your Finance team and your Engineering team need different things. We built 20 role-specific curricula so each function learns AI through the lens of work it already does.',
    bullets: [
      'Self-paced modules your team leads can deploy without external trainers',
      'Real assignments tied to live company work - not toy exercises',
      'Completion tracking and adoption metrics for leadership',
    ],
  },
  {
    // Aligned with /ai-build-sprint (src/ai-build-sprint-content.ts): 10 business days,
    // four tracks, real users before hand over, the client keeps code, docs and keys.
    // Was "AI Builder Sprints, 2-4 week sprints", which contradicted the hero above it.
    title: 'AI Build Sprint',
    description: 'For teams that need to ship, not study. In 10 business days our senior builders ship one working product or workflow with your people, and your team learns to build the next one.',
    bullets: [
      'Four tracks: Product, Workflow automation, Governance & policy, People & culture',
      'Real users put it to work before we hand over',
      'You keep the code, the docs and the keys. Any retainer afterwards is optional.',
    ],
  },
])

export const TRANSFORMATION_PHASES = siteContent("enterprise-content.TRANSFORMATION_PHASES", [
  {
    title: 'Map',
    description: 'With the leads you name, we audit your pilots, interview the people who run the work, and build a Company Brain: a machine-readable map of how work flows between the teams, tools and information in scope. It runs on AIOS, self-hosted on your infrastructure with permissions per department, so no outside party, including us, has to hold it. Your team owns it and decides what goes in.',
  },
  {
    title: 'Build',
    description: 'Custom agentic workflows and role-specific learning journeys, designed from your Company Brain. Then we roll out the agentic operating system one department at a time, each one scoped and signed off by your team first.',
  },
  {
    title: 'Train',
    description: 'Each role gets its own curriculum. We measure progress and adoption across the teams in scope, inside the security and compliance rules you already run. Regular showcases and hackathons let your people show what they built, and you pick who leads next.',
  },
  {
    title: 'Embed',
    description: 'Adoption isn\'t a launch event. In the final weeks we measure usage, refine the workflows, and hand everything to the lead you named. The engagement ends on the date fixed at kickoff.',
  },
])

// Persona target: gatekeeper-coo (primary) / founder-visionary (secondary), /ai-transformation
// routing in .agents/product-marketing-context.md. Drivers: proof-hunger, governance-control,
// org-chart-threat. Red-teamed via persona-review before ship.
export const AI_TRANSFORMATION_LANDSCAPE = siteContent("enterprise-content.AI_TRANSFORMATION_LANDSCAPE", {
  eyebrow: 'The landscape',
  title: 'Two options. Neither built for what you actually need.',
  subtitle:
    "AI adoption support splits into expensive generalists and platform-locked toolkits. Neither leaves you with a system you can audit, price, or hand off to your own team.",
  cards: [
    {
      title: 'Big Consulting Firms',
      subtitle: "The default when budget isn't the constraint",
      tint: 'blue' as const,
      highlighted: false,
      points: [
        {
          label: 'Priced by the hour',
          description: 'The incentive is more hours in the room, not a faster finish to a working system.',
        },
        {
          label: 'Junior teams do the work',
          description: "The partner who pitched you usually isn't the one building it.",
        },
        {
          label: 'A recommendation, not a system',
          description: 'You get a roadmap and a deck. Somebody still has to go build what it recommends.',
        },
        {
          label: "What you're left with",
          description: 'A shelf plan and an invoice.',
        },
      ],
    },
    {
      title: 'Cloud Vendor Programs',
      subtitle: 'Bundled into the contract you already have',
      tint: 'cyan' as const,
      highlighted: false,
      points: [
        {
          label: 'Built to sell the platform',
          description:
            "The tools included are the ones that keep you inside their cloud, not necessarily the ones that fit how your teams already work.",
        },
        {
          label: 'One framework for every company',
          description:
            "Generic adoption playbooks that don't account for your regulatory constraints, your org structure, or your culture.",
        },
        {
          label: 'Usage, not adoption',
          description: 'Success gets measured in licenses activated and API calls, not in workflows that actually changed.',
        },
        {
          label: "What you're left with",
          description: "A dashboard full of usage numbers and no proof anyone's job actually changed.",
        },
      ],
    },
    {
      title: 'The Specialized Approach',
      subtitle: 'Assessment-led. Owned by your team when we leave.',
      tint: 'violet' as const,
      highlighted: true,
      points: [
        {
          label: 'Fixed scope, fixed cost',
          description: 'One number, agreed before we start, with a named internal lead who owns the handoff.',
        },
        {
          label: 'Deployed, not recommended',
          description:
            "We ship the agentic workflows your teams use on Monday morning, not a deck telling someone else to build them.",
        },
        {
          label: 'Your team runs the assessment',
          description:
            "The Company Brain audit happens inside your systems, with your team leads at the table. It's your map, not a verdict handed down.",
        },
        {
          label: "What you're left with",
          description:
            "A working system, a trained team, and a named person on your side who can run it without us. The case studies below show what we built and handed over.",
        },
      ],
      proof: [
        { label: 'A UK insurtech scale-up', href: '/case-studies/insurtech-qa-knowledge-base' },
        { label: 'A European real-estate firm', href: '/case-studies/european-proptech-rag' },
      ],
    },
  ],
})

// Persona target: gatekeeper-coo (primary), same routing as AI_TRANSFORMATION_LANDSCAPE above.
// Reconciled against TRANSFORMATION_PHASES (the Map/Build/Train/Embed "how it works" arc): this
// is the "why it works this way" axis, not a second phases narrative.
export const AI_TRANSFORMATION_DIFFERENTIATORS = siteContent("enterprise-content.AI_TRANSFORMATION_DIFFERENTIATORS", {
  eyebrow: 'How we work',
  title: 'Governance and delivery. Never one without the other.',
  subtitle:
    "Every workflow ships with an audit trail, a named internal owner, and adoption data - the things your own leadership will ask about before they'll trust it.",
  items: [
    {
      title: 'Governance First',
      description:
        "We work inside your existing security review process, not a generic policy template. A named owner signs off before the first workflow ships.",
      tint: 'violet' as const,
    },
    {
      title: 'Deployed, Not Demoed',
      description:
        "We don't hand you a recommendation and leave. We hand you agentic workflows in production, a trained team, and documented processes.",
      tint: 'blue' as const,
    },
    {
      title: 'Built for Daily Work',
      description:
        "Every workflow ships against real work in your queue, then gets reviewed weekly against usage and time saved before we call it done - not left as a kickoff demo we walk away from.",
      tint: 'cyan' as const,
    },
    {
      title: 'Human Workflows',
      description:
        "We map how people already work, then build the AI around it: routine drafting, first-pass data pulls, and triage move to the system, so your team spends its time on the calls that need judgment.",
      tint: 'emerald' as const,
    },
    {
      title: 'Named Hypotheses, Not Hype',
      description:
        "We won't tell you AI changes everything. We'll tell you exactly where it will and won't help, with a specific hypothesis and a way to measure whether it worked.",
      tint: 'violet' as const,
    },
    {
      title: "Adoption Isn't an Accident",
      description:
        "We plan for resistance before it shows up: role-specific training scoped into the same fixed number as the build, a named internal owner, and adoption tracked in your own systems, not ours.",
      tint: 'blue' as const,
    },
  ],
})

export const LEARNING_JOURNEY_PILLARS = siteContent("enterprise-content.LEARNING_JOURNEY_PILLARS", [
  {
    title: 'Built for the role, not the tool',
    description: 'Your Legal team doesn\'t need “Intro to LLMs.” They need to know how AI changes contract review, compliance, and risk assessment. Every journey starts from the job, not the technology.',
  },
  {
    title: 'Self-paced, real-work assignments',
    description: 'No simulations. Each module asks learners to apply what they\'ve learned to live company work. The portfolio artifact they produce is the proof it stuck.',
  },
  {
    title: 'Deploy without external trainers',
    description: 'Team leads get a ready-to-run curriculum with facilitator guides, progress dashboards, and cohort management. You don\'t need us in the room.',
  },
  {
    title: 'Adoption you can measure',
    description: 'Completion rates, workflow adoption, and outcome metrics - not “satisfaction surveys.” Leadership gets numbers, not vibes.',
  },
])

export const JOB_FUNCTIONS_DETAILED = siteContent("enterprise-content.JOB_FUNCTIONS_DETAILED", [
  { name: 'Accounting', description: 'Automate reconciliation, accelerate month-end close, and build AI-assisted audit trails.' },
  { name: 'Advertising', description: 'AI-generated creative variants, audience targeting, and campaign performance analysis at speed.' },
  { name: 'Analytics', description: 'From dashboards to decisions. Agentic data pipelines, automated insight generation, and self-serve reporting.' },
  { name: 'Engineering', description: 'Spec-driven development with AI. Code generation, test automation, and agentic deployment workflows.' },
  { name: 'Brand', description: 'Brand voice consistency at scale. AI-assisted guidelines, asset generation, and messaging frameworks.' },
  { name: 'Content', description: 'Research, draft, edit, publish - with AI at every step. Your writers stay the authors.' },
  { name: 'Customer Support', description: 'Triage automation, knowledge base agents, and AI-assisted answers that help agents find the right response faster.' },
  { name: 'Customer Success', description: 'Churn prediction, health scoring, and automated playbooks that let CSMs focus on relationships.' },
  { name: 'Finance', description: 'FP&A automation, cash flow forecasting, and AI-assisted financial modeling.' },
  { name: 'Product Design', description: 'Design-to-code workflows, component generation, and rapid prototyping with AI copilots.' },
  { name: 'Growth', description: 'Experiment velocity, funnel analysis, and faster test-and-learn cycles on acquisition.' },
  { name: 'IT Systems', description: 'Ticket triage, infrastructure monitoring, and internal tool automation, so IT spends less time on tickets and more on the systems.' },
  { name: 'Leadership', description: 'Strategic decision support, board prep, and AI fluency for executives who need to lead the transformation.' },
  { name: 'Legal', description: 'Contract review, compliance monitoring, and risk assessment - faster, with AI as the first-pass analyst.' },
  { name: 'Machine Learning', description: 'Advanced workflows for ML teams: evaluation pipelines, fine-tuning strategies, and agentic model deployment.' },
  { name: 'Marketing', description: 'Campaign ideation, audience segmentation, and content personalization - from strategy to execution.' },
  { name: 'Operations', description: 'Process mapping, workflow automation, and operational intelligence that turns data into decisions.' },
  { name: 'People Ops', description: 'Onboarding automation, policy Q&A agents, and HR admin that gives the team time back. No AI scoring of people.' },
  { name: 'Product', description: 'User research synthesis, spec generation, and prioritization frameworks powered by AI - ship faster with less guesswork.' },
  { name: 'Recruiting', description: 'Sourcing research, job-description drafting, and interview preparation. Every hiring decision stays with people.' },
  { name: 'Revenue Operations', description: 'Pipeline intelligence, forecasting models, and cross-functional data workflows that sales and finance both trust.' },
  { name: 'Sales', description: 'Prospect research, outreach personalization, and deal intelligence - AI does the prep, so every rep walks in ready.' },
  { name: 'Engineering Management', description: 'Sprint planning, technical debt analysis, and team-owned delivery metrics - manage better with AI, not more meetings.' },
])

export const JOB_FUNCTIONS = siteContent("enterprise-content.JOB_FUNCTIONS", JOB_FUNCTIONS_DETAILED.map(f => f.name))

export const IDEAL_CLIENT_PROFILE = siteContent("enterprise-content.IDEAL_CLIENT_PROFILE", [
  'You have 150-500 people and your AI pilots aren\'t scaling past the team that built them',
  'You\'re doing $5M-$50M in revenue and want a fixed price and a defined end, not an open-ended consultancy bill',
  'You want every department using AI in their actual workflows, not one innovation team running demos',
])

export const ENTERPRISE_AFTER_TWELVE_WEEKS = siteContent("enterprise-content.ENTERPRISE_AFTER_TWELVE_WEEKS", [
  'Leadership has a transformation roadmap - not a slide deck that collects dust',
  'Every team in scope has role-specific AI skills built into its daily workflows',
  'Agentic workflows are running in production, maintained by your own people',
  'Your team owns a Company Brain for the departments in scope and decides whether to deploy it (a mid-sized tech company chose not to, and the case study says why), with the agentic operating system running in each department you signed off',
])

export const ENTERPRISE_FAQS = siteContent("enterprise-content.ENTERPRISE_FAQS", [
  {
    question: 'We\'ve already run AI pilots. Why aren\'t they scaling?',
    answer: 'Because pilots test tools, not workflows. The gap is usually the same: nobody sat down with each team to work out how its job should run with AI in it. We run that assessment with your leads, and they decide what changes.',
  },
  {
    question: 'How is this different from hiring a Big 4 firm?',
    answer: 'Speed, specificity, and cost. The engagement is scoped to 12 weeks, with the end date fixed at kickoff (our published reference ran six). We build role-based curricula your teams keep and re-run, not a strategy deck that sits on a shelf. And the price is fixed before we start: $120-250k, set by headcount and job families in scope.',
  },
  {
    question: 'Do you only work with technical teams?',
    answer: 'No. Our 20 role-based curricula cover Finance, Legal, Customer Support, Product, Design, Engineering, Growth, HR, and more. The non-technical teams are often where the repetitive work is heaviest.',
  },
  {
    question: 'What do we actually get at the end?',
    answer: 'Trained teams. Production-ready agentic workflows. A Company Brain mapping the processes in scope, if you choose to deploy it. Role-specific curricula your managers can re-run without us. And measurable adoption data - not a certificate.',
  },
])

// AIOS / open-source ecosystem. Vibrana maintains AIOS (aiosbrain.dev) - an
// open-source (AGPL-3.0, copyleft; verified against the aiosbrain repos and
// aiosbrain.dev, 2026-09-30) operating system for agentic teams. Featured on the
// homepage as proof that Vibrana builds the tools it teaches, with an outbound
// link to the standalone site (no full product page on vibrana.ai by decision).
export const AIOS_ECOSYSTEM = siteContent("enterprise-content.AIOS_ECOSYSTEM", {
  eyebrow: 'Open source · built in public',
  title: 'We don\'t just teach agentic work. We build the tools for it.',
  subtitle:
    'AIOS is our open-source operating system for agentic teams - the same substrate we deploy inside transformations. Every person gets a structured agent workspace; the team gets one shared brain that learns how you work and helps you collaborate.',
  points: [
    {
      title: 'A workspace for every person',
      description: 'Structured agent workspaces that give each person a repeatable, inspectable way to work with AI - not a chat window and a prayer.',
    },
    {
      title: 'One shared team brain',
      description: 'A team brain that learns how your organization actually works and helps people collaborate - the practical form of the Company Brain, when a client chooses to deploy one.',
    },
    {
      title: 'Open source (AGPL-3.0) and self-hosted',
      description: 'Licensed under AGPL-3.0 and self-hosted on your own infrastructure. You decide what leaves your machine - no lock-in, no black box, no data leaving your control by default.',
    },
  ],
  cta: {
    text: 'Explore AIOS on aiosbrain.dev',
    href: 'https://aiosbrain.dev',
  },
  note: 'AGPL-3.0 · self-hosted · maintained by Vibrana',
})

export const INQUIRY_OPTIONS = siteContent("enterprise-content.INQUIRY_OPTIONS", {
  intents: [
    'Company-wide AI transformation',
    'Role-based curricula for one or more teams',
    'AI builder sprint',
    'Retreat inquiry',
    'Other',
  ],
  teamSizes: ['1-50 employees', '50-150 employees', '151-250 employees', '251-350 employees', '351-500 employees', '500+ employees'],
  revenueBands: ['Under $5M', '$5M-$10M', '$10M-$25M', '$25M-$50M', '$50M+'],
  timelines: ['Immediate', 'This quarter', 'Next quarter', 'Exploring'],
})

// ENTERPRISE_ASCII_CLOSING removed (2026-09-30): never rendered. AsciiField renders no text by
// JE's ruling, and the homepage has its own transformation closing (ENTERPRISE_HOME_SECTIONS).

// COLLECTIVE_CONTENT removed - the Collective concept is shelved until there's
// more revenue in the door (JE, 2026-07). Vibrana presents as a simple studio.
