// The "Your next steps" plan in the AI Readiness report (results page, email and PDF). Built by
// generateRecommendations in src/lib/assessment/scoring.ts; each low answer adds the action from
// its question (src/assessment-questions-content.ts). Workflow-first, no invented numbers.

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
/** "Governance & Responsible AI" -> "governance & responsible AI" (never "ai"). */
export const areaInText = (dimension: string) => dimension.toLowerCase().replace(/\bai\b/g, 'AI');

export const ASSESSMENT_RECOMMENDATIONS = {
  phase: (n: number) => `Step ${n}`,
  startUnnamed: {
    title: 'Pick one workflow to start with',
    description: 'Start from one workflow your team runs every week, not a company-wide program.',
    actions: [
      'Choose one repetitive workflow where the team feels the most friction',
      'Write down how long it takes today and who owns it. This measures the workflow, not the people in it',
      'Agree who will own it once it runs with AI',
    ],
  },
  /** When the buyer named workflows: the one that frees the most hours at the high end. */
  startNamed: (name: string, borrowedEvidence: boolean) => ({
    title: `Start with ${lower(name)}`,
    description: `Of the workflows you named, ${lower(name)} frees the most hours at the high end of the published range. Start there, not with a company-wide program.`,
    actions: [
      `Time ${lower(name)} for one ordinary week, so you have a measured baseline instead of an estimate. This measures the workflow, not the people in it`,
      'Map its steps with the people who run it, and mark the steps a tool could handle and the ones that could go',
      'Agree who will own it once it runs with AI',
      ...(borrowedEvidence ? ['Its range comes from a study of another task, so check it against your own timing before you decide to build'] : []),
    ],
  }),
  shoreUpTitle: (dimension: string) => `Shore up ${areaInText(dimension)}`,
  shoreUpDescription: (dimension: string, score: number) =>
    `Your answers put ${areaInText(dimension)} at ${score}/100. It is one of your lowest areas. Only what the first workflow needs:`,
  /** One action per low answer, with the question it came from. */
  fromAnswer: (action: string, topic: string) => `${action} (from your answer on ${topic}).`,
  /** Used when no answer in the area is at 40 or below. */
  fallbackActions: {
    'Leadership & Strategy': 'Name one owner and one measure for the first workflow',
    'Data Readiness': 'Check that the data the first workflow needs is available and owned',
    'Technology Infrastructure': 'Confirm the first workflow can run on systems you already use',
    'Talent & Capability': 'Decide who will maintain the first workflow and fix it when it breaks',
    'Governance & Responsible AI': 'Agree which data may go into AI tools before the first build',
    'Culture & Change Readiness': 'Involve the people who run the workflow in building it',
  },
  build: {
    title: 'Build it, then measure it',
    description: 'Build the workflow with the people who run it, then decide from the result. If it does not beat the baseline, stop there.',
    actions: [
      'Build the first workflow in a fixed-scope effort with a set price and end date, and its future owner involved',
      'Compare it against the baseline you recorded before you started',
      'Choose the next workflow only after the first one is in daily use',
    ],
  },
} as const;
