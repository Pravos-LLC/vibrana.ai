/**
 * Simulator landing, how-it-works section. Copy is data. Facts from
 * research/simulator-copy-brief.md: the homepage is read once and page text is never stored,
 * the inputs are providers, a spend ceiling and a pace, the result carries costs, extra
 * capacity by team, a roadmap and a PDF.
 */
export const SIM_LANDING_STEPS = {
  eyebrow: 'How it works',
  title: 'Three steps to your model',
  steps: [
    {
      id: 'company',
      title: 'Start with your website',
      line: 'Add your site, work email and team size. We read the homepage once to suggest your sector and team mix, and never store the page text. The email unlocks your result; there is no newsletter.',
    },
    {
      id: 'setup',
      title: 'Set your limits',
      line: 'Pick your AI providers, a monthly spend ceiling and the pace of the rollout.',
    },
    {
      id: 'model',
      title: 'Read your model',
      line: 'Costs, extra capacity by team and a roadmap. The PDF carries every assumption, so your leadership team can check it.',
    },
  ],
  cta: 'Build my model',
  stepLabel: (n: number) => `Step ${n}`,
} as const
