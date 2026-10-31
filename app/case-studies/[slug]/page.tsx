import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CaseStudyPage from '@/src/views/CaseStudyPage'
import { draftsVisible, getCaseStudy, getPublishedCaseStudies, getRoutableCaseStudies, caseStudyName, type CaseStudy } from '@/src/lib/case-studies'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'
import { JsonLd } from '@/src/components/JsonLd'
import { ORGANIZATION_JSON_LD, ORGANIZATION_ID, absoluteUrl } from '@/src/lib/site'

export function generateStaticParams() {
  return getRoutableCaseStudies().map((cs) => ({ slug: cs.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study || (!study.published && !draftsVisible())) return {}
  const name = caseStudyName(study)
  const path = `/case-studies/${study.slug}`
  return {
    title: `${study.oneLineOutcome} | Case Study | Vibrana`,
    description: study.summary,
    alternates: { canonical: path },
    // Drafts must never be indexed.
    robots: study.published ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'article',
      images: [SITE_OG_IMAGE],
      title: `${study.oneLineOutcome} | Case Study | Vibrana`,
      description: study.summary,
      url: absoluteUrl(path),
      ...(study.publishedAt && { publishedTime: study.publishedAt }),
      ...(study.ogImage && { images: [{ url: study.ogImage, width: 1200, height: 630, alt: name }] }),
    },
    ...(study.ogImage && {
      twitter: {
        card: 'summary_large_image',
        title: `${study.oneLineOutcome} | Case Study | Vibrana`,
        description: study.summary,
        images: [study.ogImage],
      },
    }),
  }
}

function caseStudyJsonLd(study: CaseStudy) {
  const name = caseStudyName(study)
  const url = absoluteUrl(`/case-studies/${study.slug}`)
  const image = study.ogImage ? absoluteUrl(study.ogImage) : undefined
  const video =
    study.sizzleReelSrc && study.sizzleReelPoster && study.publishedAt
      ? {
          '@type': 'VideoObject',
          name: `${name}: ${study.oneLineOutcome}`,
          description: study.summary,
          thumbnailUrl: absoluteUrl(study.sizzleReelPoster),
          contentUrl: absoluteUrl(study.sizzleReelSrc),
          uploadDate: study.publishedAt,
        }
      : undefined
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ORGANIZATION_JSON_LD,
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: study.oneLineOutcome || name,
        description: study.summary,
        url,
        mainEntityOfPage: url,
        ...(image && { image }),
        ...(study.publishedAt && { datePublished: study.publishedAt }),
        author: { '@id': ORGANIZATION_ID },
        publisher: { '@id': ORGANIZATION_ID },
        ...(video && { video }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Case Studies', item: absoluteUrl('/case-studies') },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study || (!study.published && !draftsVisible())) notFound()
  return (
    <>
      {study.published && <JsonLd data={caseStudyJsonLd(study)} />}
      <CaseStudyPage
        study={study}
        relatedStudies={getPublishedCaseStudies()
          .filter((related) => related.slug !== study.slug)
          .map(({ slug, oneLineOutcome, summary }) => ({ slug, oneLineOutcome, summary }))}
      />
    </>
  )
}
