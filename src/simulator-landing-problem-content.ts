// Simulator landing, "problem" section copy (research/simulator-landing-outline.md).
// Copy is data (DESIGN.md: Page copy is data). Every figure below is read at its source in the hub
// knowledge base (verified 2026-10-12) and carries its source line. MIT NANDA is CONTESTED: shown
// only with its method and caveat. No invented numbers. The copy suite runs on this file before ship.

export const SIM_PROBLEM = {
  id: 'why-it-stalls',
  eyebrow: 'Why it stalls',
  title: 'Most CEOs report no AI payoff',
  subtitle: 'Big surveys of CEOs and executives keep finding the same gap between what companies spend on AI and what they can show for it.',
  closing: {
    line: 'Spend is easy to approve. Return is hard to show.',
    bridge: 'So the P&L comes first.',
  },
} as const

export const SIM_PROBLEM_PWC = {
  value: '56%',
  label: 'of CEOs say AI has brought neither higher revenue nor lower costs in the past year.',
  both: { value: '12%', label: 'report both.' },
  // 100 dots: 56 neither, 12 both, 32 all other answers.
  dots: { neither: 56, both: 12 },
  legend: { neither: 'Neither', both: 'Both', other: 'All other answers' },
  sample: '4,454 CEOs',
  source: 'PwC Global CEO Survey 2026, 4,454 CEOs in 95 countries',
  visualLabel: 'One hundred dots. 56 mark CEOs who see neither higher revenue nor lower costs from AI, 12 mark CEOs who see both.',
} as const

export const SIM_PROBLEM_MCKINSEY = {
  value: '21%',
  label: 'of companies using gen AI had fundamentally redesigned even some of their workflows.',
  note: 'Of 25 practices McKinsey tested, workflow redesign had the biggest effect on profit impact. It was the least common.',
  source: 'McKinsey, The State of AI: How organizations are rewiring to capture value, survey fielded July 2024',
  barLabel: 'Bar showing 21 of 100 companies redesigned workflows.',
  barCaption: { yes: 'Redesigned', rest: 'Did not' },
} as const

export const SIM_PROBLEM_BCG = {
  value: '70%',
  label: 'of resources go to people and processes at the companies that get results, BCG reports.',
  note: 'Leaders put the rest into technology and data, and into the algorithms themselves.',
  segments: [
    { value: 10, label: 'Algorithms' },
    { value: 20, label: 'Technology and data' },
    { value: 70, label: 'People and processes' },
  ],
  source: 'BCG, Where’s the Value in AI?, 2024, 1,000 executives in 59 countries',
  barLabel: 'Bar split 10 percent algorithms, 20 percent technology and data, 70 percent people and processes.',
} as const

export const SIM_PROBLEM_MIT = {
  value: '95%',
  label: 'of organizations got zero measurable P&L return from gen AI.',
  tag: 'Contested',
  detail: 'A preliminary report, built on 153 survey respondents.',
  caveat:
    'The most quoted number of 2025, and the thinnest method here. The sample was recruited at conferences and the authors call their own figures directional. We show it because you will hear it, not because we lean on it.',
  source: 'MIT NANDA, The GenAI Divide: State of AI in Business 2025 (preliminary)',
  arcLabel: 'Ring filled to 95 percent.',
} as const
