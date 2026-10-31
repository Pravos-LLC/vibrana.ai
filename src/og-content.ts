// Open Graph / Twitter share-card copy. Copy is data (DESIGN.md § Page copy is data).
//
// Both headlines reuse the persona-reviewed AI Build Sprint hero line
// (SPRINT_HERO in src/ai-build-sprint-content.ts). The site-wide card drops the
// "in 10 days" tail so it stays short and legible at thumbnail size.

import { SPRINT_HERO } from '@/src/ai-build-sprint-content'

export interface OgCardCopy {
  /** Small label above the headline. Omit for the site-wide card. */
  eyebrow?: string
  headline: {
    lead: string
    /** The one Playfair italic gradient word. */
    accent: string
    trail: string
  }
  /** Image alt text (og:image:alt / twitter:image:alt). */
  alt: string
}

/** Join the last `n` words with non-breaking spaces so they wrap as one unit
 *  (keeps "in 10 days." together instead of orphaning "days."). */
function keepTogether(text: string, n: number) {
  const words = text.split(' ')
  return [...words.slice(0, -n), words.slice(-n).join('\u00a0')].join(' ')
}

export const OG_BRAND = {
  wordmark: 'VIBRANA',
  url: 'vibrana.ai',
} as const

export const OG_SITE: OgCardCopy = {
  headline: {
    lead: SPRINT_HERO.headline.lead,
    accent: SPRINT_HERO.headline.accent,
    trail: `${SPRINT_HERO.headline.trail} with your team.`,
  },
  alt: 'Vibrana: We build working AI with your team.',
}

export const OG_SPRINT: OgCardCopy = {
  eyebrow: SPRINT_HERO.eyebrow,
  headline: {
    lead: SPRINT_HERO.headline.lead,
    accent: SPRINT_HERO.headline.accent,
    trail: `${SPRINT_HERO.headline.trail} ${keepTogether(SPRINT_HERO.headline.second, 3)}`,
  },
  alt: 'Vibrana AI Build Sprint: We build working AI with your team in 10 days.',
}
