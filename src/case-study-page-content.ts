// Case-study page chrome. Copy is data (repo rule) — every string CaseStudyPage
// renders around the markdown body (back link, draft banner, NDA disclaimer, CTA)
// lives here so it's editable without touching the component.

export const CASE_STUDY_PAGE_COPY = {
  backLinkLabel: 'All case studies',

  relatedStudies: {
    heading: 'More AI transformation case studies',
    readLabel: 'Read case study',
    browseAll: 'Browse all case studies',
  },

  draftBanner: {
    prefix: 'Draft — not published. Edit',
    // {slug} is replaced with the study's slug at render time.
    pathTemplate: 'content/case-studies/{slug}.md',
    middle: 'and set',
    flag: 'published: true',
    suffix: 'when ready.',
  },

  ndaDisclaimer:
    "This case study reflects real work Vibrana delivered for a client under NDA. The client's name and identifying details are withheld. The approach, the outcomes and the numbers are real. A reference is available privately on request: hello@vibrana.ai.",

  cta: {
    heading: 'How could AI transform your organization?',
    body: 'The assessment asks 24 questions about what your organization does today, across six areas of AI readiness, and shows you where to start.',
    buttonLabel: 'Take the assessment',
    href: '/ai-readiness',
  },

  heroVideo: {
    youTubeTitle: 'Sizzle reel',
    placeholderLabel: 'Sizzle reel — placeholder, 16:9 YouTube embed',
  },
}
