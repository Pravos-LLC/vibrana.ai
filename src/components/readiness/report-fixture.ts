// Synthetic answers for the sample report on /ai-readiness. "Sample Company" is fictional and these
// scores are fixtures, not claims: chosen so two areas are clearly lowest, and never quoted in copy.
// Everything derived from them (overall score, the two lowest areas, their research and case, the
// workflow hours) comes from the same functions the real report uses.
import { ORG_DIMENSIONS, calculateOverallScore } from '@/src/lib/assessment/scoring'
import { evidenceForDimension, lowestDimensions } from '@/src/lib/assessment/evidence'
import { workflowSection } from '@/lib/assessment/workflow-render'
import type { DimensionScore } from '@/src/types/assessment'
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows'

const FIXTURE_SCORES: Record<string, number> = {
  'Leadership & Strategy': 64,
  'Data Readiness': 38,
  'Technology Infrastructure': 57,
  'Talent & Capability': 31,
  'Governance & Responsible AI': 52,
  'Culture & Change Readiness': 60,
}

export const SAMPLE_DIMENSIONS: DimensionScore[] = ORG_DIMENSIONS.map(({ dimension, weight }) => ({
  dimension,
  score: FIXTURE_SCORES[dimension],
  weight,
}))

export const SAMPLE_OVERALL = calculateOverallScore(SAMPLE_DIMENSIONS)

export const SAMPLE_LOWEST = lowestDimensions(SAMPLE_DIMENSIONS).map((d) => d.dimension)

/** One workflow named on the sample: six people answering support questions five hours a week. */
export const SAMPLE_WORKFLOWS: AssessmentWorkflows = {
  currency: 'USD',
  items: [{ id: 'support', people: 6, hoursPerWeek: 5, hourlyCost: null }],
}

/** The cover date, fixed so server and client render the same text. */
export const SAMPLE_DATE = 'November 2, 2026'

export interface SampleReport {
  date: string
  overall: number
  dimensions: { dimension: string; score: number; weight: number; lowest: boolean }[]
  lowest: {
    dimension: string
    score: number
    finding: { claim: string; method: string; sourceLabel: string; url: string } | null
    caseFact: { label: string; fact: string; href: string } | null
  }[]
  workflow: { name: string; hours: string } | null
}

/**
 * The sample report as plain data, built on the server (app/ai-readiness/page.tsx) so the scoring,
 * evidence and workflow modules never ship to the browser for a preview.
 */
export function buildSampleReport(): SampleReport {
  const lowest = new Set(SAMPLE_LOWEST)
  const section = workflowSection(SAMPLE_WORKFLOWS)
  return {
    date: SAMPLE_DATE,
    overall: SAMPLE_OVERALL,
    dimensions: SAMPLE_DIMENSIONS.map((d) => ({ ...d, lowest: lowest.has(d.dimension) })),
    lowest: lowestDimensions(SAMPLE_DIMENSIONS).map((d) => {
      const e = evidenceForDimension(d.dimension)
      const f = e?.findings[0]
      return {
        dimension: d.dimension,
        score: d.score,
        finding: f ? { claim: f.claim, method: f.method, sourceLabel: f.sourceLabel, url: f.url } : null,
        caseFact: e?.caseFact ?? null,
      }
    }),
    workflow: section?.rows[0] ? { name: section.rows[0].name, hours: section.rows[0].hours } : null,
  }
}
