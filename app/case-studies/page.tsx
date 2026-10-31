import type { Metadata } from 'next'
import CaseStudiesIndexPage from '@/src/views/CaseStudiesIndexPage'
import { SEO_CONFIGS } from '@/src/components/seo-configs'
import { getPublishedCaseStudies, caseStudyName, CASE_STUDIES_HERO } from '@/src/lib/case-studies'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  alternates: { canonical: '/case-studies' },
  title: SEO_CONFIGS.caseStudies.title,
  description: SEO_CONFIGS.caseStudies.description,
  keywords: SEO_CONFIGS.caseStudies.keywords,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.caseStudies.ogTitle,
    description: SEO_CONFIGS.caseStudies.ogDescription,
    url: SEO_CONFIGS.caseStudies.ogUrl,
  },
}

export default function Page() {
  const studies = getPublishedCaseStudies().map((cs) => ({
    slug: cs.slug,
    vertical: cs.vertical,
    name: caseStudyName(cs),
    // An anonymized client has no public mark: its pen-name logo is not shown.
    logo: cs.client ? cs.logo : null,
    anonymized: cs.client === null,
    oneLineOutcome: cs.oneLineOutcome,
    summary: cs.summary,
  }))
  return <CaseStudiesIndexPage studies={studies} hero={CASE_STUDIES_HERO} />
}
