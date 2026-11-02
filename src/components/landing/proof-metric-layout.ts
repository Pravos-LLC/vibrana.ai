/**
 * The ProofMetric width contract, as pure math the component and its test share.
 *
 * A metric cell is never narrower than `PROOF_MIN_CELL` (160px). The row is an auto-fit grid
 * capped at `maxColumns`: when the container cannot hold N cells at the minimum, it drops to
 * N-1 columns before any text shrinks. The CSS template below encodes exactly `proofColumns`.
 */
export const PROOF_MIN_CELL = 160

/** CSS grid template: at most `maxColumns`, each column at least `min` wide. Gap is 0 (hairlines are shadows). */
export function proofGridTemplate(maxColumns: number, min: number = PROOF_MIN_CELL): string {
  return `repeat(auto-fit, minmax(max(${min}px, calc(100% / ${maxColumns})), 1fr))`
}

/** How many columns the template above yields for a container width. Mirrors the CSS auto-fit math. */
export function proofColumns(containerWidth: number, maxColumns: number, min: number = PROOF_MIN_CELL): number {
  if (containerWidth <= 0) return 1
  const track = Math.max(min, containerWidth / maxColumns)
  return Math.max(1, Math.min(maxColumns, Math.floor(containerWidth / track)))
}

/**
 * Rendered cell width for a container. Never below `min` unless the container itself is narrower
 * (then one full-width cell), which is the only case a stat stacks.
 */
export function proofCellWidth(containerWidth: number, maxColumns: number, min: number = PROOF_MIN_CELL): number {
  return containerWidth / proofColumns(containerWidth, maxColumns, min)
}
