import { siteContent } from '@/src/site-content'
// Simulator landing page, Proof section. Copy is data.
//
// The examples themselves (result, quote, source, reporter) live in
// src/lib/simulator/sector-examples.ts and were each opened on their primary source on
// 2026-10-15. This module only holds the section copy, the order of the wall and which mark
// to show for each example. Logo files and where each came from: public/logos/examples/SOURCES.md.
//
// Left off the wall on purpose: Worten (no logo file), Brisbane Catholic Education (its file is a
// white-on-dark variant that turns into a blob under the mono filter), Axel Springer and Reach plc
// (no usable logo). The "delivered at" rows are a different claim and keep their own label.

import type { SectorId } from '@/src/lib/simulator/types'

export const PROOF_CONTENT = siteContent("simulator-landing-proof-content.PROOF_CONTENT", {
  id: 'proof',
  eyebrow: 'In the wild',
  title: 'What others reported',
  subtitle: 'Public results from companies that rolled AI out widely. Pick a logo to read the number and its source.',
  hint: 'Pick a logo',
  reported: { company: 'Company-reported', vendor: 'Published by the vendor' },
  sourceLabel: (publisher: string, date: string) => `${publisher}, ${date}`,
  quoteLabel: 'In their words',
  delivered: {
    eyebrow: 'Our own work',
    title: 'Where we have delivered',
    note: 'Separate from the examples above. These are not the companies in the wall.',
  },
} as const)

export interface ProofWallLogo {
  sector: SectorId
  src: string
  /** True: drawn black in light, white in dark. False: kept in its own colors on a white chip. */
  mono: boolean
  /** Optical height in px where a mark's ink sits small in its file. Default 30. */
  height?: number
}

/** Wall order, five to a row on desktop. */
export const PROOF_WALL: readonly ProofWallLogo[] = siteContent("simulator-landing-proof-content.PROOF_WALL", [
  { sector: 'marketing-media', src: 'public-demo:logo', mono: true },
  { sector: 'insurance', src: 'public-demo:logo', mono: true },
  { sector: 'real-estate', src: 'public-demo:logo', mono: true },
  { sector: 'financial-services', src: 'public-demo:logo', mono: true },
  { sector: 'public-nonprofit', src: 'public-demo:logo', mono: true },
  { sector: 'professional-services', src: 'public-demo:logo', mono: true, height: 44 },
  { sector: 'healthcare', src: 'public-demo:logo', mono: true },
  { sector: 'software', src: 'public-demo:logo', mono: true },
  { sector: 'ecommerce-retail', src: 'public-demo:logo', mono: true, height: 40 },
  { sector: 'manufacturing-logistics', src: 'public-demo:logo', mono: false },
])

export const PROOF_WALL_COLUMNS = siteContent("simulator-landing-proof-content.PROOF_WALL_COLUMNS", 5)
