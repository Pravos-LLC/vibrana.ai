// The EU AI Act Readiness assessment questions, by section.
// Shared by the form (src/components/eu-ai-act/EUAssessmentForm.tsx), the engine
// (src/lib/eu-ai-act/engine.ts) and the API route (app/api/eu-ai-act-assessments/route.ts).
//
// Section 1 maps the company's exposure (where its AI touches the EU, its role, which Annex III
// areas it works in). It is not scored. Sections 2 to 6 ask about controls a buyer can check
// (a written review, a named person, a retention period), each tied to the provision it tests.
//
// Every question cites knowledge-base findings (hub knowledge/findings, each quoting the
// regulation verbatim from knowledge/corpus/eu-ai-act/) or says it is practitioner judgment.
// The question-to-article table and the scoring are in docs/eu-ai-act-assessment-methodology.md.
//
// Option scores are unique within a question (the form stores the score). Scored questions use
// 100, 60, 25 and 0; "Not sure" sits with the lowest option, since a control nobody can confirm
// is not in place yet. NOT_APPLICABLE (-1) marks an option that takes the question out of scope.
// Exposure questions use their scores only as codes; `value` says what each one means.

export const EU_AI_ACT_INSTRUMENT_VERSION = 1;

export const NOT_APPLICABLE = -1;

export type QuestionEvidence = readonly string[] | 'practitioner judgment';

export interface EUQuestionOption {
  label: string;
  score: number;
  /** For exposure questions: the engine reads this, not the score. */
  value?: string;
}

export interface EUQuestion {
  id: string;
  question: string;
  options: EUQuestionOption[];
  /** Knowledge-base finding slugs, or practitioner judgment. */
  evidence: QuestionEvidence;
}

export const EU_SECTIONS = [
  { key: 'footprint', title: 'Your AI footprint', scored: false },
  { key: 'prohibited', title: 'Prohibited practices', scored: true },
  { key: 'inventory', title: 'Inventory and roles', scored: true },
  { key: 'people', title: 'AI literacy and oversight', scored: true },
  { key: 'controls', title: 'Deployer controls', scored: true },
  { key: 'transparency', title: 'Transparency and ownership', scored: true },
] as const;

export type EUSectionKey = (typeof EU_SECTIONS)[number]['key'];

/** Annex III use: yes in use, piloting, planned within 12 months, no. */
const USE_OPTIONS = (inUse: string): EUQuestionOption[] => [
  { label: inUse, score: 100, value: 'yes' },
  { label: 'We are piloting it', score: 70, value: 'pilot' },
  { label: 'We plan to within 12 months', score: 40, value: 'planned' },
  { label: 'No', score: 0, value: 'no' },
];

export const EU_QUESTIONS: Record<EUSectionKey, EUQuestion[]> = {
  footprint: [
    {
      id: 'eu_scope',
      question: 'Where does your use of AI touch the EU?',
      options: [
        { label: 'We have an office, entity or staff in the EU', score: 100, value: 'eu' },
        { label: 'We are outside the EU, but our AI output is used there (EU customers, users or staff)', score: 70, value: 'output' },
        { label: 'Not sure', score: 40, value: 'unsure' },
        { label: 'Our AI and its output never reach the EU', score: 0, value: 'none' },
      ],
      evidence: ['eu-ai-act-art-2-1-b-deployers-in-eu', 'eu-ai-act-art-2-1-c-non-eu-output-used-in-eu'],
    },
    {
      id: 'eu_build',
      question: 'Which best describes how your company gets its AI?',
      options: [
        { label: 'We only use tools from vendors (ChatGPT, Copilot, AI features in HR or CRM software)', score: 100, value: 'deployer' },
        { label: 'We use vendor tools and build internal AI tools or agents on top of models', score: 70, value: 'builder' },
        { label: 'We sell AI products or AI features to customers under our name', score: 40, value: 'provider' },
        { label: 'We train or fine-tune models that others build on', score: 0, value: 'model-provider' },
      ],
      evidence: ['eu-ai-act-art-3-3-provider-definition', 'eu-ai-act-art-3-4-deployer-definition', 'eu-ai-act-art-25-1-c-repurposing-general-purpose-ai'],
    },
    {
      id: 'eu_hr',
      question: 'Do you use AI in hiring or managing people? For example, screening CVs, ranking candidates, allocating tasks or monitoring performance.',
      options: USE_OPTIONS('Yes, in use today'),
      evidence: ['eu-ai-act-annex-iii-4-a-recruitment-high-risk-current', 'eu-ai-act-annex-iii-4-b-worker-management-high-risk'],
    },
    {
      id: 'eu_credit',
      question: 'Do you use AI to assess the creditworthiness of individuals, or to price life or health insurance?',
      options: USE_OPTIONS('Yes, in use today'),
      evidence: ['eu-ai-act-annex-iii-5-b-creditworthiness-high-risk', 'eu-ai-act-annex-iii-5-c-life-health-insurance-high-risk'],
    },
    {
      id: 'eu_edu',
      question: 'Do you use AI to admit, assess or grade learners, in education or in vocational training you run?',
      options: USE_OPTIONS('Yes, in use today'),
      evidence: ['eu-ai-act-annex-iii-3-education-high-risk'],
    },
    {
      id: 'eu_sensitive',
      question: 'Do you use AI for biometric identification, emotion recognition, critical infrastructure, or public services on behalf of an authority?',
      options: USE_OPTIONS('Yes, in use today'),
      evidence: ['eu-ai-act-art-6-3-annex-iii-derogation'],
    },
    {
      id: 'eu_chat',
      question: 'Do customers or the public talk directly to an AI system you run, such as a chatbot or voice agent?',
      options: [
        { label: 'Yes, one we built or configured', score: 100, value: 'own' },
        { label: 'Yes, a vendor product we deploy', score: 70, value: 'vendor' },
        { label: 'Not yet, but planned', score: 40, value: 'planned' },
        { label: 'No', score: 0, value: 'no' },
      ],
      evidence: ['eu-ai-act-art-50-1-disclose-ai-interaction'],
    },
    {
      id: 'eu_gen',
      question: 'Do you publish AI-generated images, video, audio or text, in marketing, communications or public information?',
      options: [
        { label: 'Yes, including realistic images, audio or video of people or events', score: 100, value: 'deepfake' },
        { label: 'Yes, text or non-realistic visuals', score: 70, value: 'content' },
        { label: 'Occasionally, with heavy human editing', score: 40, value: 'edited' },
        { label: 'No', score: 0, value: 'no' },
      ],
      evidence: ['eu-ai-act-art-50-4-disclose-deep-fakes', 'eu-ai-act-art-50-4-disclose-ai-text-public-interest'],
    },
  ],
  prohibited: [
    {
      id: 'eu_prohibited_review',
      question: 'Have you checked every AI use against the practices the Act prohibits, such as manipulative techniques and emotion recognition at work?',
      options: [
        { label: 'Yes, a written review covering every use', score: 100 },
        { label: 'An informal check of the main tools', score: 60 },
        { label: 'Not yet', score: 25 },
        { label: 'Not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-5-1-a-manipulation-prohibited', 'eu-ai-act-art-113-a-prohibitions-2025-02-02', 'eu-ai-act-art-99-3-prohibited-practice-fines'],
    },
    {
      id: 'eu_emotion',
      question: 'Does any tool you use infer how employees or candidates feel? For example, sentiment scoring of staff calls or emotion analysis in video interviews.',
      options: [
        { label: 'No, and we have confirmed it with our vendors', score: 100 },
        { label: 'Not that we know of', score: 60 },
        { label: 'Possibly, we have not checked', score: 25 },
        { label: 'Yes', score: 0 },
      ],
      evidence: ['eu-ai-act-art-5-1-f-workplace-emotion-recognition-prohibited'],
    },
  ],
  inventory: [
    {
      id: 'eu_inventory',
      question: 'Do you keep a list of every AI system in use, including AI features inside vendor software and tools staff adopted on their own?',
      options: [
        { label: 'Yes, complete and kept up to date', score: 100 },
        { label: 'A partial list', score: 60 },
        { label: 'Planned, not started', score: 25 },
        { label: 'No, or not sure', score: 0 },
      ],
      evidence: 'practitioner judgment',
    },
    {
      id: 'eu_classification',
      question: 'Has each AI system been classified by risk (prohibited, high-risk, transparency only, minimal), with the reasoning written down?',
      options: [
        { label: 'Yes, every system, with the reasoning recorded', score: 100 },
        { label: 'The main systems, informally', score: 60 },
        { label: 'Not yet', score: 25 },
        { label: 'Not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-6-3-annex-iii-derogation', 'eu-ai-act-art-6-3-profiling-always-high-risk'],
    },
    {
      id: 'eu_role',
      question: 'For each AI system, do you know whether you are its provider or its deployer under the Act?',
      options: [
        { label: 'Yes, recorded for every system', score: 100 },
        { label: 'For the main systems', score: 60 },
        { label: 'We have not looked at it', score: 25 },
        { label: 'Not sure what the difference is', score: 0 },
      ],
      evidence: ['eu-ai-act-art-3-3-provider-definition', 'eu-ai-act-art-3-4-deployer-definition'],
    },
    {
      id: 'eu_modify',
      question: 'When you rebrand, fine-tune or repurpose a vendor AI system, do you check whether that makes you its provider?',
      options: [
        { label: 'Yes, it is a step in our build or buying process', score: 100 },
        { label: 'Sometimes, case by case', score: 60 },
        { label: 'No', score: 25 },
        { label: 'Not applicable: we never modify or rebrand AI systems', score: NOT_APPLICABLE },
      ],
      evidence: ['eu-ai-act-art-25-1-deployer-becomes-provider', 'eu-ai-act-art-25-1-c-repurposing-general-purpose-ai'],
    },
  ],
  people: [
    {
      id: 'eu_literacy',
      question: 'What do you do to build AI literacy among staff who use or run AI?',
      options: [
        { label: 'Role-based training, with records of who has done it', score: 100 },
        { label: 'One general training for everyone', score: 60 },
        { label: 'Ad hoc tips and guidance', score: 25 },
        { label: 'Nothing yet, or not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-4-ai-literacy-as-amended', 'eu-ai-act-art-113-a-prohibitions-2025-02-02'],
    },
    {
      id: 'eu_oversight',
      question: 'For each AI system that affects people, is a named person with the training and authority to override it responsible for it?',
      options: [
        { label: 'Yes, for every such system', score: 100 },
        { label: 'For some systems', score: 60 },
        { label: 'People review outputs, but no one is named', score: 25 },
        { label: 'No, or not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-26-2-human-oversight'],
    },
    {
      id: 'eu_inform_workers',
      question: 'Before AI is used on staff at work (hiring, task allocation, monitoring), do you inform the affected workers and their representatives?',
      options: [
        { label: 'Yes, in writing, before it goes live', score: 100 },
        { label: 'Informally, or after launch', score: 60 },
        { label: 'No', score: 25 },
        { label: 'Not applicable: we use no AI on staff', score: NOT_APPLICABLE },
      ],
      evidence: ['eu-ai-act-art-26-7-inform-workers'],
    },
  ],
  controls: [
    {
      id: 'eu_instructions',
      question: 'Do you get the vendor’s instructions for use for AI systems that affect people, and check that you use them that way?',
      options: [
        { label: 'Yes, filed and checked', score: 100 },
        { label: 'We have them, but do not check use against them', score: 60 },
        { label: 'Rarely', score: 25 },
        { label: 'No, or not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-26-1-use-per-instructions'],
    },
    {
      id: 'eu_logs',
      question: 'How long do you keep the logs your AI systems generate?',
      options: [
        { label: 'Six months or more, by a written policy', score: 100 },
        { label: 'Whatever the vendor default is', score: 60 },
        { label: 'We do not keep them', score: 25 },
        { label: 'Not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-26-6-keep-logs-six-months'],
    },
    {
      id: 'eu_monitor',
      question: 'Do you monitor AI systems once they are live, with a way to pause one and tell the vendor when it causes a problem?',
      options: [
        { label: 'Yes, an owner and a written process', score: 100 },
        { label: 'We would handle it as it comes', score: 60 },
        { label: 'No monitoring after launch', score: 25 },
        { label: 'Not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-26-5-monitor-operation'],
    },
    {
      id: 'eu_inform_people',
      question: 'When AI makes or helps make a decision about a person (a candidate, customer or applicant), are they told?',
      options: [
        { label: 'Yes, every time', score: 100 },
        { label: 'In some processes', score: 60 },
        { label: 'No', score: 25 },
        { label: 'Not applicable: AI makes no decisions about people here', score: NOT_APPLICABLE },
      ],
      evidence: ['eu-ai-act-art-26-11-inform-affected-people'],
    },
    {
      id: 'eu_vendor',
      question: 'Do your AI vendor contracts cover what you need for the Act, such as documentation, instructions for use, log access and incident notice?',
      options: [
        { label: 'Yes, for every AI vendor', score: 100 },
        { label: 'For some vendors', score: 60 },
        { label: 'Standard terms only', score: 25 },
        { label: 'Not sure', score: 0 },
      ],
      evidence: ['eu-ai-act-art-26-1-use-per-instructions', 'eu-ai-act-art-53-1-a-gpai-technical-documentation'],
    },
  ],
  transparency: [
    {
      id: 'eu_disclose_chat',
      question: 'When people talk to one of your AI systems, are they told it is AI?',
      options: [
        { label: 'Yes, clearly, at the first interaction', score: 100 },
        { label: 'Somewhere in the terms or the interface', score: 60 },
        { label: 'No', score: 25 },
        { label: 'Not applicable: no one talks to an AI system of ours', score: NOT_APPLICABLE },
      ],
      evidence: ['eu-ai-act-art-50-1-disclose-ai-interaction'],
    },
    {
      id: 'eu_label_content',
      question: 'Is AI-generated content labeled when you publish it, especially realistic images, audio or video?',
      options: [
        { label: 'Yes, by a written rule', score: 100 },
        { label: 'Sometimes', score: 60 },
        { label: 'No', score: 25 },
        { label: 'Not applicable: we publish no AI-generated content', score: NOT_APPLICABLE },
      ],
      evidence: ['eu-ai-act-art-50-4-disclose-deep-fakes', 'eu-ai-act-art-50-4-disclose-ai-text-public-interest'],
    },
    {
      id: 'eu_owner',
      question: 'Is one person accountable for AI Act compliance, with time and budget to get ready before the high-risk rules apply?',
      options: [
        { label: 'Yes, named, resourced, with a plan', score: 100 },
        { label: 'Named, but without time or budget', score: 60 },
        { label: 'Shared loosely across legal, IT and HR', score: 25 },
        { label: 'No one yet', score: 0 },
      ],
      evidence: ['eu-ai-act-art-113-c-high-risk-2027-2028'],
    },
  ],
};

export const EU_ALL_QUESTIONS: EUQuestion[] = EU_SECTIONS.flatMap(({ key }) => EU_QUESTIONS[key]);

export function euQuestionById(id: string): EUQuestion | undefined {
  return EU_ALL_QUESTIONS.find((q) => q.id === id);
}

/** True when `score` is one of the options of question `id`. */
export function isEUOptionScore(id: string, score: number): boolean {
  return !!euQuestionById(id)?.options.some((o) => o.score === score);
}
