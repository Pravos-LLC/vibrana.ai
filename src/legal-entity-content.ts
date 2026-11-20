// The legal entity behind vibrana.ai. Copy is data: the site footer, the privacy and
// terms pages, the unsubscribe page, the follow-up email footers and the Organization
// JSON-LD all read these strings, so the wording stays identical everywhere.
//
// The postal address is the Wyoming registered office (registered agent), which is
// public record. Never replace it with an operating or home address.

const NAME = 'Pravos LLC'
const DBA = 'Vibrana'
const POSTAL_ADDRESS = '30 N Gould St, Ste N, Sheridan, WY 82801, USA'

export const LEGAL_ENTITY = {
  name: NAME,
  dba: DBA,
  /** How every surface names the operator. */
  nameWithDba: `${NAME}, doing business as ${DBA}`,
  statement: `${NAME} is a Wyoming limited liability company.`,
  postalAddressLabel: 'Postal address',
  postalAddress: POSTAL_ADDRESS,
  /** Structured form of POSTAL_ADDRESS for JSON-LD. */
  postalAddressParts: {
    streetAddress: '30 N Gould St, Ste N',
    addressLocality: 'Sheridan',
    addressRegion: 'WY',
    postalCode: '82801',
    addressCountry: 'US',
  },
  contactEmail: 'hello@vibrana.ai',
} as const

/** "© 2026 Pravos LLC, doing business as Vibrana". The year is computed when called, never stored. */
export const copyrightLine = (now: Date = new Date()) => `© ${now.getFullYear()} ${LEGAL_ENTITY.nameWithDba}`

/** "Postal address: 30 N Gould St, ..." */
export const POSTAL_ADDRESS_LINE = `${LEGAL_ENTITY.postalAddressLabel}: ${LEGAL_ENTITY.postalAddress}`

/** One line for commercial email footers (CAN-SPAM needs a valid postal address). */
export const EMAIL_SENDER_LINE = `${LEGAL_ENTITY.nameWithDba}, ${LEGAL_ENTITY.postalAddress}`
