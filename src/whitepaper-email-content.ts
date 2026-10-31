import { siteContent } from '@/src/site-content'
// Whitepaper delivery email (POST /api/whitepaper, from the assessment results page).
// Copy is data (repo rule): lib/whitepaper-email.ts renders these strings and holds
// layout only.

import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'

export const WHITEPAPER_PDF_PATH = siteContent("whitepaper-email-content.WHITEPAPER_PDF_PATH", '/downloads/public-demo-guide.txt')

export const WHITEPAPER_EMAIL = siteContent("whitepaper-email-content.WHITEPAPER_EMAIL", {
  subject: 'Your public demo download',
  eyebrow: 'VIBRANA',
  heading: 'Public demo download',
  greeting: 'Hi there,',
  intro: 'This text file exercises the sample download and email workflow. The original whitepaper is not included in this source release.',
  downloadLabel: 'Download the demo guide',
  /** Shown only when the request came from the assessment results page. */
  assessmentNote:
    'Use independent local services and synthetic data for this public demo.',
  closing:
    'If you want to walk through your report with us, book a 30-minute fit call with a builder, not a salesperson. We will tell you plainly whether a sprint makes sense now or not yet. You decide from there.',
  ctaLabel: 'Book a fit call',
  ctaUrl: SPRINT_FIT_CALL_URL,
  /** Matches the assessment nurture emails, including the Day 10 whitepaper email. */
  signoff: 'John Ellison & Fatma Ghedira | Vibrana',
} as const)
