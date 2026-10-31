// Simulator landing, "lessons" and "why we built this" copy (research/simulator-landing-outline.md).
// Copy is data (DESIGN.md: Page copy is data). Lessons are qualitative and come from the Vibrana point
// of view in the hub knowledge base (pov/). Evidence lines are verified findings only (verified
// 2026-10-12), each with its source. No clients are named; no invented numbers or quotes.
// Tool facts come from research/simulator-copy-brief.md. The copy suite runs on this file before ship.

export const SIM_LESSONS = {
  id: 'lessons',
  eyebrow: 'What we have learned',
  title: 'Four things that decide the outcome',
  subtitle: 'From working inside companies while they roll AI out. The technology is rarely what holds it up.',
  evidenceLabel: 'The research agrees',
  items: [
    {
      id: 'people',
      title: 'People decide the outcome',
      body: 'The model is the easy part now. What decides whether a rollout sticks is whether people feel safe, see how it connects to their work, and get to build with it instead of having it done to them.',
      evidence: 'Resistance to new tools was the most frequent barrier to scaling pilots, across 52 organizations.',
      source: 'MIT NANDA, The GenAI Divide, 2025',
      illustration: 'Four people linked in a network, one connection lighting up.',
    },
    {
      id: 'workflow',
      title: 'Redesign the work itself',
      body: 'A tool dropped into an old process gives old results. Start from how the work really flows, then decide where AI belongs in it.',
      evidence: 'Of 25 practices tested, redesigning workflows had the biggest effect on profit impact.',
      source: 'McKinsey, The State of AI, survey fielded July 2024',
      illustration: 'A five-step flow with a tool bolted on, then a shorter flow with AI inside it.',
    },
    {
      id: 'training',
      title: 'Train each team, and keep going',
      body: 'Support and finance do different work at a different pace. One course for everyone fits neither, and a single session fades. Learning has to fit around real workloads and repeat.',
      evidence: 'Regular use is sharply higher with at least five hours of training plus coaching. Only a third say they were properly trained.',
      source: 'BCG, AI at Work, 2025',
      illustration: 'Three teams with different training needs, and a loop that repeats.',
    },
    {
      id: 'governance',
      title: 'Set the rules before scale',
      body: 'Clear guardrails do not slow people down. They make it safe to try. Decide what is allowed, who signs off and what gets checked before the number of users grows.',
      evidence: 'Half of respondents say their company lacks clear governance for teams of people and AI.',
      source: 'BCG, AI at Work, 2026',
      illustration: 'A gate drawn first, then paths widening behind it.',
    },
  ],
} as const

export const SIM_WHY = {
  id: 'why-we-built-this',
  eyebrow: 'Why we built this',
  title: 'No one launches without a P&L',
  paragraphs: [
    'A new venture gets a P&L before it gets a budget. AI transformation is one of the biggest spends many companies will make this decade, and many plans we see start with the spend and have no P&L at all.',
    'So we built one. Give it your website and it models the next two years: what AI costs to run, the time it takes, and the capacity it frees, team by team. Three scenarios, ranges instead of single numbers, and every range linked to a study or labeled as an assumption.',
    'Every assumption is yours to edit. It reads your homepage once and never stores the page text. Prices were read on 2026-10-15 and are re-read every 90 days. Your result lives on an unlisted link you can delete.',
    'The point is a better conversation, with your board or with us. Walk in with a range you can defend, then decide how much help you want. Headcount stays flat in every scenario.',
  ],
  signature: { name: 'John Ellison', org: 'Vibrana' },
  facts: [
    { value: '7', label: 'inputs' },
    { value: '2', label: 'years modeled' },
    { value: '3', label: 'scenarios' },
  ],
  cta: 'Run it on your company',
} as const
