'use client'

import { ChevronDown, ExternalLink, SlidersHorizontal } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/src/components/ui/sheet'
import { FUNCTIONS, REGIONS, type AssumptionOverrides, type FunctionMix, type Region, type SimulatorResult } from '@/src/lib/simulator/types'
import { HOURLY_COST_LOCAL, HOURLY_COST_SOURCES, REGION_CURRENCY, WORKING_WEEKS } from '@/src/lib/simulator/assumptions'
import { FX } from '@/src/lib/simulator/prices'
import { drilldown } from '@/src/lib/simulator/drilldown'
import { SIM_DRAWER, SIM_DRILL, SIM_FUNCTION_LABELS, SIM_REGION_LABELS } from '@/src/simulator-content'

const d = SIM_DRAWER
const SYMBOL = { USD: '$', EUR: '€', GBP: '£' } as const

type Props = {
  result: SimulatorResult
  overrides: AssumptionOverrides
  onChange: (next: AssumptionOverrides) => void
  onReset: () => void
  /** Domain the mix was classified from, if any. */
  classifiedFrom: string | null
}

export function AssumptionsDrawer({ result, overrides, onChange, onReset, classifiedFrom }: Props) {
  const region = result.resolved.region
  const currency = REGION_CURRENCY[region]
  const rate = FX.perUsd[currency]
  const src = HOURLY_COST_SOURCES[region]
  const mix = result.resolved.functionMix
  const localHourly = Math.round(result.resolved.hourlyCost * rate * 100) / 100
  const set = (patch: Partial<AssumptionOverrides>) => onChange({ ...overrides, ...patch })

  const setMix = (f: keyof FunctionMix, pct: number) => {
    const next = { ...mix, [f]: Math.max(0, pct) / 100 }
    set({ functionMix: next })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="btn-secondary btn-sm inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {d.open}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="z-[100] w-full overflow-y-auto border-line-subtle bg-surface-base sm:max-w-md">
        <SheetTitle className="font-display type-2xl font-semibold text-ink">{d.title}</SheetTitle>
        <SheetDescription className="type-sm text-ink-secondary">{d.intro}</SheetDescription>

        <div className="mt-6 space-y-8 pb-10">
          <fieldset>
            <legend className="field-label">{d.region.label}</legend>
            <select
              className="input"
              value={region}
              onChange={(e) => {
                const r = e.target.value as Region
                // A new region resets the hourly rate to that region's sourced default.
                set({ region: r, hourlyCost: undefined })
              }}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{`${SIM_REGION_LABELS[r]} (${REGION_CURRENCY[r]})`}</option>
              ))}
            </select>
            <p className="mt-1.5 type-xs text-ink-tertiary">{d.region.fx(FX.readOn)}</p>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.hourly.label} ({currency})</legend>
            <div className="flex items-center gap-2">
              <span className="text-ink-secondary">{SYMBOL[currency]}</span>
              <input
                type="number"
                min={1}
                max={1000}
                step="0.5"
                className="input"
                value={localHourly}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v > 0) set({ hourlyCost: v / rate })
                }}
              />
            </div>
            <p className="mt-1.5 type-xs text-ink-secondary">{d.hourly.hint} {d.hourly.caveat}</p>
            <p className="mt-1 type-xs text-ink-tertiary">
              {overrides.hourlyCost === undefined ? (
                <>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-brand-violet-strong hover:underline">{src.label}</a>
                  {'. '}
                  {d.hourly.period(src.period)} {src.measure} ({SYMBOL[currency]}
                  {HOURLY_COST_LOCAL[region][result.inputs.sector]})
                </>
              ) : (
                d.yourValue
              )}
            </p>
            <p className="mt-3 type-xs text-ink-secondary">{d.hourly.pay}</p>
            <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 type-xs tabular-nums text-ink-secondary">
              {FUNCTIONS.map((f) => (
                <li key={f} className="flex justify-between gap-2">
                  <span>{SIM_FUNCTION_LABELS[f]}</span>
                  <span className="text-ink">{SYMBOL[currency]}{Math.round(result.resolved.hourlyByFunction[f] * rate)}</span>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.mix.label}</legend>
            <p className="mb-3 type-xs text-ink-secondary">{d.mix.hint}</p>
            <div className="grid grid-cols-2 gap-3">
              {FUNCTIONS.map((f) => (
                <label key={f} className="block type-xs text-ink-secondary">
                  {SIM_FUNCTION_LABELS[f]}
                  <span className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      className="input"
                      value={Math.round(mix[f] * 100)}
                      onChange={(e) => setMix(f, Number(e.target.value))}
                    />
                    <span>%</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 type-xs text-ink-tertiary">
              {overrides.functionMix ? d.yourValue : classifiedFrom ? d.mix.sourceClassified(classifiedFrom) : d.mix.sourceDefault}
            </p>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.taskShare.label}</legend>
            <p className="mb-2 type-xs text-ink-secondary">{d.taskShare.hint}</p>
            <div className="space-y-2">
              {d.taskShare.options.map((o) => (
                <label key={o.value} className="flex items-center gap-2 type-sm text-ink">
                  <input
                    type="radio"
                    name="sim-task-share"
                    checked={(overrides.taskShare ?? 1) === o.value}
                    onChange={() => set({ taskShare: o.value })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <p className="mt-1.5 type-xs text-ink-tertiary">{d.assumption}</p>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.weeks.label}</legend>
            <input
              type="number"
              min={30}
              max={52}
              className="input"
              value={overrides.workingWeeks ?? WORKING_WEEKS.value}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (v >= 30 && v <= 52) set({ workingWeeks: v })
              }}
            />
            <p className="mt-1.5 type-xs text-ink-tertiary">{d.weeks.hint}</p>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.outsourced.label} ({currency})</legend>
            <input
              type="number"
              min={0}
              step={1000}
              className="input"
              placeholder={d.outsourced.placeholder}
              value={overrides.outsourcedAnnual ? Math.round(overrides.outsourcedAnnual * rate) : ''}
              onChange={(e) => {
                const v = Number(e.target.value)
                set({ outsourcedAnnual: v > 0 ? v / rate : undefined })
              }}
            />
            <p className="mt-1.5 type-xs text-ink-tertiary">{d.outsourced.hint}</p>
          </fieldset>

          <fieldset>
            <legend className="field-label">{d.newWork.label}</legend>
            <input
              type="text"
              maxLength={24}
              className="input"
              placeholder={d.newWork.placeholder}
              value={overrides.newWorkLabel ?? ''}
              onChange={(e) => set({ newWorkLabel: e.target.value || undefined })}
            />
            <p className="mt-1.5 type-xs text-ink-tertiary">{d.newWork.hint}</p>
          </fieldset>

          <button type="button" onClick={onReset} className="btn-secondary btn-sm">{d.reset}</button>

          <section aria-labelledby="sim-drill-heading" className="border-t border-line-subtle pt-6">
            <h3 id="sim-drill-heading" className="font-display type-lg font-semibold text-ink">{SIM_DRILL.heading}</h3>
            <p className="mt-1 type-xs text-ink-secondary">{SIM_DRILL.intro}</p>
            <div className="mt-3 divide-y divide-line-subtle border-y border-line-subtle">
              {drilldown(result, currency).map((section) => (
                <details key={section.id} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-2 type-sm font-medium text-ink">
                    {SIM_DRILL.sections[section.id].title}
                    <ChevronDown className="h-4 w-4 text-ink-tertiary transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <ul className="pb-2">
                    {section.rows.map((row) => (
                      <li key={row.label} className="border-t border-line-subtle py-2.5 first:border-t-0">
                        <p className="flex flex-wrap items-baseline justify-between gap-x-3 type-xs">
                          <span className="font-medium text-ink">{row.label}</span>
                          <span className="tabular-nums text-ink">{row.value}</span>
                        </p>
                        {row.note && <p className="mt-1 type-xs leading-relaxed text-ink-secondary">{row.note}</p>}
                        {row.sources.length > 0 ? (
                          <p className="mt-1 flex flex-col gap-0.5">
                            {row.sources.map((src) => (
                              <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 type-xs text-brand-violet-strong hover:underline">
                                <span>{src.label}</span>
                                <ExternalLink className="mt-0.5 h-3 w-3 flex-none" aria-hidden />
                              </a>
                            ))}
                          </p>
                        ) : (
                          <p className="mt-1 type-xs text-ink-tertiary">{SIM_DRILL.ours}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
