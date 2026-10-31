/**
 * Simulator landing, walkthrough section. Copy is data; the component only lays it out.
 * Tool facts come from research/simulator-copy-brief.md (verified table). The sample is the
 * same 240-person insurer the hero shows (SamplePreview.tsx). No headcount or job-cut language.
 */
export const SIM_WALKTHROUGH = {
  eyebrow: 'The real output',
  title: 'See your model, piece by piece',
  subtitle: 'A sample run for a 240-person insurer. The numbers are modeled, not measured at a customer, and every picture comes from the same engine as your result.',
  steps: [
    {
      id: 'network',
      title: 'Capacity spreads, month by month',
      line: 'Scroll through the 24 months. The company brain is the shared knowledge every team draws on. Hours freed go to other work; headcount stays flat.',
    },
    {
      id: 'pnl',
      title: 'Costs above, capacity below',
      line: 'Run cost and training time sit above the line. Extra capacity sits below it, with a range for each month. Every assumption is listed in your result, and you can edit it.',
    },
    {
      id: 'net',
      title: 'With Vibrana or on your own',
      line: 'The running total for both routes, with the break-even month marked. Both use the same engine and inputs.',
    },
    {
      id: 'readiness',
      title: 'Where you start sets the cost',
      line: 'Six answers move how fast people adopt and how much training time it takes.',
    },
  ],
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
