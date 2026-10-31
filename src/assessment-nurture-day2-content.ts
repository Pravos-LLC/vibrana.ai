import { siteContent } from '@/src/site-content'
import { PUBLIC_DEMO_DOWNLOAD as D } from '@/src/public-demo-download-content'

export const ASSESSMENT_NURTURE_DAY2 = siteContent('nurture.day2', {
  heading: D.heading,
  paragraphs: [D.followup] as readonly string[],
  callout: '',
  afterCallout: [] as readonly string[],
  downloadLabel: D.label,
  closing: [] as readonly string[],
})
