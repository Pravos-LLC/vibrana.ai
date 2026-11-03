/**
 * Simulator landing, walkthrough section. Copy is data; the component only lays it out.
 * Tool facts come from research/simulator-copy-brief.md (verified table). The sample is the
 * same 240-person insurer the hero shows (SamplePreview.tsx). No headcount or job-cut language.
 */
export const SIM_WALKTHROUGH = {
  eyebrow: 'The real output',
  title: 'See your model, piece by piece',
  subtitle: 'A sample run for a 240-person insurer. The numbers are modeled, not measured at a customer, and every picture comes from the same engine as your result.',
  /** The scroll run (deck §2): each caption sets the sticky panel's inputs as it passes. */
  steps: [
    { id: 'month-0', caption: 'Month 0. A 240-person insurer at a steady pace, before anyone starts.' },
    { id: 'month-4', caption: 'Month 4. The company brain goes live: what one team builds, others reuse.' },
    { id: 'pnl', caption: 'Costs sit above the line, capacity below, with a range for every month.' },
    { id: 'cautious', caption: 'Switch to Cautious. Half of the people who will use AI get there by month 9, not month 6.' },
    { id: 'readiness', caption: 'Same company, two starting points. Where you start sets the training time.' },
    { id: 'net', caption: 'With Vibrana or on your own: both routes, same engine, break-even month marked.' },
  ],
  presetLabel: (n: number) => `Sample run / step ${n}`,
  takeOver: 'Try it yourself',
  frame: {
    url: 'vibrana.ai/simulator',
    sample: 'Sample insurer',
  },
  network: {
    month: (m: number) => `Month ${m}`,
    hours: 'hours a month freed',
    track: 'Playhead',
    caption: 'Hours freed by team',
    growth: 'Capacity for growth',
  },
  pnl: {
    caption: 'AI P&L projection, 24 months',
  },
  net: {
    caption: 'Net position, central scenario',
  },
  readiness: {
    caption: 'Same company, two starting points',
    lower: 'Lower baseline',
    higher: 'Higher baseline',
    score: 'readiness score',
    half: (m: string) => `Half of people using AI by month ${m}`,
    training: (h: string) => `${h} training hours per person`,
    cost: 'Training time over 24 months',
    bands: { limited: 'Limited', emerging: 'Emerging', developing: 'Developing', established: 'Established', broad: 'Broad' },
  },
  progress: (n: number, total: number) => `Step ${n} of ${total}`,
} as const
