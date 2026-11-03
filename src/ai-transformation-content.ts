/**
 * /ai-transformation copy. Source: hub gtm/programs/assessment-landing-pages/copy/transformation.md
 * (Wave 1 deck, Editorial Field Report). Ledger ids (T1 to T12, J2 to J4) are in the hub copy brief.
 * `*word*` marks the one serif italic word in a headline; the page renders it, never a raw asterisk.
 * Strings marked "kept" are as live before the rebuild.
 */

export type ChapterId = 'problem' | 'map' | 'build' | 'learn' | 'transfer' | 'proof' | 'safeguards' | 'start'
export type PhaseId = 'map' | 'build' | 'learn' | 'transfer'

export const TRANSFORMATION_PAGE = {
  hero: {
    /** Mono dateline over the masthead (T1, J4). */
    eyebrow: 'Program / 12 weeks / 4 phases / 4 gates you sign',
    title: 'Twelve weeks to take AI past one workflow. You *sign* every gate.',
    subtitle:
      'Four phases across the functions you choose, each closed by a gate you sign. The next phase starts only after you do. Scope, team, price and exit terms are fixed before contract.',
    priceLine: 'Quoted between $120,000 and $250,000',
    primaryCta: 'Take the AI Readiness Assessment',
    secondaryCta: 'Discuss a Transformation',
  },

  /** The operating map, the hero centerpiece (page-local component). Equal widths: the SOW sets the weeks (T1). */
  map: {
    phases: [
      { id: 'map', label: '01 Map', name: 'Map', artifact: 'The approved scope map' },
      { id: 'build', label: '02 Build', name: 'Build', artifact: 'Workflows that pass their tests' },
      { id: 'learn', label: '03 Learn', name: 'Learn', artifact: 'Each role trained on its own work' },
      { id: 'transfer', label: '04 Transfer', name: 'Transfer', artifact: 'Your lead runs it' },
    ] as const satisfies readonly { id: PhaseId; label: string; name: string; artifact: string }[],
    gateLabel: (n: number) => `Gate ${n} / you sign`,
    caption: 'FIG 0.1 / The 12-week pathway. The SOW sets the weeks and owners for each phase.',
    ariaSummary:
      'The 12-week pathway: Map, Build, Learn and Transfer. Each phase ends at a gate you sign, and the next phase starts only after you do.',
    reducedMotionNote: 'The full map is shown at once.',
  },

  rail: {
    heading: 'Contents',
    label: 'Chapters',
    skipLabel: 'Skip the chapter list',
    chapters: [
      { id: 'problem', number: '0', title: 'The problem' },
      { id: 'map', number: '1', title: 'Map' },
      { id: 'build', number: '2', title: 'Build' },
      { id: 'learn', number: '3', title: 'Learn' },
      { id: 'transfer', number: '4', title: 'Transfer' },
      { id: 'proof', number: '5', title: 'Proof' },
      { id: 'safeguards', number: '6', title: 'Safeguards' },
      { id: 'start', number: '7', title: 'Start here' },
    ] as const satisfies readonly { id: ChapterId; number: string; title: string }[],
    formatProgress: (number: string) => `Chapter ${number}`,
  },

  chapters: {
    problem: {
      title: 'Several pilots. No shared *practice*.',
      lede: 'You have AI pilots in a few teams. None of them has become how the company works yet. This program is built for that gap, at 150 to 500 people.',
    },
    map: {
      title: "Map: what's in scope, written *down*.",
      lede: 'We map only the people, workflows, systems and decisions inside the scope you contract, with your access and confidentiality rules. You approve the map before anything is built.',
    },
    build: {
      title: 'Build: workflows with controls you can *test*.',
      lede: 'We build the number of workflows in your contract, each in a named environment, with human approvals, evaluation thresholds and rollback. Whether one goes to production is your call.',
    },
    learn: {
      title: 'Learn: each role trained on its own *work*.',
      lede: 'Each function in scope gets its own curriculum and competency checks, inside a participant-hour budget you agree up front. Managers know their part before it starts.',
    },
    transfer: {
      title: "Transfer: your lead runs it, and you decide what's *next*.",
      lede: 'Your named internal lead runs the operating tests, takes the artifact register and the open-risk log, and you decide to stop, extend or take it fully in-house.',
    },
    proof: { title: 'One company. Every department. *Six* weeks.' },
    safeguards: { title: 'Decisions about your people stay *yours*.' },
    start: { title: 'Start with a *diagnostic*, or start the conversation.' },
  },

  /** GateCard props, one per phase chapter (J2: every gate signed by the owners named in the SOW; J4: four gates). */
  gates: {
    map: {
      gate: 1,
      when: 'End of Map',
      title:
        "You approve what's in scope: the operating map, the evidence baseline, the risk register, governance, and which workflows get built first.",
      criteria: ['Scope map approved', 'Evidence baseline recorded', 'Risk register opened', 'Workflow list in priority order'],
      signedBy: 'the owners named in your SOW',
      transfers: ['The approved operating map, under your access and confidentiality rules'],
      note: 'Build starts only after this gate is signed.',
    },
    build: {
      gate: 2,
      when: 'End of Build',
      title:
        'You check each contracted workflow against its acceptance tests, in its named environment, with human approvals and rollback in place.',
      criteria: ['Acceptance tests passed', 'Human approval steps in place', 'Rollback tested', 'Production limits written down'],
      signedBy: 'the owners named in your SOW',
      transfers: ['The workflows, their tests and their production limits', 'Going live is your decision alone'],
      note: 'Learn starts only after this gate is signed.',
    },
    learn: {
      gate: 3,
      when: 'End of Learn',
      title: "You confirm each role's curriculum ran inside the agreed participant hours, and the competency checks are done.",
      criteria: ['Curricula delivered by role', 'Participant hours inside budget', 'Competency checks complete'],
      signedBy: 'the owners named in your SOW',
      transfers: ['The curricula and the competency measures'],
      note: 'Transfer starts only after this gate is signed.',
    },
    transfer: {
      gate: 4,
      when: 'End of Transfer',
      title: 'You decide to stop, extend, or take it fully in-house, after your own lead has run the operating tests.',
      criteria: [
        'Operating tests run by your lead',
        'Artifact register handed over',
        'Open risks logged with owners',
        'Stop, extend or in-house: decided',
      ],
      signedBy: 'the owners named in your SOW',
      transfers: ['The artifact register and the open-risk log', 'Day-to-day running, by your named lead'],
      note: 'Your stop, extend or in-house decision is the last gate you sign.',
    },
  } as const satisfies Record<PhaseId, unknown>,
  gateLabels: { transfers: 'Yours from here' },
  /** Page-level margin note, once, beside the first GateCard (T1). */
  marginNote: 'Stop/go rights at every gate are in the SOW.',

  proof: {
    eyebrow: 'A related six-week engagement, not the 12-week program / scope and participation counts',
    title: 'One company. Every department. *Six* weeks.',
    metrics: [
      { value: '100+', label: 'people in scope' },
      { value: '20+', label: 'job families, each with its own curriculum' },
      { value: '6', label: 'weeks, start to finish' },
    ],
    body: 'A mid-sized tech company brought every department in at once. One result its people-team can see each month: the newsletter that took about 10 hours of work now takes 1.',
    diligence: 'In diligence, you can review how we counted and ask to speak with a client reference.',
    caseStudyLink: 'Read the AI transformation case study',
    caseStudyHref: '/case-studies/orion-tech',
  },

  /** Kept as live; each item now sits in its phase chapter (deck: "the outcomes list, now chapter 1 to 4 detail"). */
  outcomes: {
    title: 'Outputs are fixed in the SOW, not discovered after kickoff',
    items: {
      map: 'A client-approved map of only the people, workflows, systems, and decisions inside the contracted scope, with access and confidentiality controls.',
      build: 'A fixed number of named workflows with defined environments, human approvals, evaluation thresholds, rollback, and production boundaries.',
      learn: 'Role-specific learning for the contracted functions, with participant hours, manager responsibilities, and competency measures agreed in advance.',
      transfer: 'A governance charter, adoption measures, artifact register, and named internal lead with agreed authority, capacity, and handoff tests.',
    } as const satisfies Record<PhaseId, string>,
    fitEyebrow: 'Initial fit criteria',
    fit: [
      '150–500 people, with several AI pilots that have not moved into shared operating practice',
      'An executive sponsor, operational gatekeeper, and internal program lead with protected capacity',
      'Willingness to fix scope, participant load, governance, evidence, workforce safeguards, and budget before contract',
    ],
  },

  safeguards: {
    eyebrow: 'Workforce and data safeguards',
    title: 'Decisions about your people stay *yours*.',
    description:
      'Before contract, the parties agree the workforce-impact assessment, participant hours, employee-data boundaries, consultation responsibilities, AI provider and subprocessor schedule, data flows, retention and deletion, incident ownership, and audit access.',
    items: [
      'No individual employee surveillance or performance scoring is included by default.',
      'The client alone makes employment, role, organization-design, and production-deployment decisions.',
      'Internal program-lead authority, capacity, manager approval, and support boundary are documented.',
      'If privacy, security, workforce, or employee-representation requirements cannot be met, the affected scope does not proceed.',
    ],
  },
  assessment: {
    eyebrow: 'Start with a diagnostic',
    title: 'Map reported readiness risks before deciding whether to fund a larger engagement.',
    description: 'The 24-question self-assessment covers six dimensions and produces a personalized report. It is a structured conversation aid, not a validated prediction or substitute for technical, security, workforce, or operating diligence.',
    details: ['24 self-reported questions', 'Six readiness dimensions', 'Personalized discussion report', 'No obligation to enter a transformation engagement'],
    method: 'Dimensions: leadership and strategy, data readiness, technology infrastructure, talent and capability, governance and responsible AI, and culture and change readiness. Each area’s score is the average of your answers, and every area counts the same in the overall score; company context and recommendations are kept apart from the published research.',
    privacy: 'Contact details, your answers and your scores are stored to deliver the report and manage assessment-related follow-up. Public company content, your answers and your scores may be processed through Firecrawl, OpenRouter and the open-weight AI models it routes to, for company context and the written analysis. The privacy policy explains providers and your access, correction, objection, and deletion rights.',
    cta: 'Take the Readiness Assessment',
    /** Caption for the pathway loop beside the assessment block (page microcopy, under five words after the FIG number). */
    figCaption: 'FIG 7.1 / A sample readiness report',
  },
  simulator: {
    eyebrow: 'AI Transformation Simulator',
    title: 'Model your two years before you talk to anyone.',
    description: 'Seven inputs give a cost and capacity range for a company like yours, built from published studies, with every assumption visible and editable. Free. It asks for your work email first, and there is no newsletter.',
    cta: 'Run the simulator',
    href: '/ai-transformation/simulator',
  },
  inquiry: {
    title: 'Discuss a bounded 12-week transformation scope',
    subtitle: 'Tell us what has already been tried, the executive decision to be made, the functions under consideration, and the evidence required. A conversation creates no obligation or automatic expansion.',
  },
} as const
