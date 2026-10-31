'use client'

import { useId, useMemo, useState } from 'react'
import { trackFunnel } from '@/src/lib/funnel/client'
import { withEntry } from '@/src/lib/funnel/entry'
import { ChevronDown, Plus, RotateCcw, X, Check } from 'lucide-react'
import { Button, Field, Input, Select } from '@/src/components/prism'
import { FX } from '@/src/lib/simulator/prices'
import { TIME_IS_NOT_MONEY, WORKFLOW_EVIDENCE, WORKFLOW_IDS, WHOLE_JOB, type RoiFinding, type WorkflowId } from '@/src/lib/roi/evidence'
import {
  SPRINT_FROM_USD,
  calculate,
  currencySymbol,
  defaultAssumptions,
  formatHours,
  formatMoney,
  isCurrency,
  sprintFromPrice,
  type Assumptions,
  type Currency,
  type WorkflowInput,
} from '@/src/lib/roi/calc'
import {
  ROI_ASSUMPTIONS,
  ROI_BORROWED_EVIDENCE,
  ROI_CTA,
  ROI_CURRENCY,
  ROI_EMPTY,
  ROI_FIELDS,
  ROI_PICKER,
  ROI_RESULT,
  ROI_WORKFLOWS,
} from '@/src/roi-calculator-content'
import { RoiEmailForm } from './RoiEmailForm'
import { paybackParts } from '@/src/lib/roi/email'

/** Numeric fields are held as typed strings so a field can be empty while someone edits it. */
type Row = { id: WorkflowId; people: string; hours: string; cost: string; low: string; high: string }

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '')
const num = (s: string) => {
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}
const pct = (n: number) => `${Number(n.toFixed(1))}%`

function newRow(id: WorkflowId): Row {
  const e = WORKFLOW_EVIDENCE[id]
  return { id, people: '', hours: '', cost: '', low: String(e.conservativePct), high: String(e.expectedPct) }
}

const toInput = (r: Row): WorkflowInput => ({
  id: r.id,
  people: num(r.people),
  hoursPerWeek: num(r.hours),
  hourlyCost: num(r.cost),
  conservativePct: num(r.low),
  expectedPct: num(r.high),
})

const panel = 'rounded-2xl border border-line-subtle bg-surface-base'

export function RoiCalculator() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [rows, setRows] = useState<Row[]>([])
  const [weeks, setWeeks] = useState(String(defaultAssumptions().weeksPerYear))
  const [week, setWeek] = useState(String(defaultAssumptions().workWeekHours))
  const [sprint, setSprint] = useState(String(sprintFromPrice('USD')))
  const [run, setRun] = useState('0')
  const [started, setStarted] = useState(false)

  const assumptions: Assumptions = { currency, weeksPerYear: num(weeks), workWeekHours: num(week), sprintCost: num(sprint), runCostPerMonth: num(run) }
  const inputs = rows.map(toInput)
  const result = useMemo(() => calculate(inputs, assumptions), [JSON.stringify(inputs), JSON.stringify(assumptions)]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasValue = result.totals.timeValue.expected > 0 || result.totals.hoursFreed.expected > 0
  const markStarted = () => {
    if (!started) {
      setStarted(true)
      trackFunnel('roi_calculator_start')
    }
  }

  const toggle = (id: WorkflowId) => {
    markStarted()
    setRows((current) => (current.some((r) => r.id === id) ? current.filter((r) => r.id !== id) : [...current, newRow(id)]))
  }
  const update = (id: WorkflowId, patch: Partial<Row>) => {
    markStarted()
    setRows((current) => current.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  const changeCurrency = (next: Currency) => {
    // Only the sprint price is converted; hourly costs are whatever the visitor typed.
    if (num(sprint) === sprintFromPrice(currency)) setSprint(String(sprintFromPrice(next)))
    setCurrency(next)
  }

  const flagged = result.workflows.find((w) => w.aboveWholeJobCheck)
  const payback = paybackParts(result)
  const usd = `$${SPRINT_FROM_USD.toLocaleString('en-US')}`
  const sprintHint = currency === 'USD' ? fill(ROI_ASSUMPTIONS.sprintHintUsd, { usd }) : fill(ROI_ASSUMPTIONS.sprintHintFx, { usd, date: FX.readOn })

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-10 lg:pb-0">
      {/* Inputs */}
      <div className="min-w-0 space-y-8">
        <section aria-labelledby="roi-picker-heading" className={`${panel} p-5 md:p-7`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="roi-picker-heading" className="type-xl font-display font-semibold leading-tight tracking-tight text-ink">
                {ROI_PICKER.heading}
              </h2>
              <p className="type-sm mt-2 max-w-xl text-ink-secondary">{ROI_PICKER.hint}</p>
            </div>
            <Field label={ROI_CURRENCY.label} htmlFor="roi-currency" className="sm:w-48">
              <Select
                id="roi-currency"
                value={currency}
                options={ROI_CURRENCY.options}
                onChange={(e) => isCurrency(e.target.value) && changeCurrency(e.target.value)}
              />
            </Field>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label={ROI_PICKER.heading}>
            {WORKFLOW_IDS.map((id) => {
              const on = rows.some((r) => r.id === id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(id)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,58,237,0.35)] active:scale-[0.98] ${
                      on ? 'border-[rgba(124,58,237,0.45)] bg-[rgba(124,58,237,0.08)] text-ink' : 'border-line-default text-ink-secondary hover:border-line-strong hover:text-ink'
                    }`}
                  >
                    {on ? <Check className="h-3.5 w-3.5 text-brand-violet-strong" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                    {ROI_WORKFLOWS[id].name}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        {rows.map((row) => (
          <WorkflowCard key={row.id} row={row} currency={currency} onChange={(patch) => update(row.id, patch)} onRemove={() => toggle(row.id)} />
        ))}

        <section aria-labelledby="roi-assumptions-heading" className="rounded-2xl border border-line-subtle bg-surface-raised p-5 md:p-7">
          <h2 id="roi-assumptions-heading" className="type-lg font-display font-semibold text-ink">{ROI_ASSUMPTIONS.heading}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={ROI_ASSUMPTIONS.weeks} htmlFor="roi-weeks" hint={ROI_ASSUMPTIONS.weeksHint}>
              <Input id="roi-weeks" type="number" inputMode="numeric" min={1} max={52} value={weeks} onChange={(e) => setWeeks(e.target.value)} />
            </Field>
            <Field label={ROI_ASSUMPTIONS.week} htmlFor="roi-week" hint={ROI_ASSUMPTIONS.weekHint}>
              <Input id="roi-week" type="number" inputMode="numeric" min={1} max={80} value={week} onChange={(e) => setWeek(e.target.value)} />
            </Field>
            <Field label={`${ROI_ASSUMPTIONS.sprint} (${currencySymbol(currency)})`} htmlFor="roi-sprint" hint={sprintHint}>
              <Input id="roi-sprint" type="number" inputMode="numeric" min={0} step={100} value={sprint} onChange={(e) => setSprint(e.target.value)} />
            </Field>
            <Field label={`${ROI_ASSUMPTIONS.run} (${currencySymbol(currency)})`} htmlFor="roi-run" hint={ROI_ASSUMPTIONS.runHint}>
              <Input id="roi-run" type="number" inputMode="numeric" min={0} step={10} value={run} onChange={(e) => setRun(e.target.value)} />
            </Field>
          </div>
        </section>
      </div>

      {/* Result: sticky on desktop, after the inputs on mobile */}
      <aside id="roi-result" aria-labelledby="roi-result-heading" className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
        <div className={`${panel} overflow-hidden shadow-[0_2px_24px_rgba(124,58,237,0.07)]`}>
          <div className="h-1 bg-[linear-gradient(90deg,#7c3aed,#3b82f6,#2dd4bf)]" aria-hidden />
          <div className="p-5 md:p-6" aria-live="polite">
            <h2 id="roi-result-heading" className="type-lg font-display font-semibold text-ink">{ROI_RESULT.heading}</h2>
            {!hasValue ? (
              <div className="mt-4">
                <p className="font-medium text-ink">{ROI_EMPTY.heading}</p>
                <p className="type-sm mt-1 text-ink-secondary">{ROI_EMPTY.body}</p>
              </div>
            ) : (
              <dl className="mt-5 space-y-5">
                <Metric label={ROI_RESULT.hoursLabel}>
                  {fill(ROI_RESULT.hoursRange, { low: formatHours(result.totals.hoursFreed.conservative), high: formatHours(result.totals.hoursFreed.expected) })}
                </Metric>
                <Metric label={ROI_RESULT.valueLabel}>
                  {fill(ROI_RESULT.valueRange, {
                    low: formatMoney(result.totals.timeValue.conservative, currency),
                    high: formatMoney(result.totals.timeValue.expected, currency),
                  })}
                </Metric>
                <p className="type-xs -mt-2 text-ink-secondary">
                  {ROI_RESULT.valueNote}{' '}
                  <a href={TIME_IS_NOT_MONEY.find((f) => f.slug.startsWith('humlum'))?.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                    {ROI_RESULT.valueNoteLink}
                  </a>
                </p>
                {result.startWith && (
                  <Metric label={ROI_RESULT.startLabel} small>
                    {ROI_WORKFLOWS[result.startWith].name}
                    <span className="type-xs mt-1 block font-normal text-ink-secondary">
                      {ROI_RESULT.startNote}
                      {result.safestBet && ` ${fill(ROI_RESULT.safestNote, { name: ROI_WORKFLOWS[result.safestBet].name })}`}
                      {ROI_BORROWED_EVIDENCE.includes(result.startWith) && ` ${ROI_RESULT.borrowedNote}`}
                    </span>
                  </Metric>
                )}
                <Metric label={ROI_RESULT.paybackLabel} small>
                  {payback.text}
                  {payback.note && <span className="type-xs mt-1 block font-normal text-ink">{payback.note}</span>}
                  <span className="type-xs mt-1 block font-normal text-ink-secondary">
                    {fill(ROI_RESULT.paybackAssumption, { cost: formatMoney(num(sprint), currency), run: formatMoney(num(run), currency) })}
                  </span>
                </Metric>
              </dl>
            )}

            {flagged && (
              <div role="note" className="mt-5 rounded-xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.07)] p-4">
                <p className="type-sm font-semibold text-ink">{ROI_RESULT.wholeJob.heading}</p>
                <p className="type-xs mt-1 text-ink-secondary">
                  {fill(ROI_RESULT.wholeJob.body, {
                    name: ROI_WORKFLOWS[flagged.id].name,
                    share: pct(flagged.shareOfWorkWeek.expected * 100),
                    low: pct(WHOLE_JOB.lowPct),
                    high: pct(WHOLE_JOB.highPct),
                  })}{' '}
                  <a href={WHOLE_JOB.finding.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                    {ROI_FIELDS.open}
                  </a>
                </p>
              </div>
            )}

            {hasValue && result.workflows.length > 1 && (
              <div className="mt-5 border-t border-line-subtle pt-4">
                <p className="type-xs font-medium text-ink-secondary">{ROI_RESULT.perWorkflow}</p>
                <ul className="mt-2 space-y-1.5">
                  {result.workflows.map((w) => (
                    <li key={w.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink-secondary">{ROI_WORKFLOWS[w.id].name}</span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {formatHours(w.hoursFreed.conservative)} to {formatHours(w.hoursFreed.expected)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="type-xs mt-5 text-ink-secondary">{ROI_RESULT.measure}</p>

            <div className="mt-5 flex flex-col gap-2">
              <Button href={withEntry(ROI_CTA.primaryHref, 'roi')} showArrow className="w-full justify-center" onClick={() => trackFunnel('roi_triage_click', { location: 'result' })}>
                {ROI_CTA.primary}
              </Button>
              <p className="type-xs text-center text-ink-secondary">{ROI_CTA.primaryNote}</p>
            </div>
          </div>
          <div className="border-t border-line-subtle bg-surface-raised p-5 md:p-6">
            <RoiEmailForm inputs={inputs} assumptions={assumptions} ready={hasValue} />
          </div>
        </div>
      </aside>

      {/* Mobile: the result sits below the inputs, so a bar keeps the headline number in view. */}
      {hasValue && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-[var(--surface-nav)] px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="type-xs text-ink-secondary">{ROI_RESULT.hoursLabel}</p>
              <p className="truncate font-display font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fill(ROI_RESULT.hoursRange, { low: formatHours(result.totals.hoursFreed.conservative), high: formatHours(result.totals.hoursFreed.expected) })}
              </p>
            </div>
            <a href="#roi-result" className="btn-secondary btn-sm shrink-0">
              {ROI_RESULT.mobileLink}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, children, small }: { label: string; children: React.ReactNode; small?: boolean }) {
  return (
    <div>
      <dt className="type-xs font-medium text-ink-secondary">{label}</dt>
      <dd className={`mt-1 font-display font-semibold tracking-tight text-ink ${small ? 'text-lg leading-snug' : 'text-2xl leading-tight'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {children}
      </dd>
    </div>
  )
}

function WorkflowCard({ row, currency, onChange, onRemove }: { row: Row; currency: Currency; onChange: (patch: Partial<Row>) => void; onRemove: () => void }) {
  const uid = useId()
  const e = WORKFLOW_EVIDENCE[row.id]
  const copy = ROI_WORKFLOWS[row.id]
  const atDefaults = num(row.low) === e.conservativePct && num(row.high) === e.expectedPct
  const id = (k: string) => `${uid}-${k}`

  return (
    <section aria-labelledby={id('name')} className={`${panel} p-5 md:p-7`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id={id('name')} className="type-lg font-display font-semibold text-ink">{copy.name}</h3>
          <p className="type-sm mt-1 text-ink-secondary">{copy.description}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-secondary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,58,237,0.35)]"
          aria-label={`${ROI_FIELDS.remove}: ${copy.name}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {ROI_FIELDS.remove}
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Field label={ROI_FIELDS.people} htmlFor={id('people')}>
          <Input id={id('people')} type="number" inputMode="numeric" min={0} value={row.people} onChange={(ev) => onChange({ people: ev.target.value })} />
        </Field>
        <Field label={ROI_FIELDS.hours} htmlFor={id('hours')} hint={ROI_FIELDS.hoursHint}>
          <Input id={id('hours')} type="number" inputMode="decimal" min={0} max={80} step="0.5" value={row.hours} onChange={(ev) => onChange({ hours: ev.target.value })} />
        </Field>
        <Field label={`${ROI_FIELDS.cost} (${currencySymbol(currency)})`} htmlFor={id('cost')} hint={ROI_FIELDS.costHint}>
          <Input id={id('cost')} type="number" inputMode="decimal" min={0} step="1" value={row.cost} onChange={(ev) => onChange({ cost: ev.target.value })} />
        </Field>
      </div>

      <fieldset className="mt-6 rounded-xl border border-line-subtle bg-surface-raised p-4">
        <legend className="px-1 text-sm font-semibold text-ink">{ROI_FIELDS.savedHeading}</legend>
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          <Field label={`${ROI_FIELDS.low} (%)`} htmlFor={id('low')}>
            <Input id={id('low')} type="number" inputMode="decimal" min={0} max={100} step="0.5" value={row.low} onChange={(ev) => onChange({ low: ev.target.value })} />
          </Field>
          <Field label={`${ROI_FIELDS.high} (%)`} htmlFor={id('high')}>
            <Input id={id('high')} type="number" inputMode="decimal" min={0} max={100} step="0.5" value={row.high} onChange={(ev) => onChange({ high: ev.target.value })} />
          </Field>
        </div>
        {!atDefaults && (
          <button
            type="button"
            onClick={() => onChange({ low: String(e.conservativePct), high: String(e.expectedPct) })}
            className="mt-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-brand-violet-strong hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {ROI_FIELDS.reset}
          </button>
        )}
        <p className="type-xs mt-3 text-ink-secondary">{copy.caveat}</p>
        {e.ceilingPct !== undefined && <p className="type-xs mt-2 text-ink-secondary">{fill(ROI_FIELDS.ceiling, { n: String(e.ceilingPct) })}</p>}

        <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-ink hover:text-brand-violet-strong [&::-webkit-details-marker]:hidden">
            {ROI_FIELDS.sourcesToggle}
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="type-xs mt-3 space-y-3 text-ink-secondary">
            <p className="type-xs">
              <span className="font-medium text-ink">{ROI_FIELDS.measures}</span> {e.unit}
            </p>
            <p className="type-xs">
              <span className="font-medium text-ink">{ROI_FIELDS.design}</span> {e.design}
            </p>
            <Source label={ROI_FIELDS.lowFrom} pct={e.conservativePct} finding={e.conservative} />
            {e.expected.slug !== e.conservative.slug ? (
              <Source label={ROI_FIELDS.highFrom} pct={e.expectedPct} finding={e.expected} />
            ) : null}
            {e.ceiling && e.ceilingPct !== undefined && <Source label={ROI_FIELDS.ceilingFrom} pct={e.ceilingPct} finding={e.ceiling} />}
            {e.also.map((f) => (
              <Source key={f.slug} label={ROI_FIELDS.alsoFrom} finding={f} />
            ))}
          </div>
        </details>
      </fieldset>
    </section>
  )
}

function Source({ label, pct: value, finding }: { label: string; pct?: number; finding: RoiFinding }) {
  return (
    <div className="border-l-2 border-line-default pl-3">
      <p className="type-xs">
        <span className="font-medium text-ink">
          {label}
          {value !== undefined && ` (${pct(value)})`}:
        </span>{' '}
        {finding.claim}
      </p>
      <p className="type-xs mt-1">
        {finding.sourceLabel}.{' '}
        <a href={finding.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-violet-strong underline decoration-line-strong underline-offset-2 hover:text-ink">
          {ROI_FIELDS.open}
        </a>
      </p>
      {finding.vendorNote && (
        <p className="type-xs mt-1">
          <span className="font-medium text-ink">{ROI_FIELDS.vendor}</span> {finding.vendorNote}
        </p>
      )}
    </div>
  )
}
