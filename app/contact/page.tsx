import type { Metadata } from 'next'
import ContactPage from '@/src/views/ContactPage'
import { SEO_CONFIGS } from '@/src/components/seo-configs'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  alternates: { canonical: '/contact' },
  title: SEO_CONFIGS.contact.title,
  description: SEO_CONFIGS.contact.description,
  keywords: SEO_CONFIGS.contact.keywords,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.contact.ogTitle,
    description: SEO_CONFIGS.contact.ogDescription,
    url: SEO_CONFIGS.contact.ogUrl,
  },
}

export default function Page() {
  return <ContactPage />
}
