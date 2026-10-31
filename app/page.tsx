import type { Metadata } from 'next'
import EnterpriseHomePage from '@/src/views/EnterpriseHomePage'
import { SEO_CONFIGS } from '@/src/components/seo-configs'
import { getCaseStudy } from '@/src/lib/case-studies'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'
import { JsonLd } from '@/src/components/JsonLd'
import { ORGANIZATION_JSON_LD, ORGANIZATION_ID, SITE_NAME, SITE_URL } from '@/src/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: SEO_CONFIGS.home.title,
  description: SEO_CONFIGS.home.description,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.home.ogTitle,
    description: SEO_CONFIGS.home.ogDescription,
    url: SEO_CONFIGS.home.ogUrl,
  },
}

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { ...ORGANIZATION_JSON_LD, description: SEO_CONFIGS.home.description },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      publisher: { '@id': ORGANIZATION_ID },
    },
  ],
}

// Featured on the homepage: a Sprint-shaped engagement (an overnight prototype, then
// seven of their people trained to build the next tool), read server-side because
// src/lib/case-studies.ts uses `fs`. Was the insurtech QA study; red-team (2026-09)
// BLOCKed it as homepage proof because its product scores call-centre staff and its
// headline reads as replacement. Its full page is unchanged.
const FEATURED_CASE_STUDY_SLUG = 'european-proptech-rag'
// Shown directly below it: the six-week Sampleca6cf3fe07ce transformation.
const SECOND_CASE_STUDY_SLUG = 'orion-tech'

export default function Home() {
  const featuredCaseStudy = getCaseStudy(FEATURED_CASE_STUDY_SLUG)
  const secondCaseStudy = getCaseStudy(SECOND_CASE_STUDY_SLUG)
  return (
    <>
      <JsonLd data={HOME_JSON_LD} />
      <EnterpriseHomePage
        featuredCaseStudy={featuredCaseStudy?.published ? featuredCaseStudy : undefined}
        secondCaseStudy={secondCaseStudy?.published ? secondCaseStudy : undefined}
      />
    </>
  )
}
