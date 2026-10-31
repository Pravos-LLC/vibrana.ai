import { UsersRound, Layers2, Flag, ChartNoAxesCombined, ArrowUpRight } from 'lucide-react'
import { BRIEF_EXPORT } from '@/src/sprint-brief-export-content'
import { BRIEF_CONTENT } from '@/src/sprint-brief-content'
import { BRIEF_DESIGN as D } from '@/src/sprint-brief-design-content'
import { SPRINT_FLOW as C } from '@/src/sprint-fit-content'
import type { SprintBrief } from '@/src/lib/sprint-brief'
import { briefDate } from '@/src/lib/sprint-brief-export'
import styles from './fit.module.css'

const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
const scopeIcons = [UsersRound, Layers2, Flag, ChartNoAxesCombined]
export function SprintBriefView({ brief }: { brief: SprintBrief }) {
  const calc = brief.calculation
  const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: calc.inputs.currency, maximumFractionDigits: 0 }).format(value)
  const stats: [string, string][] = []
  if (calc.currentHours !== null) stats.push([C.currentHours, number(calc.currentHours)])
  if (calc.targetHours !== null) stats.push([C.targetHours, number(calc.targetHours)])
  if (calc.releasedHours !== null) stats.push([calc.releasedHours < 0 ? C.additionalHours : C.releasedHours, number(Math.abs(calc.releasedHours))])
  if (calc.currentCost !== null) stats.push([C.currentCost, money(calc.currentCost)])
  if (calc.capacityValue !== null) stats.push([calc.capacityValue < 0 ? C.additionalCost : C.capacityValue, money(Math.abs(calc.capacityValue))])
  if (calc.inputs.softwareCostMonthly !== null) stats.push([C.softwareCost, money(calc.inputs.softwareCostMonthly)])
  return <article className={styles.document}>
    <header className={styles.documentHeader}>
      <div className={styles.documentMeta}><span>{D.prepared} {briefDate(brief.createdAt)}</span><span className={styles.briefMark} aria-hidden><i /><i /><i /></span></div>
      <div className={styles.companyIdentity}>{brief.company.logoUrl ? <img className={styles.companyLogo} src={brief.company.logoUrl} alt="" onError={e => { e.currentTarget.hidden = true }} /> : null}<div><h2>{brief.company.name}</h2>{brief.company.website ? <a href={brief.company.website} target="_blank" rel="noopener noreferrer">{brief.company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}<ArrowUpRight size={13} aria-hidden /></a> : null}</div></div>
      {brief.company.projectName ? <p className={styles.caption}>{BRIEF_EXPORT.project}: {brief.company.projectName}</p> : null}
      {brief.narrative.summary ? <p className={styles.contextSummary}>{brief.narrative.summary}</p> : null}
    </header>
    <section className={styles.narrative}><div className={styles.sectionEyebrow}><span>01</span><h3>{C.proposedScope}</h3></div><p className={styles.proposal}>{brief.narrative.proposal}</p></section>
    <ol className={styles.scopeDiagram}>{[brief.scope.user, brief.scope.task, brief.scope.firstRelease, brief.scope.successMeasure].map((value, i) => {
      const Icon = scopeIcons[i]
      return <li key={D.scopeLabels[i]}><div className={styles.scopeLabel}><Icon size={19} strokeWidth={1.65} aria-hidden /><span>{D.scopeLabels[i]}</span></div><p>{value}</p></li>
    })}</ol>
    {stats.length ? <section className={styles.documentSection}><div className={styles.sectionEyebrow}><span>02</span><h3>{C.businessCase}</h3></div><dl className={styles.stats}>{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className={styles.caption}>{BRIEF_CONTENT.capacityNote}</p></section> : null}
    {brief.benchmark ? <section className={styles.evidence}><span className={styles.kicker}>{C.example}</span><h3>{brief.benchmark.company}</h3><p className={styles.evidenceDescriptor}>{brief.benchmark.descriptor}</p><p>{brief.benchmark.result}</p><a href={brief.benchmark.url} target="_blank" rel="noopener noreferrer">{C.source}: {brief.benchmark.publisher} · {brief.benchmark.date}<ArrowUpRight size={14} aria-hidden /></a><p className={styles.caption}>{brief.benchmark.reportedBy === 'company' ? BRIEF_EXPORT.companyReported : BRIEF_EXPORT.vendorReported}. {BRIEF_CONTENT.publicSourceNote}</p></section> : null}
    <section className={styles.documentSection}><h3 className={styles.sectionHeading}>{BRIEF_EXPORT.nextSteps}</h3><p>{BRIEF_EXPORT.roadmapNote}</p></section>
    {brief.narrative.assumptions.length ? <section className={styles.documentSection}><h3 className={styles.sectionHeading}>{C.assumptions}</h3><ul className={styles.actionList}>{brief.narrative.assumptions.map(x => <li key={x}><span className={styles.actionDot} aria-hidden /><span>{x}</span></li>)}</ul></section> : null}
    <section className={styles.documentSection}><h3 className={styles.sectionHeading}>{C.preparation}</h3><ul className={styles.actionList}>{brief.preparation.map(x => <li key={x}><span className={styles.actionCheckbox} aria-hidden /><span>{x}</span></li>)}</ul></section>
  </article>
}
