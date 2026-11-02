// Whitepaper delivery email (POST /api/whitepaper, from the assessment results page).
// Copy is data (repo rule): lib/whitepaper-email.ts renders these strings and holds
// layout only.

import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'

export const WHITEPAPER_PDF_PATH = '/downloads/AI-Transformation-Whitepaper.pdf'

export const WHITEPAPER_EMAIL = {
  subject: "Your AI transformation whitepaper",
  eyebrow: 'VIBRANA',
  heading: "AI Transformation: Optimism vs. Reality",
  greeting: 'Hi there,',
  intro: "Here is the whitepaper you asked for, written by John Ellison. The link below stays live, so keep this email for when you need it.",
  downloadLabel: "Download the whitepaper (PDF)",
  /** Shown only when the request came from the assessment results page. */
  assessmentNote:
    "Read it next to your AI Readiness Report. The paper covers the research on AI adoption and our roadmap. Start with one workflow, with a go/no-go at each phase.",
  closing:
    'If you want to walk through your report with us, book a 30-minute fit call with a builder, not a salesperson. We will tell you plainly whether a sprint makes sense now or not yet. You decide from there.',
  ctaLabel: 'Book a fit call',
  ctaUrl: SPRINT_FIT_CALL_URL,
  /** Matches the assessment nurture emails, including the Day 10 whitepaper email. */
  signoff: 'John Ellison & Fatma Ghedira | Vibrana',
} as const
