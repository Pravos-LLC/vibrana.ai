import type { Metadata } from 'next'
import AboutPage from '@/src/views/AboutPage'
import { SEO_CONFIGS } from '@/src/components/seo-configs'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  alternates: { canonical: '/about' },
  title: SEO_CONFIGS.about.title,
  description: SEO_CONFIGS.about.description,
  keywords: SEO_CONFIGS.about.keywords,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.about.ogTitle,
    description: SEO_CONFIGS.about.ogDescription,
    url: SEO_CONFIGS.about.ogUrl,
  },
}

export default function Page() {
  return <AboutPage />
}
