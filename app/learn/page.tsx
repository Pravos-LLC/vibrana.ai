import type { Metadata } from 'next'
import CurriculumPage from '@/src/views/CurriculumPage'
import { SEO_CONFIGS } from '@/src/components/seo-configs'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  alternates: { canonical: '/learn' },
  title: SEO_CONFIGS.learn.title,
  description: SEO_CONFIGS.learn.description,
  keywords: SEO_CONFIGS.learn.keywords,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.learn.ogTitle,
    description: SEO_CONFIGS.learn.ogDescription,
    url: SEO_CONFIGS.learn.ogUrl,
  },
}

export default function Page() {
  return <CurriculumPage />
}
