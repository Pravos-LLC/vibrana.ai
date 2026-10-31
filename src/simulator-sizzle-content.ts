// Simulator sizzle reel, on-screen copy (motion studio reel `simulator-sizzle`).
// Locked script: john-workspace/2-work/vibrana-gtm/simulator-sizzle-2026-10/script.md (approved by John,
// 2026-10-18, with his edit "So we built a detailed simulator."). Every claim maps to facts.txt there:
// the 56% is PwC's "neither higher revenue nor lower costs in the past year" and always carries its source
// line; the UI on screen is the landing page's sample (a 240-person insurer), never a client. No "takes a
// minute" claim (not cleared in research/simulator-copy-brief.md). No em dashes.

export const SIZZLE_COPY = {
  hook: { text: 'Are you going AI-native without a map?', accent: 'map?' },
  stat: {
    value: 56,
    suffix: '%',
    line: 'of CEOs saw no AI payoff last year.',
    detail: 'Neither higher revenue nor lower costs from AI in the past year.',
    source: 'PwC Global CEO Survey 2026, 4,454 CEOs in 95 countries',
  },
  built: { text: 'So we built a detailed simulator.', accent: 'simulator.' },
  /** What types into the real company step: a generic domain, the sample's size. */
  form: { url: 'yourcompany.com', email: 'you@yourcompany.com', people: '240' },
  triple: [
    { text: 'Your costs.', accent: 'costs.' },
    { text: 'Your timeline.', accent: 'timeline.' },
    { text: 'The capacity it frees.', accent: 'capacity' },
  ],
  team: { text: 'Team by team.', accent: 'team.' },
  /**
   * Under the result panels: the numbers are the landing page's illustrative sample, not a promise, with the
   * product's own guardrails (simulator-email-content: capacity is time, never cash; FAQ: headcount stays flat).
   */
  sample: {
    pnl: 'Illustrative result: a 240-person insurer. Extra capacity is time valued at pay levels, never cash.',
    team: 'Illustrative result: a 240-person insurer. Headcount stays flat in every scenario.',
  },
  /** The live form asks for a work email before the result, so the chip never claims otherwise (red-team BLOCK, 2026-10-18). */
  chip: 'Free. Every assumption yours to edit.',
  end: {
    pre: 'See your AI Transformation',
    accent: 'Roadmap',
    url: 'vibrana.ai/simulator',
    markAlt: 'Vibrana',
  },
  brollPlaceholderPrefix: 'B-roll slot',
} as const
