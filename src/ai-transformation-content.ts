export const TRANSFORMATION_PAGE = {
  hero: {
    eyebrow: 'AI-native transformation · 12-week pathway',
    title: 'Scope and deliver an agreed 12-week change program beyond a single workflow.',
    subtitle: 'Before contract, we fix the functions and workflows in scope, participant load, governance, deliverables, acceptance gates, exclusions, delivery team, price, and exit terms. Qualified 12-week scopes are quoted within a $120,000–$250,000 range.',
    primaryCta: 'Take the AI Readiness Assessment',
    secondaryCta: 'Discuss a Transformation',
  },
  proof: {
    eyebrow: 'One related company-scale engagement',
    title: 'Delivery experience across 100+ people and 20+ job families in six weeks.',
    description: 'These are participation, scope, and duration counts from one engagement, not audited business-outcome proof. Qualified buyers can review the measurement method, approved evidence, limitations, and available reference process during diligence.',
    caseStudyLink: 'Read the AI transformation case study',
    caseStudyHref: '/case-studies/orion-tech',
    metrics: [
      { value: '100+', label: 'people included in the program scope' },
      { value: '6 weeks', label: 'engagement duration' },
      { value: '20+', label: 'job families with tailored curricula' },
    ],
  },
  outcomes: {
    title: 'Outputs are fixed in the SOW, not discovered after kickoff',
    items: [
      'A client-approved map of only the people, workflows, systems, and decisions inside the contracted scope, with access and confidentiality controls.',
      'A fixed number of named workflows with defined environments, human approvals, evaluation thresholds, rollback, and production boundaries.',
      'Role-specific learning for the contracted functions, with participant hours, manager responsibilities, and competency measures agreed in advance.',
      'A governance charter, adoption measures, artifact register, and named internal lead with agreed authority, capacity, and handoff tests.',
    ],
    fitEyebrow: 'Initial fit criteria',
    fit: [
      '150–500 people, with several AI pilots that have not moved into shared operating practice',
      'An executive sponsor, operational gatekeeper, and internal program lead with protected capacity',
      'Willingness to fix scope, participant load, governance, evidence, workforce safeguards, and budget before contract',
    ],
  },
  phases: {
    eyebrow: 'Contracted pathway',
    title: 'Four phases with a client-owned gate between each.',
    subtitle: 'The SOW assigns weeks, owners, inputs, deliverables, acceptance criteria, and stop/go rights for every phase.',
    items: [
      { title: 'Map', description: 'Approve the in-scope operating map, evidence baseline, data and interview plan, risk register, governance, and prioritized workflow list.' },
      { title: 'Build', description: 'Implement the contracted workflow count against named environments, evaluations, human controls, and acceptance tests.' },
      { title: 'Learn', description: 'Run the agreed role-specific curricula and competency checks within the participant-hour budget and workforce safeguards.' },
      { title: 'Transfer', description: 'Complete owner-led operating tests, hand over the artifact register and unresolved-risk log, and make the client’s stop, extend, or internalize decision.' },
    ],
  },
  safeguards: {
    eyebrow: 'Workforce and data safeguards',
    title: 'Vibrana changes systems and practices; the client retains employment authority.',
    description: 'Before contract, the parties agree the workforce-impact assessment, participant hours, employee-data boundaries, consultation responsibilities, AI provider and subprocessor schedule, data flows, retention and deletion, incident ownership, and audit access.',
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
