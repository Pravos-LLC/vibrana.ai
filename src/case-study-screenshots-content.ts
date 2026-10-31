/** Copy + metadata for case-study product screenshots (caption text only). */

export type CaseStudyScreenshotFrame = 'laptop' | 'tablet' | 'phone'

export interface CaseStudyScreenshot {
  id: string
  /** Short skim label — shown under the thumbnail. */
  tag: string
  title: string
  caption: string
  url: string
  frame?: CaseStudyScreenshotFrame
}

export const PROPTECH_SCREENSHOTS: CaseStudyScreenshot[] = [
  {
    id: 'unified-inbox',
    tag: 'Unified inbox',
    title: 'Unified inbox with grounded replies',
    caption:
      'Client emails in one queue; cited drafts in the right language, grounded in canonical answers.',
    url: 'client-assistant/inbox',
    frame: 'laptop',
  },
  {
    id: 'knowledge-studio',
    tag: 'Knowledge studio',
    title: 'Knowledge graph & training studio',
    caption:
      'Expert answers visualised as a graph, with historical email ingestion and canonical curation.',
    url: 'client-assistant/knowledge',
    frame: 'laptop',
  },
  {
    id: 'bi-dashboard',
    tag: 'Ops dashboard',
    title: 'Operations intelligence',
    caption:
      'Response time, resolution rate, and market coverage — the metrics leadership tracks weekly.',
    url: 'client-assistant/insights',
    frame: 'tablet',
  },
]

export const INSURTECH_SCREENSHOTS: CaseStudyScreenshot[] = [
  {
    id: 'unified-inbox',
    tag: 'Omnichannel inbox',
    title: 'Chat, email & voice — one inbox',
    caption: 'Chat, email, and voice callbacks in a single queue with instant policy lookup.',
    url: 'assist.client.vibrana.ai/inbox',
    frame: 'laptop',
  },
  {
    id: 'live-call-qa',
    tag: 'Live call QA',
    title: 'Live call QA & compliance',
    caption: 'Real-time transcription, script guidance, and FCA-aligned compliance scoring.',
    url: 'assist.client.vibrana.ai/calls/live',
    frame: 'phone',
  },
  {
    id: 'team-admin',
    tag: 'Team dashboard',
    title: 'Team performance & coaching',
    caption: 'Per-agent QA, compliance trends, and coaching notes for managers.',
    url: 'assist.client.vibrana.ai/team',
    frame: 'laptop',
  },
]

export const CASE_STUDY_SCREENSHOTS: Record<string, CaseStudyScreenshot[]> = {
  'european-proptech-rag': PROPTECH_SCREENSHOTS,
  'insurtech-qa-knowledge-base': INSURTECH_SCREENSHOTS,
}

export const CASE_STUDY_SCREENSHOTS_SECTION = {
  eyebrow: 'Deliverables',
  heading: 'Three surfaces, one system',
  footnote:
    'Vibrana-branded retrospective UI · pen-name clients · illustrative, not a live product',
}

/** Shared max-width for case-study article column (~672px / standard blog). */
export const CASE_STUDY_ARTICLE_CLASS = 'mx-auto w-full max-w-184'
