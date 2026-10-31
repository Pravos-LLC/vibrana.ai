import { MetadataRoute } from 'next';
import { getPublishedCaseStudies } from '@/src/lib/case-studies';
import { absoluteUrl } from '@/src/lib/site';
import { LEARN_ROLES, learnRoleHref } from '@/src/learn-role-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/ai-build-sprint',
    '/ai-build-sprint/roi',
    '/ai-transformation',
    '/ai-readiness',
    '/eu-ai-act-readiness',
    '/executive-ai-transformation',
    '/learn',
    '/about',
    '/case-studies',
    '/contact',
    '/immersive',
    '/swag',
  ];

  // No lastModified on static routes: stamping every URL with the build time on
  // each deploy teaches crawlers to ignore the field. Case studies carry a real date.
  return [
    ...routes.map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1.0 : route === '/ai-transformation' || route === '/contact' ? 0.9 : 0.8,
    })),
    ...LEARN_ROLES.map((r) => ({
      url: absoluteUrl(learnRoleHref(r.name)),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...getPublishedCaseStudies().map((cs) => ({
      url: absoluteUrl(`/case-studies/${cs.slug}`),
      ...(cs.publishedAt && { lastModified: cs.publishedAt }),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
