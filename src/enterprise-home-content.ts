import { siteContent } from '@/src/site-content'
// ── Homepage (/) — visual layer ─────────────────────────────────────────────
// Companion to src/enterprise-content.ts (2026-10 homepage overhaul). That file
// holds the homepage prose; this one holds what the redesign added around it:
// the methodology card links, the image and screenshot each section shows, the
// curriculum role order, and alt text. Kept separate so prose edits and layout
// edits never collide. Page copy is still data: every string here renders.
//
// Persona target: founder-visionary (home primary), gatekeeper-coo (secondary).
// New lines here went through vibrana-copywriting → persona-review.

// Where each "One methodology, four parts" card links, keyed by the pillar
// title in ENTERPRISE_METHODOLOGY (src/enterprise-content.ts).
export const METHODOLOGY_LINKS: Record<string, { href: string; external: boolean }> = siteContent("enterprise-home-content.METHODOLOGY_LINKS", {
  'Readiness Assessment': { href: '/ai-readiness', external: false },
  'Company Brain': { href: 'https://aiosbrain.dev/team-brain', external: true },
  'Learning Journeys': { href: '/learn', external: false },
  'Agentic OS': { href: 'https://aiosbrain.dev/workspace', external: true },
})

export interface HomeImage {
  /** Imagery manifest id (public/assets/imagery/manifest.json). */
  id: string
  alt: string
}

// Featured case study card image. A real workshop photo of John (founder) and
// Fatma, Vibrana-graded. Not the client's team.
export const FEATURED_CASE_STUDY_IMAGE: HomeImage = siteContent("enterprise-home-content.FEATURED_CASE_STUDY_IMAGE", {
  id: 'ppl-john-fatma-session',
  alt: 'John Ellison and Fatma working through a build together at a workshop table',
})

// Engagement card images, keyed by the engagement title in ENTERPRISE_ENGAGEMENTS
// (so reordering or editing the prose never mismatches an image).
export const ENGAGEMENT_MEDIA: Record<string, HomeImage & { ctaHref?: string }> = siteContent("enterprise-home-content.ENGAGEMENT_MEDIA", {
  'AI Build Sprint': {
    id: 'eng-sprint-table',
    alt: 'A small cross-functional team around a wooden table, a web app on the wall screen',
    ctaHref: '/ai-build-sprint',
  },
  'Company-Wide Transformation': {
    id: 'eng-transformation-call',
    alt: 'A laptop showing a company all-hands video call, one colleague per tile',
    ctaHref: '/ai-transformation',
  },
  'Agentic Learning Journeys': {
    id: 'eng-journeys-laptop',
    alt: 'Two colleagues, seen from behind, working through a learning module on a laptop',
    ctaHref: '/learn',
  },
})

export const ENGAGEMENT_CTA = siteContent("enterprise-home-content.ENGAGEMENT_CTA", {
  'AI Build Sprint': 'Explore the AI Build Sprint',
  'Company-Wide Transformation': 'Explore Transformation',
  'Agentic Learning Journeys': 'See the learning journeys',
} as Record<string, string>)

// One image per phase of the 12-week arc, in TRANSFORMATION_PHASES order.
export const PHASE_MEDIA: HomeImage[] = siteContent("enterprise-home-content.PHASE_MEDIA", [
  { id: 'eng-sprint-table-a', alt: 'A team mapping how its work flows, one colleague walking the others through it on the wall screen' },
  { id: 'sprint-track-workflow', alt: 'Hands at a keyboard building an automated workflow' },
  { id: 'sprint-track-people', alt: 'Colleagues learning together around a table' },
  { id: 'phase-embed', alt: 'A notebook handed across a table beside an open laptop' },
])

// The 20 roles the homepage grid shows (the full 23 live on /learn). Chosen for
// the 150-500 person ICP: Sales in; Revenue Operations, Engineering Management
// and Advertising (covered by Marketing and Growth) left to /learn.
export const HOMEPAGE_ROLE_ORDER = siteContent("enterprise-home-content.HOMEPAGE_ROLE_ORDER", [
  'Leadership',
  'Operations',
  'Finance',
  'Accounting',
  'Legal',
  'People Ops',
  'Recruiting',
  'Sales',
  'Marketing',
  'Growth',
  'Brand',
  'Content',
  'Customer Success',
  'Customer Support',
  'Product',
  'Product Design',
  'Engineering',
  'Machine Learning',
  'Analytics',
  'IT Systems',
])

// AIOS screenshots (light mode, from aios-website), in AIOS_ECOSYSTEM.points order
// for the first two points. The third point (open source) renders as a strip.
export const AIOS_SCREENSHOTS = siteContent("enterprise-home-content.AIOS_SCREENSHOTS", [
  {
    src: '/assets/imagery/homepage/prism-grid-solar.webp',
    alt: 'The AIOS workspace: a personal agent workspace with tasks, context and chat',
    width: 1280,
    height: 836,
  },
  {
    src: '/assets/imagery/homepage/prism-grid-solar.webp',
    alt: 'The AIOS team brain home: ask the brain, knowledge growth, recent decisions and open tasks',
    width: 1280,
    height: 1588,
  },
])

// Closing card: the readiness report on a tablet over a desk photo.
export const CLOSING_MOCK = siteContent("enterprise-home-content.CLOSING_MOCK", {
  sceneId: 'scene-desk-wood',
  screenshot: {
    src: '/assets/public-demo/readiness-profile-desktop.svg',
    alt: 'A sample AI readiness profile: an overall score and a bar for each category',
    width: 1600,
    height: 1000,
  },
  primaryCta: { text: 'Take the Readiness Assessment', href: '/ai-readiness' },
})
