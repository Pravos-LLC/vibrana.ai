import { OG_SITE } from '@/src/og-content'

/**
 * The site-wide share card (app/opengraph-image.tsx), for pages that set their own
 * `openGraph`. Next replaces a parent's `openGraph` wholesale when a page defines
 * one, so the root file-based image is lost unless the page lists it explicitly.
 * Resolved against `metadataBase` in app/layout.tsx.
 */
export const SITE_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: OG_SITE.alt,
} as const
