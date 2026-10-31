import { ArrowUpRight } from 'lucide-react'
import { BRIEF_DESIGN as C } from '@/src/sprint-brief-design-content'
import { relevantSprintCases, type SprintCaseStudyCard } from '@/src/lib/sprint-case-studies'
import type { SprintBrief } from '@/src/lib/sprint-brief'
import styles from './fit.module.css'
export function RelevantSprintCases({ brief, caseStudies }: { brief: SprintBrief; caseStudies: SprintCaseStudyCard[] }) {
  const studies = relevantSprintCases(brief, caseStudies)
  if (!studies.length) return null
  return <section className={styles.relatedCases} aria-labelledby="sprint-relevant-cases">
    <h2 id="sprint-relevant-cases">{C.caseStudies}</h2>
    <ul>{studies.map(study => <li key={study.slug}><a href={study.href} target="_blank" rel="noopener noreferrer">
      <img src={study.thumbnail} alt="" width={64} height={64} loading="lazy" />
      <span><strong>{study.title}</strong><span>{study.description}</span></span><ArrowUpRight size={15} aria-hidden />
    </a></li>)}</ul>
  </section>
}
