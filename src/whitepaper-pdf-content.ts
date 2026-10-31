import { siteContent } from '@/src/site-content'
// Content for the AI Transformation whitepaper PDF (public/downloads/public-demo-guide.txt).
// Page copy is data (repo rule): scripts/whitepaper/*.tsx render these strings and hold
// layout only. Rebuild with `npm run whitepaper:build`.
//
// Sourcing rule (version 2.0, October 2026): every figure in this paper traces to a
// verified, publishable finding in the Vibrana knowledge base (hub `knowledge/findings/`),
// in the finding's own wording, and its source is in `references` below. Anything without
// such a finding was cut, not replaced (see the AI Readiness touchpoint audit, hub
// `gtm/programs/ai-readiness/audit.md`, whitepaper section and fix list items 17 and 18).
// Material that is Vibrana's own framework (maturity matrix, readiness pillars, roadmap,
// use-case tiers, some success factors) is labeled "Vibrana's working model" in the PDF and
// carries no figure presented as research.
//
// Do not add a number here without first filing it as a verified finding in the KB.
// The MIT NANDA "95% of organizations get zero return" figure is KB-contested: it appears
// only in Section 3.1, with its method and the authors' "directionally accurate" caveat.
//
// Earlier history: ported from the john-ellison.com whitepaper generator (commits 8cbcbb4,
// b47b5c6, since removed from that repo); fake urgency and an invented "45-minute call"
// offer were removed in version 1.0.

export interface WhitepaperCoverStat {
  value: string
  label: string
  accent: 'violet' | 'blue' | 'amber'
}

export interface WhitepaperMeta {
  title: string
  subtitle: string
  description: string
  author: string
  publisher: string
  date: string
  version: string
  coverStats: WhitepaperCoverStat[]
}

export interface WhitepaperCtaContent {
  title: string
  subtitle: string
  buttonLabel: string
  url: string
  featuresLabel: string
  features: string[]
  reassurance: string
}

export interface WhitepaperReference {
  source: string
  title: string
  details: string
}

export interface TableRow {
  [key: string]: string
}

// Label used on every section that is Vibrana's own framework rather than research.
export const WORKING_MODEL_LABEL = siteContent("whitepaper-pdf-content.WORKING_MODEL_LABEL", "Vibrana's working model")

// === METADATA ===
export const whitepaperMeta: WhitepaperMeta = siteContent("whitepaper-pdf-content.whitepaperMeta", {
  title: 'AI Transformation',
  subtitle: 'Optimism vs. Reality',
  description:
    'What the better-documented research says about the gap between AI adoption and AI value, and what the organizations getting value do differently.',
  author: 'John Ellison',
  publisher: 'Vibrana',
  date: 'October 2026',
  version: '2.0',
  coverStats: [
    // KB: findings/pwc-ceo-survey-2026-56-percent-no-ai-benefit
    { value: '56%', label: 'of CEOs have seen neither higher revenue nor lower costs from AI (PwC, 2026)', accent: 'amber' },
    // KB: findings/mckinsey-state-of-ai-2026-ebit-impact-flat
    { value: '37%', label: 'of respondents attribute any EBIT impact to AI (McKinsey, 2026)', accent: 'violet' },
    // KB: findings/bcg-wheres-the-value-in-ai-only-26-percent-beyond-poc
    { value: '26%', label: 'of companies have moved beyond proofs of concept to extract value (BCG, 2024)', accent: 'blue' },
  ],
})

// === EXECUTIVE SUMMARY ===
export const executiveSummary = siteContent("whitepaper-pdf-content.executiveSummary", {
  intro:
    'Most organizations now use AI somewhere. Far fewer can point to a result in their financials. This paper sets out what the better-documented research says about that gap, and what the organizations getting value do differently.',
  opportunity: {
    headline: 'The Opportunity',
    stats: 'Measured gains in real work',
    // KB: findings/brynjolfsson-2023-15-percent-productivity, findings/dellacqua-2023-inside-frontier-gains
    details:
      "Among 5,172 customer support agents, access to a generative AI assistant raised issues resolved per hour by 15% on average (Brynjolfsson, Li and Raymond). In a randomized experiment, BCG consultants using GPT-4 on tasks within AI's capability completed 12.2% more tasks, 25.1% faster, at significantly higher quality (Dell'Acqua et al.).",
  },
  reality: {
    headline: 'The Reality',
    stats: '56% of CEOs see neither revenue nor cost benefit',
    // KB: findings/pwc-ceo-survey-2026-56-percent-no-ai-benefit, findings/mckinsey-state-of-ai-2026-ebit-impact-flat
    details:
      "In PwC's 2026 Global CEO Survey, 56% say their company has seen neither higher revenues nor lower costs from AI, and only one in eight (12%) report both. In McKinsey's 2026 survey, 37% of respondents attribute at least some EBIT impact to AI, about the same share as the year before.",
  },
  divide: {
    headline: 'The Divide',
    stats: 'About 6% are AI high performers',
    // KB: findings/mckinsey-state-of-ai-2026-ebit-impact-flat, findings/mckinsey-state-of-ai-2026-high-performers-redesign-workflows
    details:
      "McKinsey counts about 6% of its 2026 respondents as AI high performers. Nearly three-quarters of them report fundamentally redesigning workflows because of their AI use, against one-quarter of other respondents.",
  },
  questionsTitle: 'Four Questions This Paper Answers',
  questions: [
    'What is actually working, and where is the evidence strongest?',
    'Why do initiatives fail? What gets in the way, and what do the organizations getting value do differently?',
    'What operating models drive scale? How should enterprises structure governance, teams, and workflows to move from pilots to production?',
    "Where to start? A phase-based approach to assess readiness, pick a first workflow, and execute with discipline.",
  ],
})

// === SECTION 1 ===
export const sectionOne = siteContent("whitepaper-pdf-content.sectionOne", {
  definitionTitle: "What 'AI Transformation' Means",
  definition:
    'AI transformation is the redesign of business processes, workflows, and operating models to embed AI decision-making, automation, and augmentation into core functions. It differs materially from automation, analytics modernization, and GenAI copilots.',
  involvesTitle: 'True AI Transformation Involves:',
  involves: [
    'Workflow redesign: Reimagining processes end-to-end, not bolting AI onto existing steps',
    'Organizational integration: Embedding AI into daily operations, not experimental silos',
    'Decision democratization: Enabling faster, data-driven decisions at scale',
    'Continuous learning loops: Building systems that adapt based on outcomes',
  ],
  maturityTitle: 'Maturity Models',
  // KB: findings/bcg-wheres-the-value-in-ai-only-26-percent-beyond-poc, findings/mckinsey-state-of-ai-2026-ebit-impact-flat
  maturity:
    "There is no single standard maturity model. The matrix on the next page is Vibrana's working model, a way to place an organization across six dimensions; it is not research. For where organizations actually stand: BCG found that of the 98% of companies at least experimenting with AI, only 26% had developed the capabilities to move beyond proofs of concept and begin extracting value, and only 4% were at the forefront. McKinsey counts about 6% of its 2026 respondents as AI high performers.",
  maturityStats: [
    { value: '26%', label: 'Of companies past proofs of concept, extracting value (BCG, 2024)' },
    { value: '~6%', label: 'Of respondents are AI high performers (McKinsey, 2026)' },
  ],
})

// === MATURITY MODEL TABLE (Vibrana's working model, not research) ===
export const maturityModelTable = siteContent("whitepaper-pdf-content.maturityModelTable", {
  title: `AI Maturity Model Matrix (${WORKING_MODEL_LABEL})`,
  headers: ['Dimension', 'Nascent (1)', 'Emerging (2)', 'Developing (3)', 'Advanced (4)', 'Optimized (5)'],
  rows: [
    {
      dimension: 'Strategy',
      nascent: 'Ad hoc exploration',
      emerging: 'Pilot programs identified',
      developing: 'Business case defined',
      advanced: 'Aligned roadmap',
      optimized: 'Transformation north star',
    },
    {
      dimension: 'Data',
      nascent: 'Fragmented silos',
      emerging: 'Partial integration',
      developing: 'Quality standards emerging',
      advanced: 'Governed architecture',
      optimized: 'Real-time, lineaged, auditable',
    },
    {
      dimension: 'Talent',
      nascent: 'Few AI specialists',
      emerging: 'Team forming',
      developing: 'Training programs launched',
      advanced: 'Centers of Excellence',
      optimized: 'Embedded AI literacy',
    },
    {
      dimension: 'Governance',
      nascent: 'None',
      emerging: 'Reactive policies',
      developing: 'Frameworks drafted',
      advanced: 'Embedded controls',
      optimized: 'Autonomous with oversight',
    },
    {
      dimension: 'Technology',
      nascent: 'Manual tooling',
      emerging: 'Select platforms',
      developing: 'Integrated stack',
      advanced: 'Scalable infrastructure',
      optimized: 'Agentic autonomous systems',
    },
    {
      dimension: 'Outcomes',
      nascent: 'Learning only',
      emerging: 'Pilots showing promise',
      developing: 'Early use cases in production',
      advanced: 'Impact measured in some areas',
      optimized: 'Impact measured company-wide',
    },
  ],
})

// === SECTION 2: PRODUCTIVITY IMPACTS ===
// Only figures with a verified KB finding. Every other row (self-reported 40%, 5.4% of
// hours, 34% novices, sales and cost-reduction figures) was cut: no KB finding.
export const productivityImpacts = siteContent("whitepaper-pdf-content.productivityImpacts", {
  title: 'Measured Productivity Impacts',
  intro:
    'The strongest evidence on productivity comes from controlled studies of specific jobs, not from surveys of expectations. Two of the best documented:',
  categories: [
    {
      category: 'Customer Service',
      impacts: [
        // KB: findings/brynjolfsson-2023-15-percent-productivity, findings/brynjolfsson-2023-top-agents-quality-dip
        {
          metric: '15%',
          description:
            'More issues resolved per hour, on average, among 5,172 customer support agents given a generative AI assistant. Gains varied widely: the most skilled agents saw minimal gains and a small drop in conversation quality (Brynjolfsson, Li and Raymond, 2023)',
        },
      ],
    },
    {
      category: 'Knowledge Work',
      impacts: [
        // KB: findings/dellacqua-2023-inside-frontier-gains, findings/dellacqua-2023-outside-frontier-worse
        {
          metric: '25.1%',
          description:
            "Faster task completion for BCG consultants using GPT-4 on 18 realistic consulting tasks within AI's capability; they also completed 12.2% more tasks, at significantly higher quality. On a task chosen to sit outside AI's capability, AI users were 19% less likely to get the right answer (Dell'Acqua et al.)",
        },
      ],
    },
  ],
})

// === USE CASE TIERS (Vibrana's working model, not research) ===
export const useCaseTiers = siteContent("whitepaper-pdf-content.useCaseTiers", {
  title: `Which Use Cases Deliver Value First? (${WORKING_MODEL_LABEL})`,
  tiers: [
    {
      tier: 'High-Velocity Wins',
      timeline: 'Weeks 1-3',
      examples: [
        'FAQ automation & customer self-service',
        'Email/document classification & routing',
        'Routine report generation',
        'Meeting summaries & action item extraction',
      ],
    },
    {
      tier: 'Quick Wins',
      timeline: 'Months 1-3',
      examples: [
        // KB: findings/brynjolfsson-2023-15-percent-productivity
        'Customer service agent assist (15% more issues resolved per hour in one field study)',
        'Demand forecasting (supply chain optimization)',
        'Compliance document review',
        'First-level customer support automation',
      ],
    },
    {
      tier: 'Medium-Term Value',
      timeline: 'Months 3-6',
      examples: [
        'Complex document processing (contracts, claims)',
        'Predictive maintenance (manufacturing)',
        'Personalization engines (retail, media)',
        'Supply chain network optimization',
      ],
    },
    {
      tier: 'Strategic/Transformational',
      timeline: 'Months 6-18+',
      examples: [
        'Core process automation (end-to-end workflows)',
        'New product lines powered by AI',
      ],
    },
  ],
})

// === SECTION 3: THE REALITY ===
export const failureEvidence = siteContent("whitepaper-pdf-content.failureEvidence", {
  title: 'What the Failure Numbers Measure',
  // KB: findings/mit-nanda-genai-divide-95-percent-zero-return (contested), sources/mit-nanda-2025-genai-divide
  paragraph:
    "The most quoted figure, that 95% of organizations are getting zero return on generative AI, comes from MIT NANDA's preliminary 2025 report, The GenAI Divide. Its method is a review of 300+ publicly disclosed AI initiatives, structured interviews with representatives of 52 organizations, and a survey of 153 senior leaders at four industry conferences. The authors describe their figures as directionally accurate, so treat the 95% as a provocation, not a measurement. Larger surveys find a smaller but still wide gap, and each one measures something different:",
  stats: [
    // KB: findings/pwc-ceo-survey-2026-56-percent-no-ai-benefit
    { value: '56%', label: 'Of CEOs saw neither higher revenue nor lower costs from AI (PwC, 2026, 4,454 CEOs)' },
    // KB: findings/mckinsey-state-of-ai-2026-ebit-impact-flat
    { value: '37%', label: 'Of respondents attribute at least some EBIT impact to AI (McKinsey, 2026)' },
    // KB: findings/bcg-wheres-the-value-in-ai-only-26-percent-beyond-poc
    { value: '26%', label: 'Of companies have moved beyond proofs of concept to extract value (BCG, 2024)' },
    // KB: findings/mit-nanda-genai-divide-95-percent-zero-return (contested)
    { value: '95%', label: 'Of organizations getting zero return, per MIT NANDA (preliminary; directional)' },
  ],
})

// Replaces the former "Top 10 AI Adoption Barriers" table, whose percentages had no KB
// finding (and whose #1, data quality, conflicts with verified findings below).
export const barriersTable = siteContent("whitepaper-pdf-content.barriersTable", {
  title: 'What Gets in the Way',
  intro: 'Where the research looks at causes, it points at people and process far more often than at technology.',
  rows: [
    {
      barrier: 'Organizational, not technical',
      // KB: findings/bain-ai-native-enterprise-barriers-organizational-not-technical
      finding:
        'Executives cite data security, hallucinations and unproven ROI as barriers, while only 4% cite lack of executive support. Bain\'s read: "The most prominent barriers to AI adoption today are organizational, not technical."',
      source: 'Bain & Company, 2026',
    },
    {
      barrier: 'People and process',
      // KB: findings/bcg-wheres-the-value-in-ai-70-percent-challenges-people-process
      finding:
        'About 70% of the challenges companies face implementing AI relate to people and process, about 20% to technology, and only 10% to AI algorithms.',
      source: 'BCG, 2024',
    },
    {
      barrier: 'Resistance to new tools',
      // KB: findings/mit-nanda-genai-divide-resistance-top-barrier
      finding:
        'In a survey of executive sponsors and frontline users at 52 organizations, resistance to adopting new tools was rated the most frequent barrier to scaling gen AI pilots.',
      source: 'MIT NANDA, 2025',
    },
  ] satisfies TableRow[],
})

export const learningGap = siteContent("whitepaper-pdf-content.learningGap", {
  title: '"Learning Gap" vs. "Model Gap": The Core Issue',
  // KB: findings/mit-nanda-genai-divide-learning-gap, findings/mit-nanda-genai-divide-driven-by-approach-not-models
  intro:
    'MIT NANDA concludes that the divide does not seem to be driven by model quality or regulation, but by approach. It names the learning gap as the primary factor keeping organizations from value.',
  beliefLabel: 'INDUSTRY BELIEF',
  belief: 'The problem is model quality, so we need better models.',
  realityLabel: 'REALITY',
  reality: "The problem is a learning gap: tools that don't learn, integrate poorly, or match workflows.",
  successTitle: 'What Closes the Gap',
  success: [
    'Embedding AI into actual workflows (not sandbox testing)',
    'Collecting and acting on feedback loops',
    'Continuous retraining on domain-specific data',
    'Human-in-the-loop validation and learning',
  ],
})

// === SECTION 4: READINESS FRAMEWORK (Vibrana's working model) ===
// Six pillars, the same six dimensions as the 24-question assessment
// (src/lib/assessment/scoring.ts ORG_DIMENSIONS). `evidence` appears only where a verified
// KB finding supports it; the former per-pillar figures (40% timelines, 3x talent, 6%
// governance, 35%/68% bias) had none and were cut.
export const readinessFramework = siteContent("whitepaper-pdf-content.readinessFramework", {
  title: 'AI Readiness Framework',
  intro: `${WORKING_MODEL_LABEL}: the same six dimensions as our 24-question assessment. Published evidence is cited where it exists.`,
  pillars: [
    {
      number: 1,
      name: 'Leadership & Strategy',
      description: 'Clear C-suite mandate for AI, and a structured way to choose use cases',
      // KB: findings/mckinsey-state-of-ai-2026-senior-leader-commitment
      evidence: 'AI high performers are twice as likely as others to say their senior leaders demonstrate commitment to AI initiatives (McKinsey, 2026)',
    },
    {
      number: 2,
      name: 'Data Readiness',
      description: 'Clean, accessible, governable data that the chosen workflows actually need',
    },
    {
      number: 3,
      name: 'Technology Infrastructure',
      description: 'Cloud-native or hybrid deployment capability, with monitoring for AI in production',
    },
    {
      number: 4,
      name: 'Talent & Capability',
      description: 'Your own domain experts, data skills, and change champions',
    },
    {
      number: 5,
      name: 'Governance & Responsible AI',
      description: 'Clear ownership, bias testing, explainability standards, and audit trails',
    },
    {
      number: 6,
      name: 'Culture & Change Readiness',
      description: 'People willing and able to change how they work, with support to do it',
      // KB: findings/mit-nanda-genai-divide-resistance-top-barrier
      evidence: 'Resistance to adopting new tools was rated the most frequent barrier to scaling gen AI pilots (MIT NANDA, 2025)',
    },
  ] as { number: number; name: string; description: string; evidence?: string }[],
})

// === SECTION 5: PHASED IMPLEMENTATION ROADMAP (Vibrana's working model) ===
export const implementationRoadmap = siteContent("whitepaper-pdf-content.implementationRoadmap", {
  title: `Phased Implementation (${WORKING_MODEL_LABEL})`,
  // KB: findings/mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect
  intro:
    'Start from one workflow. Out of 25 organizational attributes McKinsey tested, the redesign of workflows had the biggest effect on whether an organization saw EBIT impact from gen AI. The phases below are how Vibrana sequences that work; the week ranges are planning assumptions, not research. Each phase ends in a go/no-go decision, and you can stop at any of them.',
  phases: [
    {
      phase: 1,
      name: 'Discover & Assess',
      timeline: 'Weeks 1-8',
      activities: [
        'Conduct an AI readiness audit across the six dimensions',
        'Interview the leaders who own the target workflows',
        'Map current state maturity and identify quick wins',
      ],
      deliverable: 'AI Readiness Report with gap analysis and prioritized initiatives',
    },
    {
      phase: 2,
      name: 'Prioritize Use Cases',
      timeline: 'Weeks 5-12',
      activities: [
        'Score the candidate use cases on Impact, Feasibility, Risk',
        'Apply ICE scoring: Impact x Confidence / Effort',
        'Select 2-3 pilot use cases for quick wins',
      ],
      deliverable: 'Prioritized AI roadmap with 18-month horizon',
    },
    {
      phase: 3,
      name: 'Prototype & Proof',
      timeline: 'Weeks 8-20',
      activities: [
        'Build minimum viable prototype for Pilot #1',
        'Establish baseline metrics and success criteria',
        'Run 4-8 week pilot with real users and real data',
      ],
      deliverable: 'Pilot results, lessons learned, go/no-go decision',
    },
    {
      phase: 4,
      name: 'Productionize',
      timeline: 'Weeks 16-32',
      activities: [
        'Harden solution for production: MLOps, monitoring, governance',
        'Implement model risk management (version control, bias testing)',
        'Conduct security review and regulatory sign-off',
      ],
      deliverable: 'Production deployment with ongoing monitoring',
    },
    {
      phase: 5,
      name: 'Scale',
      timeline: 'Months 6-18',
      activities: [
        'Expand only where a pilot beat its baseline; stop where it did not',
        'Roll out to additional functions/geographies',
        'Hand over reusable components and playbooks to your team',
      ],
      deliverable: 'Production use cases your team owns and runs',
    },
  ],
})

// === SECTION 6: HIGH PERFORMERS VS. THE REST ===
// Only characteristics with a verified KB finding. Cut (no KB finding): "3x further advanced
// with AI agents", "3x human-validation processes", "20%+ of digital budget", "2+ business
// functions", and every outcome line ("5%+ EBIT vs <1%", "39% see productivity double").
export const highPerformerProfile = siteContent("whitepaper-pdf-content.highPerformerProfile", {
  title: "What AI High Performers Do (About 6% of McKinsey's Respondents)",
  characteristicsLabel: 'WHAT THE RESEARCH SHOWS',
  characteristics: [
    // KB: findings/mckinsey-state-of-ai-2026-high-performers-redesign-workflows
    'Nearly three-quarters report fundamentally redesigning workflows because of their AI use, up from 55 percent the year before. Just one-quarter of other respondents do (McKinsey, 2026).',
    // KB: findings/mckinsey-state-of-ai-2026-senior-leader-commitment
    'Twice as likely as others to say their senior leaders demonstrate commitment to AI initiatives (McKinsey, 2026).',
    // KB: findings/mckinsey-state-of-ai-2026-senior-leader-commitment
    'Twice as likely to report that their organizations have defined processes to measure the impact of AI initiatives (McKinsey, 2026).',
  ],
  restTitle: `The Pattern When AI Stalls (${WORKING_MODEL_LABEL})`,
  rest: [
    'AI viewed as a tool to optimize existing processes (cost reduction first)',
    'Pilots remain disconnected from workflows; never embedded operationally',
    'No clear business case; impact unclear or not measured',
    'Governance absent or reactive',
    'Leaders not visibly championing AI',
  ],
})

// === SECTION 7: CRITICAL SUCCESS FACTORS ===
// The former intro ("Based on analysis of 50+ successful AI transformations") described an
// analysis that never happened and was cut. `evidence` cites a verified KB finding where one
// exists; the rest are labeled as Vibrana's working model.
export const criticalSuccessFactorsIntro =
  siteContent("whitepaper-pdf-content.criticalSuccessFactorsIntro", "Eight factors that separate AI programs that scale from those that stall. Where published research supports a factor, the evidence line cites it. The rest are Vibrana's working model and are labeled that way.")

export const criticalSuccessFactors = siteContent("whitepaper-pdf-content.criticalSuccessFactors", [
  {
    number: 1,
    title: 'Workflow Redesign (Not Automation)',
    description: 'Fundamental rethinking of how work gets done, not bolting AI onto rigid processes.',
    // KB: findings/mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect
    evidence: 'Of 25 attributes McKinsey tested, the redesign of workflows had the biggest effect on whether organizations saw EBIT impact from gen AI (McKinsey, 2025).',
  },
  {
    number: 2,
    title: 'Executive Ownership',
    description: 'C-suite actively championing AI, not delegating to IT.',
    // KB: findings/mckinsey-state-of-ai-2026-senior-leader-commitment
    evidence: 'AI high performers are twice as likely as others to say their senior leaders demonstrate commitment to AI initiatives (McKinsey, 2026).',
  },
  {
    number: 3,
    title: 'Ambitious Goals',
    description: 'Treating AI as a transformation lever, not only an efficiency tool.',
    evidence: `${WORKING_MODEL_LABEL}.`,
  },
  {
    number: 4,
    title: 'Data Readiness',
    description: 'Clean, accessible, governed data for the workflows you are changing.',
    evidence: `${WORKING_MODEL_LABEL}.`,
  },
  {
    number: 5,
    title: 'Embedded Governance',
    description: 'Governance integrated into design, not retrofitted post-deployment.',
    evidence: `${WORKING_MODEL_LABEL}.`,
  },
  {
    number: 6,
    title: 'Rapid Iteration',
    description: 'Short cycles from prototype to real users, so the team learns what works before scaling it.',
    evidence: `${WORKING_MODEL_LABEL}.`,
  },
  {
    number: 7,
    title: 'Cross-Functional Collaboration',
    description: 'Clear ownership; teams aligned on business objectives across functions.',
    evidence: `${WORKING_MODEL_LABEL}.`,
  },
  {
    number: 8,
    title: 'Continuous Learning',
    description: 'Organizations that capture feedback, retrain models, and iterate.',
    // KB: findings/mit-nanda-genai-divide-learning-gap
    evidence: "MIT NANDA names the learning gap, tools that don't learn, integrate poorly, or match workflows, as the primary factor keeping organizations from value (2025).",
  },
])

// === SECTION 8: AI READINESS DIAGNOSTIC ===
// A discussion checklist on the same six dimensions as the 24-question assessment. The
// former "30 minutes" and seven-dimension framing, and the scoring guide (unsourced bands and
// a "6-12 month build-out before pilots" recommendation), were cut.
export const readinessDiagnostic = siteContent("whitepaper-pdf-content.readinessDiagnostic", {
  intro:
    "A checklist for a leadership team to talk through, grouped by the same six dimensions as Vibrana's 24-question readiness assessment. It is a conversation aid, not a scored test. For a scored version, take the assessment at vibrana.ai/ai-transformation/assessment.",
  dimensions: [
    {
      name: 'Leadership & Strategy',
      questions: [
        'Clear C-suite mandate for AI transformation?',
        'Explicit business outcomes defined?',
        'High-impact use cases identified, prioritized, and owned by the business?',
      ],
    },
    {
      name: 'Data Readiness',
      questions: [
        'Critical business data consolidated in an accessible repository?',
        'Data quality standards defined and enforced?',
        'Data lineage and metadata tracked?',
      ],
    },
    {
      name: 'Technology Infrastructure',
      questions: ['MLOps platform in place?', 'Cloud or hybrid infrastructure capable of scale?', 'Security/compliance tooling integrated?'],
    },
    {
      name: 'Talent & Capability',
      questions: ['Data engineers and ML practitioners on staff?', 'Change champions embedded in business units?', "Leadership's AI literacy?"],
    },
    {
      name: 'Governance & Responsible AI',
      questions: ['AI governance policy documented and enforced?', 'Bias detection and mitigation processes?', 'Regulatory compliance framework?'],
    },
    {
      name: 'Culture & Change Readiness',
      questions: ['Change management plan documented?', 'Employee AI trust / adoption readiness?', 'Workforce reskilling program in place?'],
    },
  ],
})

// === GOVERNANCE CHECKLIST ===
export const governanceChecklist = siteContent("whitepaper-pdf-content.governanceChecklist", {
  intro: 'Before deploying any AI system to production, enterprises should validate the following.',
  categories: [
    {
      category: 'Data & Model Risk',
      items: [
        'Data sourced and validated for accuracy, recency, and freedom from bias',
        'Model trained on representative data (demographics, geographies, edge cases)',
        'Bias testing completed (disparate impact analysis for protected groups)',
        'Model explainability validated (can business explain why decision X was made)',
        'Model documentation complete (architecture, training data, performance benchmarks)',
        'Monitoring in place (accuracy drift, fairness drift, data drift detection)',
      ],
    },
    {
      category: 'Security & Privacy',
      items: [
        'Model protected against prompt injection, adversarial inputs, poisoning',
        'Data encrypted at rest and in transit',
        'Access controls restrict model/data access by role and function',
        'Audit logs capture who accessed what, when',
        'Data retention policy defined (especially for training data)',
      ],
    },
    {
      category: 'Regulatory & Compliance',
      items: [
        'Legal review completed (liability, IP ownership, data usage rights)',
        'EU AI Act compliance assessed (if applicable)',
        'GDPR compliance validated (right to explanation, data minimization)',
        'Sector-specific regulations addressed (HIPAA, SOX, AML, etc.)',
        'Insurance/indemnification in place for third-party models',
      ],
    },
    {
      category: 'Operational & Change Management',
      items: [
        'Business owner assigned with clear accountability',
        'SLAs defined (uptime, latency, accuracy thresholds)',
        'Escalation path clear (what happens if model fails)',
        'User training completed; adoption plan tracked',
        'Rollback plan documented (how to revert if issues arise)',
      ],
    },
  ],
})

// === MYTH VS TRUTH TABLE ===
// The former "Data quality can be fixed later" row (52%, "#1 blocker", "4-8 weeks") and the
// "reduce risk by 40% and compress timelines by 50%" claim had no KB finding and were cut.
// "We should wait for better models" was cut too: its truth line was unsourced and the
// first row already makes the point with MIT NANDA's finding.
export const mythVsTruthTable = siteContent("whitepaper-pdf-content.mythVsTruthTable", {
  title: 'AI Transformation: Myth vs. Truth',
  rows: [
    {
      myth: '"Better AI models solve the failure problem"',
      // KB: findings/mit-nanda-genai-divide-driven-by-approach-not-models, findings/mit-nanda-genai-divide-learning-gap
      truth:
        "MIT NANDA finds the divide is driven by approach, not model quality. The gap is learning: tools that don't learn, integrate poorly, or match workflows.",
    },
    {
      myth: '"AI adoption is a tech problem"',
      // KB: findings/bcg-wheres-the-value-in-ai-70-percent-challenges-people-process
      truth:
        'BCG puts about 70% of AI implementation challenges in people and process, about 20% in technology, and only 10% in the algorithms. Treat it as organizational change, not software deployment.',
    },
    {
      myth: '"ROI will be obvious once deployed"',
      // KB: findings/mckinsey-state-of-ai-2026-senior-leader-commitment
      truth:
        'Define baselines and success metrics before launch. AI high performers are twice as likely as others to report defined processes to measure the impact of AI initiatives (McKinsey, 2026).',
    },
  ],
})

// === CONCLUSION ===
// Replaces the former "Recommendations by Readiness Score" page (unsourced score bands and
// 6-12 / 9-18 / 18-36 month timelines). Restates only what the cited findings above say.
export const conclusion = siteContent("whitepaper-pdf-content.conclusion", {
  title: 'Conclusion',
  paragraphs: [
    'The research cited here agrees on more than it disagrees. Value from AI that shows up in the financials is still a minority result: PwC, McKinsey and BCG each find this, measured three different ways.',
    'The causes they point to are mostly people and process. BCG puts about 70% of implementation challenges there. Bain calls the most prominent barriers organizational, not technical. MIT NANDA names the learning gap and resistance to new tools.',
    'The organizations getting value redesign workflows, have senior leaders who visibly commit, and measure impact. The practical starting point is one workflow, redesigned with the people who do it, with a baseline measured before anything changes.',
    // Vibrana's own position (product-marketing-context: "scaling, not cutting"; sprint FAQ: you own what is built).
    "How Vibrana works: our builders sit alongside your team, not in place of it. The aim is more capacity and wider scope for the people who do the work, not fewer people. Your team owns and runs what is built after handover.",
  ],
})

// === REFERENCES ===
// One row per source cited above. Each has a source page in the hub knowledge base
// (knowledge/sources/<slug>.md); publisher, title and date are taken from it.
// WHITEPAPER_SOURCE_COUNT in src/whitepaper-claims-content.ts must equal references.length.
export const references: WhitepaperReference[] = siteContent("whitepaper-pdf-content.references", [
  {
    source: 'PwC',
    title: "PwC's 29th Global CEO Survey: Leading through uncertainty in the age of AI",
    details: 'January 2026. Survey of 4,454 chief executives across 95 countries and territories.',
  },
  {
    source: 'McKinsey & Company',
    title: 'The state of AI in 2026: On the road to ROI',
    details: 'August 2026. Online survey of 1,719 participants in 97 nations, May to June 2026.',
  },
  {
    source: 'McKinsey & Company',
    title: 'The state of AI: How organizations are rewiring to capture value',
    details: 'March 2025. Online survey of 1,491 participants in 101 nations, July 2024.',
  },
  {
    source: 'Boston Consulting Group',
    title: "Where's the Value in AI?",
    details: 'October 2024. Survey of 1,000 CxOs and senior executives across 20+ sectors and 59 countries.',
  },
  {
    source: 'MIT NANDA (Project NANDA, MIT Media Lab)',
    title: 'The GenAI Divide: State of AI in Business 2025',
    details:
      'July 2025, preliminary findings (v0.1). Review of 300+ publicly disclosed AI initiatives, structured interviews with representatives of 52 organizations, survey of 153 senior leaders.',
  },
  {
    source: 'Bain & Company',
    title: 'The AI-Native Enterprise: Absorption Is the New Advantage (Technology Report 2026)',
    details: 'September 2026. Bain client experience and the Bain GenAI Survey 2026.',
  },
  {
    source: 'Erik Brynjolfsson, Danielle Li, Lindsey Raymond (NBER)',
    title: 'Generative AI at Work',
    details:
      'April 2023, NBER Working Paper 31161; published in the Quarterly Journal of Economics (2025). Field study of 5,172 customer support agents.',
  },
  {
    source: "Fabrizio Dell'Acqua et al. (Organization Science)",
    title:
      'Navigating the Jagged Technological Frontier: Field Experimental Evidence of the Effects of AI on Knowledge Worker Productivity and Quality',
    details: 'First circulated 2023 as HBS Working Paper 24-013. Preregistered randomized experiment with 758 BCG consultants.',
  },
])

// === TABLE OF CONTENTS ===
// Page numbers below are verified against the actual built PDF (see
// `pdftotext -f <n> -l <n> public/downloads/public-demo-guide.txt -` per
// page), not estimated. Section 10 spans Myth vs. Truth, the conclusion, references and
// the back-cover CTA. Re-verify after any content or style change that could shift
// pagination, by rebuilding and re-checking each section's actual start page.
export const tableOfContents = siteContent("whitepaper-pdf-content.tableOfContents", [
  { section: 'Executive Summary', pages: '3-4' },
  { section: '1. Framing AI Transformation', pages: '5-6' },
  { section: '2. The Promise: What AI Delivers', pages: '7-8' },
  { section: '3. The Reality: Why Most Initiatives Fail', pages: '9-11' },
  { section: '4. Operating Models & Governance', pages: '12' },
  { section: '5. Implementation Roadmap', pages: '13-14' },
  { section: '6. High Performers vs. the Rest', pages: '15' },
  { section: '7. Critical Success Factors', pages: '16-17' },
  { section: '8. AI Readiness Diagnostic', pages: '18-19' },
  { section: '9. Governance Checklist', pages: '20-21' },
  { section: '10. Conclusion & Call to Action', pages: '22-25' },
])

// === CTA (back cover) ===
// Matches Vibrana's real, existing offer (src/ai-transformation-content.ts `assessment`
// block: 24 questions, six dimensions, personalized report, no obligation).
export const whitepaperCta: WhitepaperCtaContent = siteContent("whitepaper-pdf-content.whitepaperCta", {
  title: 'Where Does Your Organization Stand?',
  subtitle:
    'The next step is mapping your own readiness risks. If you then want to build, a sprint has a fixed price, scope and end date agreed before it starts, from $10,000, and you own what we build.',
  buttonLabel: 'Take the Readiness Assessment',
  url: 'vibrana.ai/ai-transformation/assessment',
  featuresLabel: 'The Free Readiness Assessment Includes:',
  features: ['24 self-reported questions', 'Six readiness dimensions', 'A personalized discussion report', 'No obligation to enter a transformation engagement'],
  reassurance: 'A structured conversation aid, not a validated prediction.',
})
