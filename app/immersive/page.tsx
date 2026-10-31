import VibranaImmersivePage from '@/src/views/VibranaImmersivePage';
import { SEO_CONFIGS } from '@/src/components/seo-configs';
import { Metadata } from 'next';
import { SITE_OG_IMAGE } from '@/src/og/site-og-image';

export const metadata: Metadata = {
  alternates: { canonical: '/immersive' },
  title: SEO_CONFIGS.immersive.title,
  description: SEO_CONFIGS.immersive.description,
  keywords: SEO_CONFIGS.immersive.keywords,
  openGraph: {
    images: [SITE_OG_IMAGE],
    title: SEO_CONFIGS.immersive.ogTitle,
    description: SEO_CONFIGS.immersive.ogDescription,
    url: SEO_CONFIGS.immersive.ogUrl,
  },
};

export default function Page() {
  return <VibranaImmersivePage />;
}
