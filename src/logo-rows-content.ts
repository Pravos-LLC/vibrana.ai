import { siteContent } from '@/src/site-content'
// Proof rows: the logos under the home and AI Build Sprint heroes. Copy is data.
//
// "Our clients" are Vibrana clients. Optimise Media and Pikl appear under their real
// names and official logos (delivered, paying clients; naming approved by John
// 2026-09-26). The other four are anonymized under NDA: they appear as a redacted slot
// with a descriptor, never as an invented brand (a reader who searches a pen name
// finds nothing and concludes we made it up).
// "Where our team has delivered" are places our people worked before or alongside
// Vibrana. Those are NOT Vibrana clients, and the label must say so. AstraZeneca sits
// here: John delivered that work personally, and no case study will be published.

import { ANONYMIZED_DESCRIPTORS, ANONYMIZED_PROOF } from '@/src/anonymized-proof-content'

export interface ProofLogo {
  name: string
  /** Path under /public. Empty for an anonymized client, which has no mark. */
  src: string
  /** Set for a client under NDA: shown as a redacted slot with this descriptor. */
  anonymized?: string
  /**
   * Rendered height in px, when the mark needs optical correction to sit at the
   * same visual weight as its neighbours. The SVGs are cropped to their ink, so this is the
   * height of the visible mark.
   */
  height: number
}

export const CLIENT_LOGOS: readonly ProofLogo[] = siteContent("logo-rows-content.CLIENT_LOGOS", [
  // Both official marks are full-height (ring / jar) with a large x-height, so they
  // render shorter than the 28px default to match the codename marks' visual weight.
  { name: 'Optimise Media', src: 'public-demo:logo', height: 20 },
  { name: 'Pikl', src: 'public-demo:logo', height: 21 },
  // One chip for every client under NDA, so the real logos lead and the row never reads as empty slots.
  { name: 'Clients under NDA', src: '', anonymized: `+ ${Object.keys(ANONYMIZED_DESCRIPTORS).length} more under NDA`, height: 17 },
])

export const DELIVERED_LOGOS: readonly ProofLogo[] = siteContent("logo-rows-content.DELIVERED_LOGOS", [
  { name: 'Google', src: 'public-demo:logo', height: 27 },
  { name: 'Snapchat', src: 'public-demo:logo', height: 21 },
  { name: 'WEF', src: 'public-demo:logo', height: 28 },
  { name: 'Microsoft', src: 'public-demo:logo', height: 26 },
  { name: 'OpenGov', src: 'public-demo:logo', height: 28 },
  { name: 'AstraZeneca', src: 'public-demo:logo', height: 15 },
])

/** The one proof row: our clients first, then where our team has delivered. */
export const PROOF_LOGOS: readonly ProofLogo[] = siteContent("logo-rows-content.PROOF_LOGOS", [...CLIENT_LOGOS, ...DELIVERED_LOGOS])

export const LOGO_ROW_LABELS = siteContent("logo-rows-content.LOGO_ROW_LABELS", {
  combined: 'Clients & where our team has delivered',
  clients: 'Our clients',
  /** Shown under the clients row. */
  clientsNote: ANONYMIZED_PROOF.logoRowNote,
  delivered: 'Where our team has delivered',
} as const)
