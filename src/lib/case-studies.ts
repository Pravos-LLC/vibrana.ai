// Case studies — markdown-sourced. Author each study as a markdown file in
// content/case-studies/<slug>.md (frontmatter for metadata + a markdown body for
// the narrative). This loader is SERVER-ONLY (uses fs) — import it from server
// components (the route page.tsx files), never from a 'use client' component.
//
// Files starting with "_" are ignored (reference/source material, not studies).

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface CaseStudyMetric {
  value: string
  label: string
}

export interface CaseStudy {
  slug: string
  /** false = draft: accessible only during explicitly enabled local development. */
  published: boolean
  /** Real client name, or null when the study must run anonymised. */
  client: string | null
  /** Display label used when `client` is null. */
  anonymizedName: string
  /** Path under /public to the anonymized client's mark (SVG). The frontmatter `codename` is an
   *  internal key only: it is deliberately not read here, so a pen name is never serialized to the client. */
  logo: string | null
  vertical: string
  size: string
  geography: string
  /** Tier + duration + price band. */
  engagement: string
  /** One-line outcome — the card + hero headline. */
  oneLineOutcome: string
  /**
   * Optional statement for out-of-context placements (e.g. a homepage
   * MetricProof card) where oneLineOutcome's full-page framing doesn't carry.
   * Falls back to oneLineOutcome when unset.
   */
  homepageStatement?: string
  /** Card blurb on the index. */
  summary: string
  metrics: CaseStudyMetric[]
  /** Opts this study into the hero sizzle-reel video slot above the H1. Off by
   *  default so existing published studies never grow an unfinished-looking
   *  block — set explicitly in frontmatter per study. */
  sizzleReel: boolean
  /** YouTube video id for the sizzle reel once produced. Null (with
   *  `sizzleReel: true`) renders a 16:9 placeholder in the same slot so the
   *  layout can be reviewed before the real video exists. */
  sizzleReelYouTubeId: string | null
  /** Poster frame shown in the video slot before play (the video's thumbnail).
   *  Click-to-load: the YouTube iframe only mounts once the reader presses play. */
  sizzleReelPoster: string | null
  /** Self-hosted MP4 for the sizzle reel (served from /public). Takes precedence over YouTube. */
  sizzleReelSrc: string | null
  /** Social share image (Open Graph / Twitter), ideally 1200×630. */
  ogImage: string | null
  /** ISO date (YYYY-MM-DD) the study went live. Feeds JSON-LD + the sitemap. */
  publishedAt: string | null
  /** The narrative body (markdown). */
  body: string
}

const CASE_STUDIES_DIR = path.join(process.cwd(), 'content', 'case-studies')

// gray-matter (js-yaml) turns an unquoted `2026-09-28` into a Date; accept both.
function toIsoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return null
}

function parseFile(filename: string): CaseStudy {
  const slug = filename.replace(/\.md$/, '')
  const raw = fs.readFileSync(path.join(CASE_STUDIES_DIR, filename), 'utf8')
  const { data, content } = matter(raw)
  const d = data as Partial<CaseStudy>
  return {
    slug,
    published: d.published === true,
    client: d.client ?? null,
    anonymizedName: d.anonymizedName ?? '',
    logo: d.logo ?? null,
    vertical: d.vertical ?? '',
    size: d.size ?? '',
    geography: d.geography ?? '',
    engagement: d.engagement ?? '',
    oneLineOutcome: d.oneLineOutcome ?? '',
    homepageStatement: d.homepageStatement,
    summary: d.summary ?? '',
    metrics: (d.metrics ?? []) as CaseStudyMetric[],
    sizzleReel: d.sizzleReel ?? false,
    sizzleReelYouTubeId: d.sizzleReelYouTubeId ?? null,
    sizzleReelPoster: d.sizzleReelPoster ?? null,
    sizzleReelSrc: d.sizzleReelSrc ?? null,
    ogImage: d.ogImage ?? null,
    publishedAt: toIsoDate(data.publishedAt),
    body: content.trim(),
  }
}

export function getAllCaseStudies(): CaseStudy[] {
  if (!fs.existsSync(CASE_STUDIES_DIR)) return []
  return fs
    .readdirSync(CASE_STUDIES_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map(parseFile)
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

export function getPublishedCaseStudies(): CaseStudy[] {
  return getAllCaseStudies().filter((cs) => cs.published)
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return getAllCaseStudies().find((cs) => cs.slug === slug)
}

/** Draft review is an explicit local-development affordance. An unauthenticated
 *  preview is public too, so no Vercel deployment may opt into draft content. */
export function draftsVisible(): boolean {
  return process.env.NODE_ENV === 'development'
    && process.env.VIBRANA_CASE_STUDY_DRAFTS === '1'
    && !process.env.VERCEL
    && !process.env.VERCEL_ENV
}

/** The studies that get a page in this environment. */
export function getRoutableCaseStudies(): CaseStudy[] {
  return draftsVisible() ? getAllCaseStudies() : getPublishedCaseStudies()
}

/** Display name for a study — the cleared client name, else the generic anonymized
 *  descriptor. The pen-name codename is never a public headline or logo: searching it
 *  finds nothing, which reads as invented. */
export function caseStudyName(cs: Pick<CaseStudy, 'client' | 'anonymizedName'>): string {
  return cs.client ?? cs.anonymizedName
}

/** True when the client is not named publicly. */
export function isAnonymized(cs: Pick<CaseStudy, 'client'>): boolean {
  return cs.client === null
}

// Static hero copy for the index (not per-study).
export const CASE_STUDIES_HERO = {
  eyebrow: 'Case studies',
  titleLead: 'Proof,',
  titleAccent: 'not promises.',
  subtitle:
    'Explore AI transformation case studies with the scope, workflows, learning, and governance from real engagements. Each account shows the work delivered, outcomes we can document, and what the team could operate afterward.',
  emptyState:
    'Detailed case studies are being prepared with our clients. In the meantime, take the assessment to see where your organization stands.',
}
