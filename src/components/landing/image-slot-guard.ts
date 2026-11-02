/**
 * ImageSlot guard: a page-level check that every image and video slot on a rendered page holds
 * its own asset, and that no slot ships a public placeholder.
 *
 * It reads server-rendered HTML (react-dom/server `renderToStaticMarkup`), so it runs in the node
 * test environment with no browser. Three rules:
 *
 *   1. duplicate    the same asset URL appears in two or more media elements on one page
 *   2. placeholder  a known public placeholder (`PLACEHOLDER_SOURCES`) is rendered
 *   3. public-demo  a `public-demo:*` stand-in source is rendered
 *
 * `PublicDemoImage` renders `public-demo:*` sources as text spans, so they never reach the HTML.
 * Tests that guard a page mock that module (and `next/image`) with `imageSlotProbe`, which renders
 * every source as a plain `<img>`, so rule 3 can see them. See tests/landing/image-slots.test.tsx.
 *
 * What counts as a slot: `<img src|srcset>`, `<source src|srcset>`, `<video src|poster>`. CSS
 * `background-image` is not read; components use it only to echo an asset already in the same slot
 * (ReelStage's blurred backdrop, film-strip thumbnails), which is one slot, not a second one.
 * Not seen either: media rendered only on the client (`dynamic(..., { ssr: false })`, effects) and
 * media behind a Suspense boundary that has not resolved during the static render.
 */

export const PLACEHOLDER_SOURCES: readonly string[] = ['/assets/imagery/homepage/prism-grid-solar.webp']
export const PUBLIC_DEMO_PREFIX = 'public-demo:'

/**
 * Site chrome that legitimately repeats on every page (the logo mark in the nav and the footer).
 * Exempt from the duplicate rule by default; pass `allowDuplicates` to replace the list.
 */
export const SITE_CHROME_SOURCES: readonly string[] = ['/assets/vibrana-v-prism-96.webp']

export type ImageSlotRule = 'duplicate' | 'placeholder' | 'public-demo'

export interface MediaSource {
  /** Normalized asset URL (next/image optimizer URLs are unwrapped to the original path). */
  src: string
  tag: 'img' | 'source' | 'video'
  attr: 'src' | 'srcset' | 'poster'
  /** Index of the element in document order, so one element listing a URL twice is not a duplicate. */
  element: number
}

export interface ImageSlotViolation {
  rule: ImageSlotRule
  src: string
  /** How many media elements use the source. Part of the allowlist key, so growth fails. */
  count: number
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

/** Unwrap `/_next/image?url=%2Fa.webp&w=640&q=75` to `/a.webp`; leave everything else as written. */
export function normalizeMediaSrc(raw: string): string {
  const src = decode(raw.trim())
  const m = src.match(/^\/_next\/image\?(.*)$/)
  if (m) {
    const url = new URLSearchParams(m[1]).get('url')
    if (url) return url
  }
  return src
}

const ATTRS: Record<MediaSource['tag'], MediaSource['attr'][]> = {
  img: ['src', 'srcset'],
  source: ['src', 'srcset'],
  video: ['src', 'poster'],
}

/** Every media source in document order. `srcset` candidates are split and their descriptors dropped. */
export function collectMediaSources(html: string): MediaSource[] {
  const out: MediaSource[] = []
  const tagRe = /<(img|source|video)\b([^>]*)>/gi
  let element = 0
  for (const match of html.matchAll(tagRe)) {
    const tag = match[1].toLowerCase() as MediaSource['tag']
    const attrs = match[2]
    for (const attr of ATTRS[tag]) {
      const am = attrs.match(new RegExp(`\\s${attr}="([^"]*)"`, 'i'))
      if (!am || !am[1]) continue
      const values = attr === 'srcset' ? am[1].split(/,\s+/).map((c) => c.trim().split(/\s+/)[0]) : [am[1]]
      for (const v of values) if (v) out.push({ src: normalizeMediaSrc(v), tag, attr, element })
    }
    element++
  }
  return out
}

export interface ImageSlotOptions {
  /** Sources exempt from the duplicate rule. Defaults to `SITE_CHROME_SOURCES`. */
  allowDuplicates?: readonly string[]
}

/** All rule violations on one rendered page, deduplicated and sorted for stable snapshots. */
export function findImageSlotViolations(html: string, opts: ImageSlotOptions = {}): ImageSlotViolation[] {
  const sources = collectMediaSources(html)
  const elementsBySrc = new Map<string, Set<number>>()
  for (const s of sources) {
    const set = elementsBySrc.get(s.src) ?? new Set<number>()
    set.add(s.element)
    elementsBySrc.set(s.src, set)
  }
  const out: ImageSlotViolation[] = []
  for (const [src, els] of elementsBySrc) {
    if (src.startsWith(PUBLIC_DEMO_PREFIX)) out.push({ rule: 'public-demo', src, count: els.size })
    if (PLACEHOLDER_SOURCES.includes(src)) out.push({ rule: 'placeholder', src, count: els.size })
    if (els.size > 1 && !(opts.allowDuplicates ?? SITE_CHROME_SOURCES).includes(src)) out.push({ rule: 'duplicate', src, count: els.size })
  }
  return out.sort((a, b) => (a.rule + a.src).localeCompare(b.rule + b.src))
}

/**
 * Stable string key for a violation, used by allowlists: `duplicate /a.webp x2`. The slot count is
 * part of the key, so an allowlisted page that adds one more duplicate or placeholder slot fails.
 */
export const violationKey = (v: Pick<ImageSlotViolation, 'rule' | 'src' | 'count'>) => `${v.rule} ${v.src} x${v.count}`

export interface ImageSlotReport {
  /** Violations not on the allowlist. A guarded page must have none. */
  unexpected: ImageSlotViolation[]
  /** Allowlist entries the page no longer violates. Remove them so the list stays true. */
  stale: string[]
}

/**
 * Compare a page against its allowlist of known violations. Wave 2 pages start with an empty
 * allowlist; existing pages carry their current violations until their rebuild removes them.
 */
export function checkImageSlots(html: string, knownViolations: readonly string[] = [], opts: ImageSlotOptions = {}): ImageSlotReport {
  const found = findImageSlotViolations(html, opts)
  const keys = new Set(found.map(violationKey))
  return {
    unexpected: found.filter((v) => !knownViolations.includes(violationKey(v))),
    stale: knownViolations.filter((k) => !keys.has(k)),
  }
}

/** Throw with a readable list when a page breaks the image-slot rules. */
export function assertImageSlots(html: string, knownViolations: readonly string[] = [], opts: ImageSlotOptions = {}): void {
  const { unexpected, stale } = checkImageSlots(html, knownViolations, opts)
  const lines = [
    ...unexpected.map((v) => `  ${violationKey(v)}`),
    ...stale.map((k) => `  stale allowlist entry: ${k}`),
  ]
  if (lines.length) throw new Error(`Image slot guard failed:\n${lines.join('\n')}`)
}
