// The obligations the EU AI Act Readiness report checks, in the order the report lists them.
// Copy lives here (page copy is data); src/lib/eu-ai-act/engine.ts decides which apply to a
// company, from when, and how far its answers say it is.
//
// `findings` are knowledge-base slugs: each one quotes the provision verbatim from the corpus
// (hub knowledge/corpus/eu-ai-act/), and the report shows its locator next to the obligation.
// `appliesFrom` is the date the provision applies, after Regulation (EU) 2026/1744
// (Art. 113 as amended). `questions` are the scored answers that measure it.

export type ObligationId =
  | 'ai-literacy'
  | 'prohibited-practices'
  | 'inventory-classification'
  | 'role-clarity'
  | 'transparency-interaction'
  | 'transparency-content'
  | 'high-risk-deployer'
  | 'inform-workers'
  | 'inform-affected-people'
  | 'fria'
  | 'provider-obligations'
  | 'vendor-contracts'
  | 'accountable-owner';

export interface ObligationDef {
  id: ObligationId;
  title: string;
  /** What the law asks, in one plain sentence. */
  requirement: string;
  /** The next step when the answers show a gap. */
  action: string;
  findings: readonly string[];
  /** ISO date the provision applies, or null for good practice the Act does not date. */
  appliesFrom: string | null;
  /** Scored question ids that measure it (empty: applicability only). */
  questions: readonly string[];
  /** True when the item is our practitioner judgment, not a provision of the Act. */
  practice?: true;
}

export const EU_OBLIGATIONS: readonly ObligationDef[] = [
  {
    id: 'prohibited-practices',
    title: 'Stay clear of prohibited AI practices',
    requirement: 'Practices such as manipulative or deceptive techniques that cause significant harm, and emotion recognition at work or in education other than for medical or safety reasons, are banned.',
    action: 'Review every AI use, including features inside vendor tools, against Article 5, and write the review down. Check any tool that infers how staff or candidates feel against Article 5(1)(f) with counsel.',
    findings: ['eu-ai-act-art-5-1-a-manipulation-prohibited', 'eu-ai-act-art-5-1-f-workplace-emotion-recognition-prohibited', 'eu-ai-act-art-113-a-prohibitions-2025-02-02'],
    appliesFrom: '2025-02-02',
    questions: ['eu_prohibited_review', 'eu_emotion'],
  },
  {
    id: 'ai-literacy',
    title: 'Support AI literacy',
    requirement: 'Providers and deployers must take measures to support the AI literacy of staff who operate or use AI on their behalf.',
    action: 'Give each role that uses or oversees AI training fitted to that role, and keep a record of who has done it.',
    findings: ['eu-ai-act-art-4-ai-literacy-as-amended', 'eu-ai-act-art-113-a-prohibitions-2025-02-02'],
    appliesFrom: '2025-02-02',
    questions: ['eu_literacy'],
  },
  {
    id: 'inventory-classification',
    title: 'Know every AI system and its risk class',
    requirement: 'Whether a system is high-risk depends on its use; an Annex III system that profiles people is always high-risk.',
    action: 'List every AI system, including vendor features and tools staff adopted themselves, then classify each one and record the reasoning.',
    findings: ['eu-ai-act-art-6-3-annex-iii-derogation', 'eu-ai-act-art-6-3-profiling-always-high-risk'],
    appliesFrom: null,
    questions: ['eu_inventory', 'eu_classification'],
  },
  {
    id: 'role-clarity',
    title: 'Know when you are the provider',
    requirement: 'A deployer that repurposes an AI system, including a general-purpose one, into a high-risk use takes on the provider’s obligations.',
    action: 'Record your role for each system, and add a provider check to any project that fine-tunes, rebrands or repurposes a vendor model.',
    findings: ['eu-ai-act-art-25-1-deployer-becomes-provider', 'eu-ai-act-art-25-1-c-repurposing-general-purpose-ai', 'eu-ai-act-art-3-3-provider-definition', 'eu-ai-act-art-3-4-deployer-definition'],
    appliesFrom: null,
    questions: ['eu_role', 'eu_modify'],
  },
  {
    id: 'transparency-interaction',
    title: 'Tell people they are talking to AI',
    requirement: 'AI systems that interact directly with people must let them know it is AI, unless that is obvious.',
    action: 'Add a clear notice at the first interaction in every chatbot and voice agent, and check vendor products do the same.',
    findings: ['eu-ai-act-art-50-1-disclose-ai-interaction', 'eu-ai-act-art-113-general-application-2026-08-02'],
    appliesFrom: '2026-08-02',
    questions: ['eu_disclose_chat'],
  },
  {
    id: 'transparency-content',
    title: 'Disclose AI-generated content',
    requirement: 'Deployers must disclose deep fakes, and AI-generated text published to inform the public on matters of public interest, unless a person reviewed it and someone holds editorial responsibility.',
    action: 'Write a labeling rule for deep fakes, and for AI-generated text published to inform the public without human editorial review, and apply it before anything is published.',
    findings: ['eu-ai-act-art-50-4-disclose-deep-fakes', 'eu-ai-act-art-50-4-disclose-ai-text-public-interest', 'eu-ai-act-art-113-general-application-2026-08-02'],
    appliesFrom: '2026-08-02',
    questions: ['eu_label_content'],
  },
  {
    id: 'high-risk-deployer',
    title: 'Run high-risk AI under deployer controls',
    requirement: 'Deployers of high-risk AI must use it per the instructions, assign trained human oversight, monitor it, and keep its logs for at least six months.',
    action: 'For each high-risk system: file the instructions for use, name a trained overseer with authority to intervene, set a six-month log policy and a monitoring routine.',
    findings: ['eu-ai-act-art-26-1-use-per-instructions', 'eu-ai-act-art-26-2-human-oversight', 'eu-ai-act-art-26-5-monitor-operation', 'eu-ai-act-art-26-6-keep-logs-six-months', 'eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: '2027-12-02',
    questions: ['eu_instructions', 'eu_oversight', 'eu_monitor', 'eu_logs'],
  },
  {
    id: 'inform-workers',
    title: 'Inform workers before AI is used on them',
    requirement: 'Employers must inform workers’ representatives and affected workers before using a high-risk AI system at work.',
    action: 'Add a written notice to workers and their representatives to the launch checklist for any AI used in hiring or managing people.',
    findings: ['eu-ai-act-art-26-7-inform-workers', 'eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: '2027-12-02',
    questions: ['eu_inform_workers'],
  },
  {
    id: 'inform-affected-people',
    title: 'Tell people when AI decides about them',
    requirement: 'Deployers of Annex III high-risk AI that makes or assists decisions about people must inform those people.',
    action: 'Add a notice to every process where AI makes or assists a decision about a candidate, customer or applicant.',
    findings: ['eu-ai-act-art-26-11-inform-affected-people', 'eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: '2027-12-02',
    questions: ['eu_inform_people'],
  },
  {
    id: 'fria',
    title: 'Assess the impact on fundamental rights',
    requirement: 'Deployers of AI for credit scoring or life and health insurance pricing must assess its impact on fundamental rights before use.',
    action: 'Plan a fundamental rights impact assessment for each credit or insurance AI system before the high-risk rules apply.',
    findings: ['eu-ai-act-art-27-1-fundamental-rights-impact-assessment', 'eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: '2027-12-02',
    questions: [],
  },
  {
    id: 'provider-obligations',
    title: 'Prepare for provider obligations',
    requirement: 'If you provide a high-risk AI system, the provider obligations in Article 16 are yours.',
    action: 'This goes beyond a readiness check: map each product against the provider obligations with counsel, starting with the systems you sell into Annex III uses.',
    findings: ['eu-ai-act-art-3-3-provider-definition', 'eu-ai-act-art-25-1-deployer-becomes-provider', 'eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: '2027-12-02',
    questions: [],
  },
  {
    id: 'vendor-contracts',
    title: 'Get what you need from AI vendors',
    requirement: 'Deployer duties depend on vendor material: instructions for use, documentation and logs.',
    action: 'Add AI Act terms to vendor contracts: instructions for use, technical documentation, log access and notice of incidents and changes.',
    findings: ['eu-ai-act-art-26-1-use-per-instructions', 'eu-ai-act-art-53-1-a-gpai-technical-documentation'],
    appliesFrom: null,
    questions: ['eu_vendor'],
    practice: true,
  },
  {
    id: 'accountable-owner',
    title: 'Name an accountable owner',
    requirement: 'Not a provision of the Act: in our experience, readiness stalls when compliance is shared loosely across legal, IT and HR.',
    action: 'Name one owner for AI Act readiness, with time and budget, and a plan that lands before 2 December 2027.',
    findings: ['eu-ai-act-art-113-c-high-risk-2027-2028'],
    appliesFrom: null,
    questions: ['eu_owner'],
    practice: true,
  },
];
