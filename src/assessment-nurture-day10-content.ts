// Day 10 email in the org-assessment nurture sequence. It delivers the whitepaper PDF, so every
// claim here must be true of public/downloads/AI-Transformation-Whitepaper.pdf.
export const ASSESSMENT_NURTURE_DAY10 = {
  subject: 'The AI transformation research behind your report',
  heading: 'AI Transformation: Optimism vs. Reality',
  tagline: 'Our guide to why AI initiatives stall, with every source listed',
  intro: "I mentioned our AI transformation research earlier. Here's the full breakdown.",
  downloadLabel: 'Download Whitepaper (PDF)',
  insideIntro: "Inside you'll find:",
  insideBullets: [
    'Why more than half of CEOs have seen neither higher revenue nor lower costs from AI (PwC, 2026)',
    'What the research says gets in the way: mostly people and process, not technology',
    "What AI high performers, about 6% of respondents in McKinsey's 2026 State of AI, do differently",
    'How we sequence the work, one workflow first, with a go/no-go at each phase',
    'A pre-deployment governance checklist',
  ],
  closing: 'Read it alongside the assessment report we emailed you on day one.',
} as const
