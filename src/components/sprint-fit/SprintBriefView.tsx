import { BRIEF_CONTENT } from '@/src/sprint-brief-content'
import { SPRINT_FLOW as C } from '@/src/sprint-fit-content'
import type { SprintBrief } from '@/src/lib/sprint-brief'
import styles from './fit.module.css'

const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
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
      <div className={styles.companyIdentity}>{brief.company.logoUrl ? <img className={styles.companyLogo} src={brief.company.logoUrl} alt="" onError={e => { e.currentTarget.hidden = true }} /> : null}<div><h2>{brief.company.name}</h2>{brief.company.website ? <a href={brief.company.website} target="_blank" rel="noopener noreferrer">{brief.company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a> : null}</div></div>
      <span className={styles.documentLabel}>{C.created}</span>
    </header>
    <section className={styles.narrative}>{brief.narrative.summary ? <><h3>{C.companyContext}</h3><p>{brief.narrative.summary}</p></> : null}<h3>{C.proposedScope}</h3><p className={styles.proposal}>{brief.narrative.proposal}</p></section>
    <ol className={styles.scopeDiagram}>{[brief.scope.user, brief.scope.task, brief.scope.firstRelease, brief.scope.successMeasure].map((value, i) => <li key={C.scopeLabels[i]}><span>{C.scopeLabels[i]}</span><p>{value}</p></li>)}</ol>
    {stats.length ? <section className={styles.documentSection}><h3>{C.businessCase}</h3><dl className={styles.stats}>{stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className={styles.caption}>{BRIEF_CONTENT.capacityNote}</p></section> : null}
    {brief.benchmark ? <section className={styles.evidence}><span className={styles.kicker}>{C.example}</span><h3>{brief.benchmark.company}</h3><p className={styles.caption}>{brief.benchmark.descriptor}</p><p>{brief.benchmark.result}</p><a href={brief.benchmark.url} target="_blank" rel="noopener noreferrer">{C.source}: {brief.benchmark.publisher} · {brief.benchmark.date}<span aria-hidden> ↗</span></a><p className={styles.caption}>{C.reported} {brief.benchmark.publisher}</p><p className={styles.caption}>{BRIEF_CONTENT.publicSourceNote}</p></section> : null}
    {brief.narrative.assumptions.length ? <section className={styles.documentSection}><h3>{C.assumptions}</h3><ul>{brief.narrative.assumptions.map(x => <li key={x}>{x}</li>)}</ul></section> : null}
    <section className={styles.documentSection}><h3>{C.preparation}</h3><ul>{brief.preparation.map(x => <li key={x}>{x}</li>)}</ul></section>
  </article>
}
