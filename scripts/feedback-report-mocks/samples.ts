// Sample reports for the feedback thank-you screen mockups (scripts/feedback-report-mocks/capture.mjs).
// Built with the site's own scoring code from fictional answers. Northwind Logistics is the shared
// demo company (scripts/eu-ai-act-report/northwind.ts); never a real client.
import { writeFileSync } from 'node:fs'
import { ASSESSMENT_QUESTIONS } from '@/src/assessment-questions-content'
import {
  calculateAxisScores,
  calculateOrgDimensionScores,
  calculateOverallScore,
  determineArchetype,
  generateRecommendations,
  getReadinessLevel,
  identifyBlockers,
} from '@/src/lib/assessment/scoring'
import { NORTHWIND_AS_OF, NORTHWIND_COMPANY, northwindProfile } from '@/scripts/eu-ai-act-report/northwind'

// A mid-way organization: alternate between the second-highest and the middle option on every question.
const answers: Record<string, number> = {}
Object.values(ASSESSMENT_QUESTIONS).flat().forEach((q, i) => {
  const scores = q.options.map((o) => o.score).sort((a, b) => a - b)
  answers[q.id] = scores[Math.max(0, scores.length - (i % 3 === 0 ? 3 : 2))]
})
const dimensionScores = calculateOrgDimensionScores(answers)
const overallScore = calculateOverallScore(dimensionScores)
const axisScores = calculateAxisScores(dimensionScores)
const readinessReport = {
  overallScore,
  readiness: getReadinessLevel(overallScore),
  dimensionScores,
  blockers: identifyBlockers(dimensionScores),
  recommendations: generateRecommendations(overallScore, dimensionScores, answers, null),
  archetype: determineArchetype(axisScores),
  axisScores,
  companyData: { name: NORTHWIND_COMPANY.name, website: 'northwind-logistics.example', linkedin: '', email: NORTHWIND_COMPANY.email },
  companyInsights: null,
  workflows: null,
  analysis: null,
  _storedAt: Date.now(),
}
const euReport = { profile: northwindProfile(), company: NORTHWIND_COMPANY, storedAt: Date.now() }
writeFileSync(process.argv[2], JSON.stringify({ readinessReport, euReport, asOf: NORTHWIND_AS_OF.toISOString() }))
