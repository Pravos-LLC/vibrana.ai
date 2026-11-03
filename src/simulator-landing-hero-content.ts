// Simulator landing, hero sandbox (MiniSimulator) and sizzle reel copy. Copy is data.
// Source: hub gtm/programs/assessment-landing-pages/copy/simulator.md (Wave 1 deck, ledger X3 to X13, J5).
// Headline B is John's pick (2026-11-02, J5). Every number the sandbox prints is a range from the real
// engine (src/lib/simulator); `howBody` restates the fixed preview inputs in SANDBOX_FIXED (sandbox.ts),
// so change both together or the line is false. No headcount or job-cut language; no em dashes.

import type { Pace } from '@/src/lib/simulator/types'

export const SIM_HERO = {
  eyebrow: 'AI Transformation Simulator / try it here',
  /** Rendered as three parts so the middle word takes the serif accent. */
  title: { before: 'No venture launches without a P&L. Try ', accent: 'yours', after: ' for AI.' },
  subtitle: 'Pick a sector, then set your size and pace. Run cost, capacity and time freed move as you do. No email to play.',
  ctaPrimary: 'Run it on your company',
  ctaSecondary: 'Watch a full run',
  formNote: 'The full simulator starts from your website and asks for a work email to show your result. No newsletter.',
} as const

export const SIM_MINI = {
  /** Accessible name of the sandbox region. */
  label: 'Mini simulator',
  sectorLabel: 'Sector',
  moreSectors: 'More sectors',
  peopleLabel: 'People',
  peopleValue: (n: string) => `${n} people`,
  peopleHint: 'Drag to resize the company',
  paceLabel: 'Pace / our assumptions',
  paceHint: {
    cautious: 'Up to 60% using AI, half of them by month 9',
    steady: 'Up to 80% using AI, half of them by month 6',
    ambitious: 'Up to 92% using AI, half of them by month 3',
  } satisfies Record<Pace, string>,
  outputs: {
    capacity: { label: 'Extra capacity a year', unit: 'At month-12 pace' },
    runCost: { label: 'AI running cost a month' },
    timeFreed: { label: 'Work time freed', unit: 'Of all working hours at month 12' },
  },
  rangeLabel: 'Range',
  roadmapLabel: 'Months 0 to 24',
  /** Accessible description of the roadmap strip (a curve of the share of people using AI). */
  roadmapAria: (pace: string) => `Share of people using AI, months 0 to 24, at a ${pace} pace`,
  howLink: 'How we calculated this',
  howBody:
    'Same engine as the full simulator, three scenarios over 24 months, read at month 12. Fixed for this preview: two model providers, a $50 per-person monthly spend ceiling, internal data and US pay levels. The pace figures are our assumptions. In the full simulator you set the providers, ceiling, data rule and pace yourself, and change pay levels in the assumptions.',
  reset: 'Back to the sample insurer',
  liveAnnounce: (range: string) => `Updated. Extra capacity: ${range} a year.`,
  headcountNote: 'Headcount stays flat. Freed hours show as capacity, never as people.',
  /** Visually hidden, shown with reduced motion. */
  reducedMotionNote: 'Numbers update without rolling.',
} as const

export const SIM_SIZZLE_STAGE = {
  playLabel: 'Watch',
  playingLabel: 'Playing',
  labels: { play: 'Play the film', pause: 'Pause the film', sound: 'Turn sound on' },
  clipLabel: 'Simulator run',
  caption: 'FIG 1 / A full run, from website to roadmap',
  title: 'A short film of the AI Transformation Simulator building a two-year model for a company',
} as const
