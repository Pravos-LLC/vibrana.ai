// Site-wide footer copy. Copy is data: Footer.tsx renders these strings.
import { LEGAL_ENTITY, POSTAL_ADDRESS_LINE } from '@/src/legal-entity-content'

export const FOOTER_CONTENT = {
  tagline:
    'Vibrana is a senior-led AI studio. We run 10-day AI build sprints and long-term transformation engagements, from scale-ups to multinationals.',
  entityStatement: LEGAL_ENTITY.statement,
  postalAddress: POSTAL_ADDRESS_LINE,
} as const
