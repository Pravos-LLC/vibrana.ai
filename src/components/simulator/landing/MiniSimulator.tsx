'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { Button } from '@/src/components/prism'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import { PACES, SECTOR_IDS, type Pace, type SectorId } from '@/src/lib/simulator/types'
import { SIM_DASH, SIM_INTRO, SIM_PACES, SIM_SECTOR_LABELS } from '@/src/simulator-content'
import { SIM_HERO, SIM_MINI } from '@/src/simulator-landing-hero-content'
import { OrgScene } from '../OrgVisual'
import { buildLayout } from '../org-layout'
import { RangeInput } from '../RangeInput'
import { RollingText } from './RollingText'
import { RoadmapStrip } from './RoadmapStrip'
import { PEOPLE_STOPS, SANDBOX_DEFAULT, SANDBOX_SECTORS, isSample, nearestStop, runSandbox, sandboxOutputs, type Sandbox } from './sandbox'

export const MINI_SIMULATOR_ID = 'try-it'
export const SCROLLY_RUN_ID = 'walkthrough'

const MORE = SECTOR_IDS.filter((id) => !SANDBOX_SECTORS.includes(id))

const chip = (on: boolean) =>
  cn(
    'inline-flex min-h-9 items-center rounded-full border px-3.5 py-1.5 type-sm transition-[border-color,background-color,color,transform] duration-150 ease-out active:scale-[0.97]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet',
    on ? 'border-brand-violet bg-[rgba(124,58,237,0.09)] text-ink' : 'border-line text-ink-secondary hover:border-line-strong hover:text-ink',
  )

function Output({ label, text, unit }: { label: string; text: string; unit?: string }) {
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 py-3.5 sm:flex sm:flex-col sm:items-stretch sm:px-5 sm:py-4 sm:first:pl-0"
      style={{ containerType: 'inline-size' }}
    >
      <span className="type-sm text-ink-secondary">{label}</span>
      <span
        className="row-span-2 text-right font-display text-[1.375rem] font-semibold text-ink sm:mt-2 sm:text-left sm:text-[clamp(1.3rem,0.35rem+10.5cqi,2.25rem)]"
        style={{ lineHeight: 1.05, letterSpacing: '-0.02em' }}
      >
        <RollingText text={text} />
        <span className="sr-only">{text}</span>
      </span>
      <span className="label-mono mt-1 text-ink-tertiary sm:mt-2">
        {SIM_MINI.rangeLabel}
        {unit ? ` / ${unit}` : ''}
      </span>
    </div>
  )
}

/**
 * The hero sandbox: sector chips, a people slider and pace chips drive the real engine, and the
 * three outputs roll to new ranges as you move. No email, no network: it runs in the browser.
 * Controlled, so the scroll run below can hand its scenario back ("Try it yourself").
 */
export function MiniSimulator({ value, onChange, onStart }: { value: Sandbox; onChange: (s: Sandbox) => void; onStart: () => void }) {
  const reduce = useHydratedReducedMotion()
  // Dragging the slider stays at 60fps: the model and the network re-run on the deferred value.
  const deferred = useDeferredValue(value)
  const result = useMemo(() => runSandbox(deferred), [deferred])
  const layout = useMemo(() => buildLayout(result), [result])
  const out = sandboxOutputs(result)
  const [more, setMore] = useState(() => MORE.includes(value.sector))
  const showMore = more || MORE.includes(value.sector)
  const sample = isSample(value)

  // One polite announcement after the visitor settles, not one per slider notch.
  const [announce, setAnnounce] = useState('')
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!touched) return
    const id = window.setTimeout(() => setAnnounce(SIM_MINI.liveAnnounce(out.capacity.text)), 700)
    return () => window.clearTimeout(id)
  }, [out.capacity.text, touched])

  const set = (patch: Partial<Sandbox>) => {
    setTouched(true)
    onChange({ ...value, ...patch })
  }
  const stopIndex = PEOPLE_STOPS.indexOf(nearestStop(value.people) as (typeof PEOPLE_STOPS)[number])
  const peopleText = value.people.toLocaleString('en-US')

  const scrollToRun = () => {
    document.getElementById(SCROLLY_RUN_ID)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section id={MINI_SIMULATOR_ID} aria-labelledby="sim-hero-title" className="scroll-mt-24">
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="label-mono text-ink-tertiary">{SIM_HERO.eyebrow}</p>
          <h1
            id="sim-hero-title"
            className="mt-4 max-w-[17ch] font-display font-semibold text-ink"
            style={{ fontSize: 'clamp(2.25rem, 1.25rem + 3.1vw, 3.9rem)', lineHeight: 1.03, letterSpacing: '-0.035em' }}
          >
            {SIM_HERO.title.before}
            <span className="font-serif-accent text-brand-violet-strong">{SIM_HERO.title.accent}</span>
            {SIM_HERO.title.after}
          </h1>
        </div>
        <div className="lg:col-span-5 lg:pb-2">
          <p className="max-w-[46ch] text-ink-secondary" style={{ fontSize: '1.0625rem', lineHeight: 1.55 }}>
            {SIM_HERO.subtitle}
          </p>
        </div>
      </div>

      <div
        role="region"
        aria-label={SIM_MINI.label}
        className="mt-8 grid overflow-hidden rounded-[1.75rem] border border-line-subtle bg-surface-base shadow-[0_30px_80px_rgba(30,27,75,0.10)] lg:mt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:grid-rows-[auto_1fr]"
      >
        {/* Outputs first in the source, so on phones the ranges sit right above the controls that move them. */}
        <div className="min-w-0 border-b border-line-subtle px-5 pt-1 sm:px-7 sm:pt-3 lg:col-start-2 lg:row-start-1 lg:pt-7">
          <div className="grid divide-y divide-line-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Output label={SIM_MINI.outputs.capacity.label} unit={SIM_MINI.outputs.capacity.unit} text={out.capacity.text} />
            <Output label={SIM_MINI.outputs.runCost.label} text={out.runCost.text} />
            <Output label={SIM_MINI.outputs.timeFreed.label} unit={SIM_MINI.outputs.timeFreed.unit} text={out.timeFreed.text} />
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-7 border-b border-line-subtle bg-surface-raised p-5 sm:p-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:border-b-0 lg:border-r">
          <fieldset>
            <legend className="label-mono mb-3 text-ink-tertiary">{SIM_MINI.sectorLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {SANDBOX_SECTORS.map((id) => (
                <button key={id} type="button" className={chip(value.sector === id)} aria-pressed={value.sector === id} onClick={() => set({ sector: id })}>
                  {SIM_SECTOR_LABELS[id]}
                </button>
              ))}
              <button type="button" className={cn(chip(MORE.includes(value.sector)), 'gap-1.5')} aria-expanded={showMore} aria-controls="sim-more-sectors" onClick={() => setMore(!showMore)}>
                {SIM_MINI.moreSectors}
                <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 transition-transform duration-200', showMore && 'rotate-180')} />
              </button>
            </div>
            {showMore && (
              <div id="sim-more-sectors" className="mt-2 flex flex-wrap gap-2">
                {MORE.map((id) => (
                  <button key={id} type="button" className={chip(value.sector === id)} aria-pressed={value.sector === id} onClick={() => set({ sector: id })}>
                    {SIM_SECTOR_LABELS[id]}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="label-mono mb-1 text-ink-tertiary">{SIM_MINI.peopleLabel}</legend>
            <p className="tabular font-display font-semibold text-ink" style={{ fontSize: '1.75rem', lineHeight: 1.15, letterSpacing: '-0.02em' }} aria-hidden>
              {SIM_MINI.peopleValue(peopleText)}
            </p>
            <RangeInput
              min={0}
              max={PEOPLE_STOPS.length - 1}
              step={1}
              value={stopIndex}
              onChange={(i) => set({ people: PEOPLE_STOPS[i] })}
              label={SIM_MINI.peopleLabel}
              valueText={SIM_MINI.peopleValue(peopleText)}
              className="mt-1"
            />
            <span className="mt-1 block type-xs text-ink-tertiary">{SIM_MINI.peopleHint}</span>
          </fieldset>

          <fieldset>
            <legend className="label-mono mb-3 text-ink-tertiary">{SIM_MINI.paceLabel}</legend>
            <div className="grid grid-cols-3 gap-2">
              {PACES.map((p: Pace) => (
                <button key={p} type="button" className={cn(chip(value.pace === p), 'justify-center')} aria-pressed={value.pace === p} onClick={() => set({ pace: p })}>
                  {SIM_PACES[p].label}
                </button>
              ))}
            </div>
            <p className="mt-2 type-xs text-ink-secondary" style={{ minHeight: '2.5em' }}>
              {SIM_MINI.paceHint[value.pace]}
            </p>
          </fieldset>

          <div className="mt-auto flex flex-col gap-3 border-t border-line-subtle pt-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 type-sm font-medium text-ink underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
                <ChevronDown aria-hidden className="h-4 w-4 -rotate-90 text-ink-tertiary transition-transform duration-200 group-open:rotate-0" />
                {SIM_MINI.howLink}
              </summary>
              <p className="mt-3 type-xs leading-relaxed text-ink-secondary">{SIM_MINI.howBody}</p>
            </details>
            {sample ? (
              <p className="type-xs text-ink-tertiary">{SIM_INTRO.sampleCaption}</p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMore(false)
                  set({ ...SANDBOX_DEFAULT })
                }}
                className="inline-flex items-center gap-1.5 self-start type-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
              >
                <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                {SIM_MINI.reset}
              </button>
            )}
          </div>
        </div>

        {/* The picture */}
        <div className="flex min-w-0 flex-col px-5 pb-5 sm:px-7 sm:pb-7 lg:col-start-2 lg:row-start-2">
          <div className="mt-4 grid items-center gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-6">
            <div className="mx-auto w-full max-w-[440px] overflow-hidden" aria-hidden>
              <OrgScene result={result} layout={layout} month={12} animated={!reduce} growthLabel={SIM_DASH.efficiency.growth} bare />
            </div>
            <RoadmapStrip result={result} caption={SIM_MINI.roadmapLabel} label={SIM_MINI.roadmapAria(SIM_PACES[value.pace].label.toLowerCase())} />
          </div>
          <p className="mt-auto pt-5 type-xs text-ink-tertiary">{SIM_MINI.headcountNote}</p>
        </div>
      </div>

      {reduce && <span className="sr-only">{SIM_MINI.reducedMotionNote}</span>}
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Button onClick={onStart} showArrow>
          {SIM_HERO.ctaPrimary}
        </Button>
        <button type="button" onClick={scrollToRun} className="self-start type-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-brand-violet sm:self-auto">
          {SIM_HERO.ctaSecondary}
        </button>
        <p className="type-xs text-ink-tertiary sm:ml-auto sm:max-w-[44ch] sm:text-right">{SIM_HERO.formNote}</p>
      </div>
    </section>
  )
}
