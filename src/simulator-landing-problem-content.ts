// Simulator landing, "problem" section copy (research/simulator-landing-outline.md).
// Copy is data (DESIGN.md: Page copy is data). Every figure below is read at its source in the hub
// knowledge base (verified 2026-10-12) and carries its source line. MIT NANDA is CONTESTED: shown
// only with its method and caveat. McKinsey 21% and BCG 70/20/10 moved to the Readiness page (deck §3, plan S4). No invented numbers. The copy suite runs on this file before ship.

export const SIM_PROBLEM = {
  id: 'why-it-stalls',
  eyebrow: 'Why it stalls',
  title: 'Most CEOs report no AI payoff',
  subtitle: 'A survey of 4,454 CEOs, and the most quoted number of 2025, shown with its caveat.',
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
