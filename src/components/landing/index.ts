/**
 * Landing kit: shared components for the offer landing pages (Wave 1 of the landing-page rebuild).
 * Usage notes and rules: ./README.md. Live gallery: /prism/landing-kit.
 */
export { ReelStage, type ReelClip, type ReelStageProps } from './ReelStage'
export { DeliverablePreview, type DeliverablePreviewProps, type PreviewBeat, type PreviewCallout } from './DeliverablePreview'
export { ProofMetric, ProofMetricRow, type ProofMetricProps, type ProofMetricRowProps } from './ProofMetric'
export { PROOF_MIN_CELL, proofColumns, proofCellWidth, proofGridTemplate } from './proof-metric-layout'
export { DistinctProductFrame, ProductToggle, type DistinctProductFrameProps, type FrameChrome, type ProductToggleItem, type ProductToggleProps } from './DistinctProductFrame'
export { ProblemSequence, type ProblemLine, type ProblemSequenceProps } from './ProblemSequence'
export { ChapterRail, type Chapter, type ChapterRailProps } from './ChapterRail'
export { GateCard, type GateCardProps } from './GateCard'
export { ACCENTS, PRISM_STROKE, EASE_OUT, EASE_IN_OUT, DUR, type Accent } from './tokens'
export {
  assertImageSlots,
  checkImageSlots,
  collectMediaSources,
  findImageSlotViolations,
  normalizeMediaSrc,
  violationKey,
  PLACEHOLDER_SOURCES,
  PUBLIC_DEMO_PREFIX,
  SITE_CHROME_SOURCES,
  type ImageSlotViolation,
  type ImageSlotReport,
} from './image-slot-guard'
