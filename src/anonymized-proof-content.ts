// Anonymized proof: the one place the "under NDA" wording lives. Copy is data.
//
// Pen names are not shown as brands anywhere public. An anonymized client appears as
// its descriptor ("UK insurtech scale-up") with a quiet "Anonymized" tag, so a reader
// who searches for the company understands why nothing comes up.

export const ANONYMIZED_PROOF = {
  /** Short tag, for cards and logo slots. */
  tag: 'Anonymized',
  /** Tag with the reason, for page headers. */
  tagLong: 'Anonymized · under NDA',
  /** Hover / accessible description for every tag. */
  explainer:
    'Client identity withheld under NDA. The work, the approach and the numbers are real. A reference is available privately on request.',
  /** Strip under the case study title. */
  strip:
    'The client is anonymized under NDA. The work, the approach and the numbers are real.',
  /** Note beneath the logo rows. */
  logoRowNote: 'Clients under NDA appear without a name or logo. References are available privately on request.',
} as const

/** Public descriptor for each anonymized client, keyed by case study slug. */
export const ANONYMIZED_DESCRIPTORS = {
  'insurtech-qa-knowledge-base': 'UK insurtech scale-up',
  'european-proptech-rag': 'European real-estate firm',
  'financial-services-transformation': 'UK financial-services marketing company',
  'orion-tech': 'Mid-sized tech company',
} as const
