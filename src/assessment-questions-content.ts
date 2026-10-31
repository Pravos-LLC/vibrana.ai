// The AI Readiness assessment questions (instrument version 2, from 2026-10-16), by area.
// Shared by the form (src/components/assessment/AssessmentForm.tsx), the scoring
// (src/lib/assessment/scoring.ts) and the report pipeline, which shows the model the option
// each buyer picked.
//
// Every question asks about something a buyer can count or check (a named owner, a share of
// staff, a written policy), not a self-rating. Each one cites the knowledge-base findings behind
// it, or says it is practitioner judgment where no published evidence exists; the full table,
// the scoring and what the profile is not are in docs/assessment-methodology.md.
//
// Option scores are 100, 70, 40 and 0, unique within a question (the form stores the score).
// "Not sure" sits with the lowest option: a practice nobody can confirm is not yet in place.
// `topic` and `action` build the report's next steps when a question is answered at 40 or below.
// Questions from version 1 (l1..c5) live in src/assessment-questions-v1-content.ts, for old rows.

export const ASSESSMENT_INSTRUMENT_VERSION = 2;

/** "practitioner judgment" when no published finding supports the question. */
export type QuestionEvidence = readonly string[] | 'practitioner judgment';

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: { label: string; score: number }[];
  /** What the question measures, as it reads in "From your answers on ...". */
  topic: string;
  /** The next step when the answer is at 40 or below. No invented numbers. */
  action: string;
  /** Knowledge-base finding slugs (hub knowledge/findings), or practitioner judgment. */
  evidence: QuestionEvidence;
  /** Not asked of teams in SMALL_TEAM_SIZES: it assumes several teams or a formal process. */
  skipForSmallTeams?: true;
}

/** Team sizes (src/enterprise-content.ts INQUIRY_OPTIONS.teamSizes) that get the shorter set. */
export const SMALL_TEAM_SIZES: readonly string[] = ['1-50 employees'];

export const ASSESSMENT_AREAS = [
  { key: 'leadership', dimension: 'Leadership & Strategy' },
  { key: 'data', dimension: 'Data Readiness' },
  { key: 'technology', dimension: 'Technology Infrastructure' },
  { key: 'talent', dimension: 'Talent & Capability' },
  { key: 'governance', dimension: 'Governance & Responsible AI' },
  { key: 'culture', dimension: 'Culture & Change Readiness' },
] as const;

export type AssessmentAreaKey = (typeof ASSESSMENT_AREAS)[number]['key'];

export const ASSESSMENT_QUESTIONS: Record<AssessmentAreaKey, AssessmentQuestion[]> = {
  leadership: [
    {
      id: 'l_owner',
      question: 'Who is accountable for the results of AI at your company?',
      options: [
        { label: 'A named senior leader, with AI results in their goals', score: 100 },
        { label: 'A named senior leader, without set goals for it', score: 70 },
        { label: 'Someone below the leadership team, informally', score: 40 },
        { label: 'No one in particular, or not sure', score: 0 },
      ],
      topic: 'who is accountable for AI results',
      action: 'Name one senior leader who owns the first AI workflow and the measure it is judged on',
      evidence: ['mckinsey-state-of-ai-2026-senior-leader-commitment', 'bcg-ai-at-work-2026-ceo-ownership-outperforms'],
    },
    {
      id: 'l_in_use',
      question: 'How many uses of AI are part of daily work today, beyond pilots and trials?',
      options: [
        { label: 'Three or more', score: 100 },
        { label: 'One or two', score: 70 },
        { label: 'None yet, but a pilot is running', score: 40 },
        { label: 'None, and no pilot is running', score: 0 },
      ],
      topic: 'AI in daily use',
      action: 'Take one workflow, or a pilot you already run, into daily use with a named owner and a date',
      evidence: ['gartner-ai-maturity-2025-45-percent-operational-three-years', 'mit-cisr-ai-maturity-stage-characteristics'],
    },
    {
      id: 'l_measure',
      question: 'For the AI tools or workflows you run, how many are measured against how the work went before AI (time, errors, cost or revenue)?',
      options: [
        { label: 'All of them', score: 100 },
        { label: 'Some of them', score: 70 },
        { label: 'None; we track usage only', score: 40 },
        { label: 'None, or we run no AI workflows yet', score: 0 },
      ],
      topic: 'how AI results are measured',
      action: 'Choose one measure for the first workflow, such as turnaround time or error rate, and record it before anything changes',
      evidence: ['mckinsey-state-of-ai-2025-kpis-most-impact', 'gartner-ai-maturity-2025-metrics-sustain-success'],
    },
    {
      id: 'l_redesign',
      question: 'In the past 12 months, how many workflows have you redesigned around AI, changing their steps and which ones a person or a tool does, rather than adding an assistant to the old process?',
      options: [
        { label: 'Three or more', score: 100 },
        { label: 'One or two', score: 70 },
        { label: 'One is in progress', score: 40 },
        { label: 'None yet', score: 0 },
      ],
      topic: 'redesigning workflows around AI',
      action: 'Map one workflow step by step with the people who run it, and mark the steps a tool could handle and the ones that could go',
      evidence: ['mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect'],
    },
    {
      id: 'l_baseline',
      question: 'Before you change a workflow with AI, do you map its steps and time how long it takes today?',
      options: [
        { label: 'Yes, every time', score: 100 },
        { label: 'We have done it at least once', score: 70 },
        { label: 'We estimate, but do not measure', score: 40 },
        { label: 'No, or not sure', score: 0 },
      ],
      topic: 'timing a workflow before changing it',
      action: 'Time the first workflow for one ordinary week before you change it, so you have a baseline to compare against',
      evidence: 'practitioner judgment',
    },
  ],
  data: [
    {
      id: 'd_digital',
      question: 'For the work you most want AI to help with, how much of the information it needs is digital and searchable, not on paper, in scans or in people’s heads?',
      options: [
        { label: 'Nearly all of it', score: 100 },
        { label: 'Most of it', score: 70 },
        { label: 'About half', score: 40 },
        { label: 'Less than half, or not sure', score: 0 },
      ],
      topic: 'how much of the information is digital',
      action: 'List the information the first workflow needs and where each piece lives, and start with a workflow whose inputs are already digital',
      evidence: ['johnk-2021-four-data-readiness-factors', 'mcelheran-2024-cloud-and-digital-data-predict-ai-use'],
    },
    {
      id: 'd_access',
      question: 'When someone needs data from another team’s system, how do they usually get it?',
      options: [
        { label: 'They reach it themselves from a shared source', score: 100 },
        { label: 'Through a documented request, answered within a few days', score: 70 },
        { label: 'By asking around, depending on who they know', score: 40 },
        { label: 'Often they cannot get it', score: 0 },
      ],
      topic: 'getting data from other teams',
      action: 'Agree access to the data the first workflow needs with the team that owns it, before the build starts',
      evidence: ['johnk-2021-four-data-readiness-factors', 'google-dora-2025-healthy-data-ecosystems-amplify-ai'],
      skipForSmallTeams: true,
    },
    {
      id: 'd_quality',
      question: 'How is the data in your main systems checked for errors?',
      options: [
        { label: 'Automatic checks alert someone when something breaks', score: 100 },
        { label: 'A person checks it on a regular schedule', score: 70 },
        { label: 'Only when someone spots a problem', score: 40 },
        { label: 'It is not checked, or not sure', score: 0 },
      ],
      topic: 'checking data for errors',
      action: 'Check a sample of the data the first workflow reads for gaps and errors before building on it',
      evidence: ['mikalef-2021-data-cleansing-granularity-weigh-most', 'gartner-2025-ai-ready-data-63-percent-lack-practices'],
    },
    {
      id: 'd_owner',
      question: 'Does each of your main data sources have a named owner who answers for its accuracy and who can use it?',
      options: [
        { label: 'Yes, all of them', score: 100 },
        { label: 'Most of them', score: 70 },
        { label: 'A few of them', score: 40 },
        { label: 'None, or not sure', score: 0 },
      ],
      topic: 'named owners for data',
      action: 'Name an owner for each data source the first workflow reads',
      evidence: ['gartner-2025-ai-ready-data-63-percent-lack-practices', 'johnk-2021-four-data-readiness-factors'],
    },
  ],
  technology: [
    {
      id: 't_ai_tool',
      question: 'Do staff have a company-approved AI tool that can work with your internal documents or data?',
      options: [
        { label: 'Yes, and it is connected to our internal documents or systems', score: 100 },
        { label: 'Yes, but people paste content into it by hand', score: 70 },
        { label: 'Only personal or free accounts', score: 40 },
        { label: 'No AI tools in use, or not sure', score: 0 },
      ],
      topic: 'an approved AI tool connected to internal data',
      action: 'Use the enterprise AI account your company already has, or set one up if there is none, and connect it to the documents the first workflow needs',
      evidence: ['google-dora-2025-ai-accessible-internal-data'],
    },
    {
      id: 't_connect',
      question: 'Can the systems your team uses most connect to other tools through an API or a built-in integration?',
      options: [
        { label: 'Most can, and we already connect them', score: 100 },
        { label: 'Most can, but few are connected', score: 70 },
        { label: 'Some can; others are closed or old', score: 40 },
        { label: 'Mostly no, or not sure', score: 0 },
      ],
      topic: 'connecting your systems',
      action: 'Check that the two or three systems the first workflow touches have an API or integration before you choose it',
      evidence: ['johnk-2021-it-infrastructure-readiness-indicators'],
    },
    {
      id: 't_cloud',
      question: 'Where do your core business systems run?',
      options: [
        { label: 'Mostly in the cloud or as online software', score: 100 },
        { label: 'A mix of cloud and our own servers', score: 70 },
        { label: 'Mostly on our own servers, with some cloud tools', score: 40 },
        { label: 'Only on our own servers or desktop software', score: 0 },
      ],
      topic: 'where your systems run',
      action: 'Start with a workflow that runs on online tools you already use, so no platform change is needed',
      evidence: ['mcelheran-2024-cloud-and-digital-data-predict-ai-use'],
    },
    {
      id: 't_to_live',
      question: 'The last time an AI pilot worked, how long did it take to reach daily use?',
      options: [
        { label: 'Under three months', score: 100 },
        { label: 'Three to six months', score: 70 },
        { label: 'Longer than six months, or it stalled', score: 40 },
        { label: 'No pilot has reached daily use yet', score: 0 },
      ],
      topic: 'moving pilots into daily use',
      action: 'Agree before the next pilot starts what it must show to go live, and who decides',
      evidence: ['cisco-ai-readiness-2025-infrastructure-gap-indicators', 'gartner-ai-maturity-2025-45-percent-operational-three-years'],
    },
  ],
  talent: [
    {
      id: 'ta_access',
      question: 'What share of your staff can use a company-approved AI tool for work?',
      options: [
        { label: 'Over 75%', score: 100 },
        { label: '40% to 75%', score: 70 },
        { label: 'Under 40%', score: 40 },
        { label: 'None, or not sure', score: 0 },
      ],
      topic: 'staff access to an approved AI tool',
      action: 'Give everyone on the first workflow’s team access to the enterprise AI account your company already has, or set one up if there is none',
      evidence: ['bcg-widening-ai-value-gap-tool-access-upskilling-indicators'],
    },
    {
      id: 'ta_training',
      question: 'In the past 12 months, what share of staff had at least five hours of AI training or guided practice?',
      options: [
        { label: 'Over half', score: 100 },
        { label: 'A quarter to half', score: 70 },
        { label: 'Under a quarter', score: 40 },
        { label: 'None, or not sure', score: 0 },
      ],
      topic: 'AI training',
      action: 'Give the team that runs the first workflow at least five hours of practice on that workflow itself, not a generic course',
      evidence: ['bcg-ai-at-work-2025-five-hours-training', 'humlum-2025-employer-initiatives-double-adoption'],
    },
    {
      id: 'ta_builders',
      question: 'Who could build or look after an AI workflow for you today?',
      options: [
        { label: 'An in-house team or specialist', score: 100 },
        { label: 'Trained people in the business, with outside help when needed', score: 70 },
        { label: 'One enthusiast, informally', score: 40 },
        { label: 'No one yet', score: 0 },
      ],
      topic: 'people who can build and run AI workflows',
      action: 'Pair whoever builds the first workflow, inside or outside the company, with the person who will run it afterwards',
      evidence: ['eurostat-2025-barriers-lack-of-expertise', 'cisco-ai-readiness-2025-pacesetter-practice-per-pillar'],
    },
  ],
  governance: [
    {
      id: 'g_policy',
      question: 'Is there a written AI use policy, and do staff know what it says?',
      options: [
        { label: 'Yes, and staff were taken through it', score: 100 },
        { label: 'Yes, shared in writing', score: 70 },
        { label: 'It is being written', score: 40 },
        { label: 'No, or not sure', score: 0 },
      ],
      topic: 'a written AI use policy',
      action: 'Write a one-page AI use policy: work goes through the enterprise AI account your company already has, which data may go into it, and who approves new uses',
      evidence: ['slack-2024-guidelines-six-times-more-likely', 'kpmg-melbourne-2025-training-and-policy-gap'],
    },
    {
      id: 'g_review',
      question: 'When AI output reaches a customer or feeds a decision, is a review step by a person defined?',
      options: [
        { label: 'Yes, written down for each use', score: 100 },
        { label: 'Yes, by habit, but not written down', score: 70 },
        { label: 'Sometimes', score: 40 },
        { label: 'No, or not sure', score: 0 },
      ],
      topic: 'a review step for AI output',
      action: 'Write down who checks the first workflow’s output before it reaches a customer or a decision, and what they check',
      evidence: ['cisco-ai-readiness-2025-pacesetter-practice-per-pillar', 'kpmg-melbourne-2025-training-and-policy-gap'],
    },
    {
      id: 'g_inventory',
      question: 'Do you keep a list of the AI tools and uses in your company?',
      options: [
        { label: 'Yes, kept up to date, with a risk level for each', score: 100 },
        { label: 'Yes, but without risk levels', score: 70 },
        { label: 'Partly; we know some teams’ tools', score: 40 },
        { label: 'No, or not sure', score: 0 },
      ],
      topic: 'a list of AI tools and uses',
      action: 'Start a short list of the AI tools in use, who uses them and for what, and mark the ones that touch customer or personal data',
      evidence: ['cisco-ai-readiness-2025-pacesetter-practice-per-pillar'],
      skipForSmallTeams: true,
    },
    {
      id: 'g_approval',
      question: 'When a team wants to start a new use of AI, who approves it?',
      options: [
        { label: 'A named person or group, through a set process', score: 100 },
        { label: 'A named person, case by case', score: 70 },
        { label: 'The team’s own manager', score: 40 },
        { label: 'No one; teams decide alone, or not sure', score: 0 },
      ],
      topic: 'approving new AI uses',
      action: 'Name one person who approves new AI uses and three things they check: which data goes in, who reviews the output, how it is measured',
      evidence: ['deloitte-state-of-ai-2026-senior-leaders-shape-governance', 'mckinsey-state-of-ai-2025-ceo-oversight-governance'],
    },
  ],
  culture: [
    {
      id: 'c_weekly',
      question: 'What share of your staff use AI for work at least once a week?',
      options: [
        { label: 'Over half', score: 100 },
        { label: 'A quarter to half', score: 70 },
        { label: 'Under a quarter', score: 40 },
        { label: 'None, or not sure', score: 0 },
      ],
      topic: 'weekly AI use',
      action: 'Run a short session where each team brings one real task to the enterprise AI account your company already has (set one up first if there is none) and shares what worked',
      evidence: ['ons-2026-adoption-shallow-extent-indicators'],
    },
    {
      id: 'c_codesign',
      question: 'When work changes because of AI, who designs the change?',
      options: [
        { label: 'The team that does the work, with support', score: 100 },
        { label: 'Managers, after asking the team', score: 70 },
        { label: 'Managers or IT, and the team hears afterwards', score: 40 },
        { label: 'No change made yet, or not sure', score: 0 },
      ],
      topic: 'who designs changes to the work',
      action: 'Bring the people who run the first workflow into redesigning it, from the first mapping session',
      evidence: ['census-btos-2026-64-percent-no-organizational-adjustments', 'kim-2009-value-and-support-reduce-resistance'],
    },
    {
      id: 'c_open',
      question: 'Do people talk openly about how they use AI in their work?',
      options: [
        { label: 'Yes, they share what works in team settings', score: 100 },
        { label: 'Some do, informally', score: 70 },
        { label: 'Rarely; it does not come up', score: 40 },
        { label: 'People seem to keep it to themselves, or not sure', score: 0 },
      ],
      topic: 'talking openly about AI use',
      action: 'Ask leaders to share one way they use AI, including what did not work, at the next team meeting',
      evidence: ['kpmg-melbourne-2025-57-percent-hide-ai-use'],
    },
    {
      id: 'c_people_plan',
      question: 'When an AI change affects someone’s job, do they get a plan covering what changes for them, their training and who to ask?',
      options: [
        { label: 'Yes, every time', score: 100 },
        { label: 'It has happened once or twice', score: 70 },
        { label: 'Informally, if they ask', score: 40 },
        { label: 'No, or not sure', score: 0 },
      ],
      topic: 'a plan for people whose work changes',
      action: 'Tell the people in the first workflow plainly what changes for them and what does not, and name who they can ask',
      evidence: ['cisco-ai-readiness-2025-pacesetter-practice-per-pillar'],
    },
  ],
};

/** The questions a company of this team size is asked, by area. */
export function questionsForTeamSize(teamSize: string | null | undefined): Record<AssessmentAreaKey, AssessmentQuestion[]> {
  const small = !!teamSize && SMALL_TEAM_SIZES.includes(teamSize);
  return Object.fromEntries(
    Object.entries(ASSESSMENT_QUESTIONS).map(([key, qs]) => [key, small ? qs.filter((q) => !q.skipForSmallTeams) : qs]),
  ) as Record<AssessmentAreaKey, AssessmentQuestion[]>;
}

export const ASSESSMENT_QUESTION_COUNT = Object.values(ASSESSMENT_QUESTIONS).flat().length;
export const ASSESSMENT_QUESTION_COUNT_SMALL = Object.values(questionsForTeamSize(SMALL_TEAM_SIZES[0])).flat().length;
