import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProofMetric, ProofMetricRow } from '@/src/components/landing/ProofMetric'
import { PROOF_MIN_CELL, proofCellWidth, proofColumns, proofGridTemplate } from '@/src/components/landing/proof-metric-layout'

describe('ProofMetric width contract', () => {
  it('never lays a metric out below 160px while the container can hold one', () => {
    for (const maxColumns of [2, 3, 4]) {
      for (let width = PROOF_MIN_CELL; width <= 2400; width += 7) {
        const cell = proofCellWidth(width, maxColumns)
        expect(cell, `${maxColumns} cols at ${width}px`).toBeGreaterThanOrEqual(PROOF_MIN_CELL)
        expect(proofColumns(width, maxColumns)).toBeLessThanOrEqual(maxColumns)
      }
    }
  })

  it('drops columns before it shrinks cells: 4 at 640px+, 3 below, 1 on a 320px phone column', () => {
    expect(proofColumns(1200, 4)).toBe(4)
    expect(proofColumns(640, 4)).toBe(4)
    expect(proofColumns(639, 4)).toBe(3)
    expect(proofColumns(480, 3)).toBe(3)
    expect(proofColumns(479, 3)).toBe(2)
    expect(proofColumns(342, 3)).toBe(2)
    expect(proofColumns(319, 3)).toBe(1)
  })

  it('renders the contract into markup: min-width per cell and the capped auto-fit template', () => {
    const html = renderToStaticMarkup(
      <ProofMetricRow maxColumns={4} source="Source: synthetic fixture">
        <ProofMetric value="12" unit="weeks" label="From kickoff to handover" />
        <ProofMetric value="100+" label="People trained" />
        <ProofMetric prefix="EUR" value="35" unit="m" label="Top fine" source="Art. 99(3)" />
      </ProofMetricRow>,
    )
    expect(html.match(/data-proof-metric=""/g)).toHaveLength(3)
    expect(html.match(/min-width:160px/g)).toHaveLength(3)
    expect(html).toContain(`grid-template-columns:${proofGridTemplate(4)}`)
    expect(html).toContain('whitespace-nowrap')
    expect(html).toContain('tabular')
  })
})
