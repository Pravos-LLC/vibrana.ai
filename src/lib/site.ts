// The one production origin. vibrana.ai (apex) redirects here, so canonicals,
// the sitemap, robots.txt, Open Graph URLs and JSON-LD must all use www — a
// canonical that points at a redirect is a mixed signal to search engines.
export const SITE_URL = 'https://www.vibrana.ai'

export const SITE_NAME = 'Vibrana'

/** Absolute URL for a site path ("/about" -> "https://www.vibrana.ai/about"). */
export function absoluteUrl(path = '/'): string {
  return path === '/' || path === '' ? SITE_URL : `${SITE_URL}${path}`
}

/** Organization node, referenced by @id from page-level JSON-LD. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`

export const ORGANIZATION_JSON_LD = {
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/vibrana-v-prism.png`,
  founder: { '@type': 'Person', name: 'John Ellison', url: 'https://john-ellison.com' },
}
