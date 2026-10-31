import type { SprintBrief } from './sprint-brief'

/** Public, published metadata only. The route provides this catalogue server-side. */
export type SprintCaseStudyCard = { slug: string; title: string; description: string; vertical: string; thumbnail: string; href: string }
export function relevantSprintCases(brief: SprintBrief, cases: SprintCaseStudyCard[]): SprintCaseStudyCard[] {
  const text = `${brief.answers.outcome} ${brief.answers.current} ${brief.answers.tools} ${brief.answers.user}`.toLowerCase()
  const relevance: Record<string, number> = {
    'insurtech-qa-knowledge-base': (brief.company.sector === 'insurance' ? 3 : 0) + (/call|quality|support|service/.test(text) ? 2 : 0),
    'european-proptech-rag': (brief.company.sector === 'real-estate' ? 3 : 0) + (/knowledge|document|research|assistant|learn|train|internal/.test(text) ? 2 : 0),
  }
  return cases.filter(study => (relevance[study.slug] || 0) > 0)
    .sort((a, b) => relevance[b.slug] - relevance[a.slug]).slice(0, 2)
}
