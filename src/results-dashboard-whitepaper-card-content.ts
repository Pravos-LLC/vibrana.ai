import { siteContent } from '@/src/site-content'
import { PUBLIC_DEMO_DOWNLOAD as D } from '@/src/public-demo-download-content'
export const RESULTS_WHITEPAPER_CARD = siteContent("results-dashboard-whitepaper-card-content.RESULTS_WHITEPAPER_CARD", {
  heading: D.heading,
  body: D.description,
  highlights: ['Synthetic text download', 'Local email workflow fixture'],
} as const)
