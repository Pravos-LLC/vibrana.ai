import { FIT, SPRINT_FLOW } from '@/src/sprint-fit-content'
import { evaluateFit, fitRows, selectedFitMetrics, type FitAnswers, type FitMetric } from '@/src/lib/sprint-fit'
import styles from './fit.module.css'
import revision from './survey-revision.module.css'
import { useId } from 'react'

type Change = (key: keyof FitAnswers, value: string | boolean | FitMetric[]) => void
export function Choices({ options, value, onChange, label }: { options: readonly { value: string; label: string; detail?: string }[]; value: string; onChange: (v: string) => void; label?: string }) {
  const name = useId()
  return <div className={styles.choices} role="radiogroup" aria-label={label}>{options.map(o => <label key={o.value} className={`${styles.choice} ${o.value === value ? styles.chosen : ''}`}><input type="radio" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} /><span>{o.label}</span><i aria-hidden>{o.value === value ? '✓' : ''}</i></label>)}</div>
}
export function MetricChoices({ value, onChange, label }: { value: FitMetric[]; onChange: (v: FitMetric[]) => void; label?: string }) {
  return <div className={styles.choices} role="group" aria-label={label}>{FIT.metrics.map(o => {
    const key = o.value as FitMetric
    const selected = value.includes(key)
    return <label key={key} className={`${styles.choice} ${revision.multichoice} ${selected ? styles.chosen : ''}`}><input type="checkbox" value={key} checked={selected} onChange={() => onChange(selected ? value.filter(v => v !== key) : [...value, key])} /><span>{o.label}</span><i aria-hidden>{selected ? '✓' : ''}</i></label>
  })}</div>
}
function Select({ name, value, options, change }: { name: 'access' | 'owner' | 'participation' | 'review'; value: string; options: readonly { value: string; label: string }[]; change: Change }) {
  return <label className={styles.field}>{FIT.labels[name]}<select className={!value ? revision.unselected : undefined} value={value} onChange={e => change(name, e.target.value)}><option value="" disabled>{FIT.select}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
}
export function FitQuestion({ step, answers: a, onChange }: { step: number; answers: FitAnswers; onChange: Change }) {
  const input = (name: 'user' | 'outcome' | 'tools' | 'baseline' | 'target') => <label className={styles.field}>{FIT.labels[name]}<input value={a[name]} onChange={e => onChange(name, e.target.value)} maxLength={1200} placeholder={FIT.placeholders[name]} /></label>
  return <div className={styles.questionBody}>
    {step === 0 ? <Choices label={FIT.steps[0].title} options={FIT.starting} value={a.startingPoint} onChange={v => onChange('startingPoint', v)} /> : null}
    {step === 1 ? <><label className={styles.field}>{FIT.labels.outcome}<textarea value={a.outcome} onChange={e => onChange('outcome', e.target.value)} maxLength={1200} rows={3} placeholder={FIT.placeholders.outcome} /></label>{input('user')}</> : null}
    {step === 2 ? <><label className={styles.field}>{FIT.labels.current}<textarea value={a.current} onChange={e => onChange('current', e.target.value)} maxLength={1200} rows={3} placeholder={FIT.placeholders.current} /></label>{input('tools')}</> : null}
    {step === 3 ? <><MetricChoices value={selectedFitMetrics(a)} onChange={v => onChange('metrics', v)} />{input('baseline')}{input('target')}</> : null}
    {step === 4 ? <><Select name="access" value={a.access} options={FIT.access} change={onChange} /><Select name="owner" value={a.owner} options={FIT.owner} change={onChange} /><Select name="participation" value={a.participation} options={FIT.participation} change={onChange} /><Select name="review" value={a.review} options={FIT.review} change={onChange} /></> : null}
    {step === 5 ? <Choices options={FIT.timing} value={a.timing} onChange={v => onChange('timing', v)} /> : null}
    {step === 6 ? <Choices options={FIT.funding} value={a.funding} onChange={v => onChange('funding', v)} /> : null}
  </div>
}
export function answeredFitRows(answers: FitAnswers): [string, string][] {
  const keys = Object.keys(FIT.rows) as (keyof typeof FIT.rows)[]
  return fitRows(answers).filter((_, i) => keys[i] === 'metric' ? selectedFitMetrics(answers).length > 0 || answers.metric === 'unknown' : Boolean(answers[keys[i] as keyof FitAnswers]))
}
export function FitBrief({ answers, compact = false }: { answers: FitAnswers; compact?: boolean }) {
  const result = evaluateFit(answers)
  const rows = answeredFitRows(answers)
  return <div className={styles.brief}>
    <h2>{SPRINT_FLOW.summary}</h2>
    <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    {!compact ? <div className={styles.preparation}><h3>{FIT.routes[result.route]}</h3><ul>{result.actions.map(x => <li key={x}>{x}</li>)}</ul></div> : null}
  </div>
}
