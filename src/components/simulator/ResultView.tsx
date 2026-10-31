'use client'
import { siteContent } from '@/src/site-content'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ChevronDown, ExternalLink, FileText, Pencil } from 'lucide-react'
import type { CompanyProfile } from '@/src/lib/simulator/api'
import type { Currency, Delivery, Range, Region, SimulatorResult } from '@/src/lib/simulator/types'
import { EVIDENCE, ILLUSTRATIONS, BENCHMARKS_READ_ON } from '@/src/lib/simulator/benchmarks'
import { PRICES_READ_ON, SEAT_PRICES, TOKEN_PRICES } from '@/src/lib/simulator/prices'
import { DEPARTMENT_PAY, HOURLY_COST_SOURCES, SUPPORT_MONTHLY } from '@/src/lib/simulator/assumptions'
import { sectorExample } from '@/src/lib/simulator/sector-examples'
import { TOOLING, TOOLING_READ_ON, TOOL_IDS } from '@/src/lib/simulator/tooling'
import { ReadinessCard } from './ReadinessCard'
import { NetChart } from './NetChart'
import { compareDelivery } from '@/src/lib/simulator/engine'
import { companyName, formatAbout, formatMoney, formatMoneyRange, formatNumber, formatPercent, formatRange, roundAbout, sizeBand } from '@/src/lib/simulator/format'
import { getImagery } from '@/src/imagery-manifest'
import { CLOSING_MOCK } from '@/src/enterprise-home-content'
import { ClosingAssessment } from '@/src/components/enterprise/home/ClosingAssessment'
import {
  SIM_DASH,
  SIM_DELIVERY,
  SIM_DATA_RULES,
  SIM_PROVIDER_LABELS,
  SIM_PROVIDER_LOGOS,
  SIM_REGION_LABELS,
  SIM_SECTOR_LABELS,
  SIM_SECTOR_READ,
} from '@/src/simulator-content'
import { OrgVisual } from './OrgVisual'
import { CostChart } from './CostChart'
import { DepartmentBreakdown } from './DepartmentBreakdown'
import { Roadmap } from './Roadmap'
import { SectorLogo } from './SectorLogo'
import { OfferGallery } from './OfferGallery'
import { WhyOutsideHelp } from './WhyOutsideHelp'
import { AnimatedNumber } from './AnimatedNumber'
import { CAPACITY_GREEN } from './dept'

const D = SIM_DASH
export const panel = 'rounded-2xl border border-line-subtle bg-surface-base'
const EASE = [0.22, 1, 0.36, 1] as const

const SECTIONS = [
  { id: 'sim-overview', label: D.nav.overview },
  { id: 'sim-efficiency', label: D.nav.efficiency },
  { id: 'sim-pnl', label: D.nav.pnl },
  { id: 'sim-departments', label: D.nav.departments },
  { id: 'sim-roadmap', label: D.nav.roadmap },
  { id: 'sim-why', label: D.nav.why },
  { id: 'sim-help', label: D.nav.help },
  { id: 'sim-sources', label: D.nav.sources },
] as const

export type ResultViewProps = {
  result: SimulatorResult
  currency: Currency
  growthLabel: string
  profile?: CompanyProfile | null
  /** Display name: the visitor's opt-in name, else the homepage title. */
  companyName?: string | null
  /** Assumptions drawer trigger. */
  toolbar?: ReactNode
  /** Lead and share block. */
  actions?: ReactNode
  /** Shown above the dashboard, e.g. on a shared link. */
  banner?: ReactNode
  /** Edit-inputs panel, shown at the top of the dashboard when open. */
  editPanel?: ReactNode
  onEdit?: () => void
  editing?: boolean
  assessmentHref: string
  /** Switches how the rollout is delivered. Absent on a shared page, which shows the saved choice. */
  onDelivery?: (d: Delivery) => void
  /** Live run where the website could not be read: says the sector was picked by hand. */
}

/** Twelve times the month-12 value: an annual run-rate for the headline KPI. */
const yearly = (r: Range): Range => ({ low: r.low * 12, central: r.central * 12, high: r.high * 12 })

export function ResultView(props: ResultViewProps) {
  const { result, currency, profile, banner, actions, toolbar, editPanel, onEdit, editing, assessmentHref, growthLabel, onDelivery } = props
  const active = useActiveSection()
  const domain = result.inputs.domain
  const name = props.companyName || profile?.name || companyName(domain, profile?.title) || SIM_SECTOR_LABELS[result.inputs.sector]

  return (
    <div className="space-y-6">
      {banner}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-8">
        {/* Sidebar: sticky on desktop; on mobile a scrolling chip nav. */}
        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className={`${panel} hidden p-4 lg:block`}>
            <CompanyMark profile={profile} name={name} />
            <nav className="mt-5" aria-label={D.nav.overview}>
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`relative block rounded-lg px-3 py-1.5 type-sm transition-colors ${active === s.id ? 'bg-[rgba(124,58,237,0.07)] font-medium text-ink' : 'text-ink-secondary hover:text-ink'}`}
                    >
                      {active === s.id && <span aria-hidden className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[linear-gradient(180deg,#7c3aed,#3b82f6)]" />}
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-5 border-t border-line-subtle pt-4">
              <p className="type-xs font-medium text-ink-tertiary">{D.sidebar.inputs}</p>
              <InputsSummary result={result} currency={currency} />
              <div className="mt-3 flex flex-wrap gap-2">
                {onEdit && (
                  <button type="button" onClick={onEdit} className="btn-secondary btn-sm inline-flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {editing ? D.sidebar.done : D.sidebar.edit}
                  </button>
                )}
                {toolbar}
              </div>
            </div>
            <a href="#sim-lead" className="btn-primary mt-5 flex w-full items-center justify-center gap-2 text-center">
              <FileText className="h-4 w-4" aria-hidden />
              {D.sidebar.pdf}
            </a>
          </div>

          <div className="lg:hidden">
            <div className={`${panel} p-4`}>
              <p className="type-xs font-medium text-ink-tertiary">{D.sidebar.inputs}</p>
              <InputsSummary result={result} currency={currency} />
              <div className="mt-3 flex flex-wrap gap-2">
                {onEdit && (
                  <button type="button" onClick={onEdit} className="btn-secondary btn-sm inline-flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {editing ? D.sidebar.done : D.sidebar.edit}
                  </button>
                )}
                {toolbar}
              </div>
            </div>
            <nav className="sticky top-16 z-20 -mx-4 mt-3 overflow-x-auto bg-surface-base/85 px-4 py-2 backdrop-blur [scrollbar-width:none]" aria-label={D.nav.overview}>
              <ul className="flex gap-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`block whitespace-nowrap rounded-full border px-3 py-1 type-xs transition-colors ${active === s.id ? 'border-brand-violet text-ink' : 'border-line-subtle text-ink-secondary'}`}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {editing && editPanel && <div className={`${panel} p-5 md:p-7`}>{editPanel}</div>}

          <section id="sim-overview" className="scroll-mt-28 space-y-4">
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <CompanyHeader result={result} profile={profile} name={name} currency={currency} />
              <div className="flex min-w-0 flex-col gap-4">
                <ReadinessCard result={result} assessmentHref={assessmentHref} onSetBaseline={onEdit} />
                <SectorExampleCard result={result} />
              </div>
            </div>
            <KpiStrip result={result} currency={currency} />
          </section>

          <Section id="sim-efficiency" title={D.efficiency.heading} sub={D.efficiency.body} aside={<EfficiencyKpi result={result} currency={currency} />}>
            <OrgVisual result={result} growthLabel={growthLabel} />
            <p className="mt-4 flex gap-2 type-sm text-ink-secondary">
              <span aria-hidden className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full" style={{ background: CAPACITY_GREEN }} />
              <span>
                <span className="font-medium text-ink">{D.efficiency.growth}.</span> {D.efficiency.growthLine}
              </span>
            </p>
          </Section>

          <Section id="sim-pnl" title={D.pnl.heading} sub={D.pnl.sub}>
            <DeliveryPanel result={result} currency={currency} onDelivery={onDelivery} />
            <div className="mt-8">
              <CostChart result={result} currency={currency} />
            </div>
          </Section>

          <Section id="sim-departments" title={D.departments.heading} sub={D.departments.sub}>
            <DepartmentBreakdown result={result} currency={currency} />
          </Section>

          <AssessmentCta href={assessmentHref} />

          <Section id="sim-roadmap" title={D.roadmap.heading} sub={D.roadmap.sub}>
            <Roadmap result={result} currency={currency} />
          </Section>

          <Section id="sim-why" title={D.why.heading} sub={D.why.sub}>
            <WhyOutsideHelp />
          </Section>

          <Section id="sim-help" title={D.help.heading} sub={D.help.sub}>
            <OfferGallery offers={result.offers} currency={currency} assessmentHref={assessmentHref} />
          </Section>

          <div id="sim-lead" className="scroll-mt-28">
            {actions}
          </div>

          <SourcesPanel region={result.resolved.region} />

          <p className="type-xs leading-relaxed text-ink-tertiary">{D.fineprint(PRICES_READ_ON)}</p>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, sub, aside, children }: { id: string; title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      id={id}
      className={`${panel} scroll-mt-28 p-5 md:p-8`}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="grid items-end gap-x-10 gap-y-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="max-w-2xl">
          <h2 className="font-display type-xl font-semibold tracking-tight text-ink md:type-2xl">{title}</h2>
          {sub && <p className="mt-1.5 type-sm text-ink-secondary">{sub}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-6">{children}</div>
    </motion.section>
  )
}

/** Which section is in view, for the sidebar nav. */
function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id)
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e))
    if (els.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
  return active
}

function CompanyMark({ profile, name }: { profile?: CompanyProfile | null; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <CompanyLogo profile={profile} name={name} size={36} />
      <p className="min-w-0 truncate font-display type-base font-semibold text-ink">{name}</p>
    </div>
  )
}

export function CompanyLogo({ profile, name, size }: { profile?: CompanyProfile | null; name: string; size: number }) {
  const [failed, setFailed] = useState(false)
  const src = profile?.logoUrl
  if (src && !failed) {
    return (
      // Remote logo of arbitrary size and format: a plain img, contained.
      // eslint-disable-next-line @next/next/no-img-element
      <PublicDemoImg
        src={src}
        alt={D.header.logoAlt(profile?.domain ?? name)}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="flex-none rounded-lg border border-line-subtle bg-white object-contain p-1"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="inline-flex flex-none items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7c3aed,#3b82f6)] font-display font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.44 }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

function InputsSummary({ result, currency }: { result: SimulatorResult; currency: Currency }) {
  const i = result.inputs
  return (
    <dl className="mt-2 space-y-1.5 type-xs">
      <div className="flex justify-between gap-2">
        <dt className="text-ink-tertiary">{SIM_SECTOR_LABELS[i.sector]}</dt>
        <dd className="tabular-nums text-ink">{D.sidebar.people(formatNumber(i.headcount))}</dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-1">
          {i.providers.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <PublicDemoImg key={p} src={SIM_PROVIDER_LOGOS[p].src} alt={SIM_PROVIDER_LABELS[p]} width={14} height={14} className={`h-3.5 w-3.5 ${SIM_PROVIDER_LOGOS[p].mono ? 'logo-mono' : ''}`} />
          ))}
        </dt>
        <dd className="tabular-nums text-ink">{D.sidebar.cap(formatMoney(i.cap, currency))}</dd>
      </div>
      <div className="flex justify-between gap-2">
        <dt className="text-ink-tertiary">{SIM_DATA_RULES[i.dataRule].label}</dt>
        <dd className="tabular-nums text-ink">{formatPercent(result.resolved.adoptionCurve.aMax)}</dd>
      </div>
    </dl>
  )
}

function CompanyHeader({ result, profile, name, currency }: { result: SimulatorResult; profile?: CompanyProfile | null; name: string; currency: Currency }) {
  const region = result.resolved.region
  const [shotFailed, setShotFailed] = useState(false)
  const shot = shotFailed ? null : profile?.screenshotUrl
  const domain = result.inputs.domain
  const fallback = SIM_SECTOR_READ[result.inputs.sector]
  const read = profile?.summary ? { aiRole: profile.aiRole, levers: profile.levers } : fallback
  return (
    <div className={`${panel} relative overflow-hidden p-5 md:p-6`}>
      <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.10),transparent_65%)]" />
      <div className={`relative grid gap-5 ${shot ? 'sm:grid-cols-[minmax(0,1fr)_13rem]' : ''}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <CompanyLogo profile={profile} name={name} size={44} />
            <div className="min-w-0">
              <h1 className="truncate font-display type-xl font-semibold tracking-tight text-ink">{name}</h1>
              {domain && (
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 type-xs text-ink-tertiary hover:text-ink">
                  {domain}
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-1.5 type-xs">
            {name !== SIM_SECTOR_LABELS[result.inputs.sector] && <Chip>{SIM_SECTOR_LABELS[result.inputs.sector]}</Chip>}
            <Chip>{D.header.size(sizeBand(result.inputs.headcount))}</Chip>
            <Chip>{D.header.costs(SIM_REGION_LABELS[region])}</Chip>
            <Chip>{currency}</Chip>
          </ul>
          {read ? (
            <div className="mt-4 space-y-3">
              {profile?.summary && <p className="type-sm leading-relaxed text-ink">{profile.summary}</p>}
              {read.aiRole && (
                <div>
                  <p className="type-xs font-medium text-ink-tertiary">{D.header.aiRole(name)}</p>
                  <p className="mt-1 type-sm leading-relaxed text-ink-secondary">{read.aiRole}</p>
                </div>
              )}
              {read.levers.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {read.levers.map((l) => (
                    <li key={l} className="flex items-start gap-2 type-sm text-ink-secondary">
                      <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-brand-violet" />
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        {shot && (
          <figure className="hidden self-start overflow-hidden rounded-xl border border-line-subtle bg-surface-raised shadow-[0_12px_30px_rgba(30,27,75,0.10)] sm:block">
            <div className="flex items-center gap-1 border-b border-line-subtle px-2.5 py-1.5" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5f57]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#febc2e]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <PublicDemoImg src={shot} alt={D.header.screenshotAlt(domain ?? name)} className="aspect-[16/11] w-full object-cover object-top" loading="lazy" onError={() => setShotFailed(true)} />
          </figure>
        )}
      </div>
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <li className="rounded-full border border-line-subtle px-2.5 py-0.5 text-ink-secondary">{children}</li>
}

/** How you get there (with Vibrana, or on your own) and what each leaves you with. */
function DeliveryPanel({ result, currency, onDelivery }: { result: SimulatorResult; currency: Currency; onDelivery?: (d: Delivery) => void }) {
  const comparison = useMemo(() => compareDelivery(result.inputs), [result.inputs])
  const active = result.resolved.delivery
  const program = comparison.consultant.resolved.program
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={SIM_DELIVERY.label} className="inline-flex rounded-full border border-line-subtle p-0.5">
          {(['consultant', 'diy'] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={active === d}
              disabled={!onDelivery}
              onClick={() => onDelivery?.(d)}
              title={SIM_DELIVERY.hints[d]}
              className={`rounded-full px-4 py-1.5 type-sm font-medium transition-colors ${active === d ? 'bg-ink text-surface-base' : 'text-ink-secondary hover:text-ink'}`}
            >
              {SIM_DELIVERY.options[d]}
            </button>
          ))}
        </div>
        <p className="type-xs text-ink-tertiary">{SIM_DELIVERY.hints[active]}</p>
      </div>
      <div className="mt-6">
        <NetChart comparison={comparison} active={active} currency={currency} />
      </div>
      {program && (
        <p className="mt-3 type-xs text-ink-tertiary">{SIM_DELIVERY.outside(formatMoney(program.fee, currency, { compact: true }), program.months, formatMoney(SUPPORT_MONTHLY.central.value, currency, { compact: true }))}</p>
      )}
    </div>
  )
}

function SectorExampleCard({ result }: { result: SimulatorResult }) {
  const ex = sectorExample(result.inputs.sector)
  if (!ex) return null
  return (
    <div className={`${panel} flex flex-col p-5 md:p-6`}>
      {ex.logo && (
        <div className="mb-3 flex h-6 items-center">
          <SectorLogo example={ex} className="h-5" />
        </div>
      )}
      <p className="type-xs font-medium text-ink-tertiary">{ex.descriptor}</p>
      <p className="mt-1 font-display type-lg font-semibold leading-snug text-ink">{D.example.heading(ex.company)}</p>
      <p className="mt-2 type-sm leading-relaxed text-ink-secondary">{ex.result}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 type-xs text-ink-tertiary">
        <span>{D.example.reported[ex.reportedBy]}</span>
        <a href={ex.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-violet-strong hover:underline">
          {ex.publisher}, {ex.date}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  )
}

/** Money formatted for a tween: rounds the same way as formatMoney so the final frame matches the static text. */
const moneyFmt = (currency: Currency) => (usd: number) => formatMoney(usd, currency)
const aboutFmt = (n: number) => formatAbout(n)

function KpiStrip({ result, currency }: { result: SimulatorResult; currency: Currency }) {
  const h = result.headline
  const value = yearly(h.capacityValue)
  const at12 = result.scenarios.central.months[12]
  const capUsed = at12.costs.seats + at12.costs.usage
  const allHours = Math.max(1, result.inputs.headcount * result.resolved.workingHoursPerMonth)
  const freedShare = result.scenarios.central.months.map((m) => m.hoursFreed / allHours)
  const training = result.scenarios.central.months.map((m) => m.costs.trainingTime)
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        featured
        label={D.kpi.value.label}
        main={<AnimatedNumber value={value.central} format={moneyFmt(currency)} />}
        unit={D.kpi.value.unit}
        range={value}
        rangeText={formatMoneyRange(value, currency)}
        sub={D.kpi.value.sub(formatRange(h.hoursFreed))}
      />
      <Kpi
        label={D.kpi.run.label}
        main={<AnimatedNumber value={h.runCost.central} format={moneyFmt(currency)} />}
        range={h.runCost}
        rangeText={formatMoneyRange(h.runCost, currency)}
        sub={D.kpi.run.sub(formatMoney(h.ceiling, currency))}
        gauge={h.ceiling > 0 ? Math.min(1, capUsed / h.ceiling) : 0}
      />
      <Kpi
        label={D.kpi.adoption.label}
        main={<AnimatedNumber value={freedShare[12] * 100} format={(n) => `${Math.round(n)}%`} />}
        sub={D.kpi.adoption.sub(formatNumber(result.inputs.headcount))}
        spark={freedShare}
      />
      <Kpi
        label={D.kpi.training.label}
        main={<AnimatedNumber value={roundAbout(h.trainingHours)} format={(n) => formatNumber(n)} />}
        unit={D.kpi.training.unit}
        sub={D.kpi.training.sub(formatMoney(h.trainingValue, currency))}
        spark={training}
      />
    </div>
  )
}

function Kpi({
  label,
  main,
  unit,
  range,
  rangeText,
  sub,
  featured,
  gauge,
  spark,
}: {
  label: string
  main: ReactNode
  unit?: string
  range?: Range
  rangeText?: string
  sub: string
  featured?: boolean
  gauge?: number
  spark?: number[]
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 md:p-5 ${featured ? 'border-[rgba(22,163,74,0.28)] bg-[linear-gradient(160deg,rgba(22,163,74,0.07),rgba(45,212,191,0.04)_60%,transparent)]' : 'border-line-subtle bg-surface-base'}`}
    >
      <p className="type-xs font-medium text-ink-tertiary">{label}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-display type-2xl font-semibold tracking-tight text-ink tabular-nums">{main}</span>
        {unit && !featured && <span className="type-xs font-medium text-ink-tertiary">{unit}</span>}
      </p>
      {unit && featured && <p className="type-xs font-semibold text-[#15803d]">{unit}</p>}
      {range && rangeText && (
        <div className="mt-2">
          <RangeBar range={range} color={featured ? CAPACITY_GREEN : '#334155'} />
          <p className="mt-1 type-xs tabular-nums text-ink-secondary">
            {D.kpi.range} {rangeText}
          </p>
        </div>
      )}
      {gauge !== undefined && <Gauge share={gauge} />}
      {spark && <Spark values={spark} />}
      <p className="mt-2 type-xs leading-relaxed text-ink-tertiary">{sub}</p>
    </div>
  )
}

/** Low-to-high span on a hairline with the central value marked. */
function RangeBar({ range, color }: { range: Range; color: string }) {
  const span = Math.max(1e-9, range.high - range.low)
  const mid = ((range.central - range.low) / span) * 100
  return (
    <div className="relative h-3" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, ${color}22, ${color}55)` }} />
      <motion.span
        className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full"
        style={{ background: color }}
        initial={false}
        animate={{ left: `calc(${mid}% - 2px)` }}
        transition={{ duration: 0.6, ease: EASE }}
      />
    </div>
  )
}

/** Share of the ceiling that seats and usage use, as a thin arc. */
function Gauge({ share }: { share: number }) {
  const r = 16
  const len = Math.PI * r
  return (
    <svg width="44" height="26" viewBox="0 0 44 26" className="absolute right-4 top-4" aria-hidden>
      <path d="M6 22 A16 16 0 0 1 38 22" fill="none" stroke="rgba(15,15,17,0.08)" strokeWidth="4" strokeLinecap="round" />
      <motion.path
        d="M6 22 A16 16 0 0 1 38 22"
        fill="none"
        stroke="#334155"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={len}
        initial={false}
        animate={{ strokeDashoffset: len * (1 - share) }}
        transition={{ duration: 0.7, ease: EASE }}
      />
    </svg>
  )
}

/** Adoption over 24 months. */
function Spark({ values }: { values: number[] }) {
  const w = 120
  const h = 26
  const max = Math.max(...values, 1e-9)
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join('')
  const at12 = (12 / (values.length - 1)) * w
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-2" aria-hidden>
      <motion.path d={d} fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" initial={false} animate={{ d }} transition={{ duration: 0.6, ease: EASE }} />
      <line x1={at12} x2={at12} y1={2} y2={h} stroke="rgba(15,15,17,0.18)" strokeDasharray="2 2" />
    </svg>
  )
}

function EfficiencyKpi({ result, currency }: { result: SimulatorResult; currency: Currency }) {
  const h = result.headline
  return (
    <div className="text-left md:text-right">
      <p className="type-xs font-medium text-ink-tertiary">{D.efficiency.kpiLabel}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5 md:justify-end">
        <span className="font-display type-3xl font-semibold tracking-tight tabular-nums text-ink">
          <AnimatedNumber value={h.hoursFreed.central} format={aboutFmt} />
        </span>
        <span className="type-sm font-medium text-[#15803d]">{D.efficiency.kpiUnit}</span>
      </p>
      <p className="type-xs tabular-nums text-ink-secondary">
        {D.kpi.range} {formatRange(h.hoursFreed)} · {formatMoneyRange(h.capacityValue, currency)} {D.departments.perMonth}
      </p>
    </div>
  )
}

function AssessmentCta({ href }: { href: string }) {
  const scene = getImagery(CLOSING_MOCK.sceneId)
  return (
    <ClosingAssessment
      eyebrow={D.assessment.eyebrow}
      title={D.assessment.title}
      body={D.assessment.body}
      primaryCta={{ text: D.assessment.primary, href }}
      secondaryCta={{ text: D.assessment.secondary, href: '/contact' }}
      scene={{ src: scene?.file ?? siteContent("media.c3JjL2NvbXBvbmVudHMvc2ltdWxhdG9yL1Jlc3VsdFZpZXcudHN4OjA", '/assets/imagery/homepage/prism-grid-solar.webp'), alt: '' }}
      screenshot={{ src: CLOSING_MOCK.screenshot.src, alt: D.assessment.screenshotAlt }}
    />
  )
}

function SourcesPanel({ region }: { region: Region }) {
  const s = D.sources
  const [open, setOpen] = useState(false)
  const pay = HOURLY_COST_SOURCES[region]
  const deptParam = region === 'us' ? DEPARTMENT_PAY.us : DEPARTMENT_PAY.uk
  const dept = 'source' in deptParam ? { source: deptParam.source, note: deptParam.note ?? '' } : null
  return (
    <section id="sim-sources" className={`${panel} scroll-mt-28 p-5 md:p-8`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full flex-col items-start justify-between gap-3 text-left sm:flex-row sm:items-center sm:gap-6">
        <span>
          <span className="block font-display type-xl font-semibold tracking-tight text-ink">{s.heading}</span>
          <span className="mt-1 block type-sm text-ink-secondary">{s.nationalLine}</span>
        </span>
        <span className="inline-flex flex-none items-center gap-1.5 type-xs font-medium text-brand-violet-strong">
          {open ? s.close : s.open}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="mt-6 space-y-8">
          <p className="max-w-3xl type-sm leading-relaxed text-ink-secondary">{s.body}</p>
          <div>
            <p className="type-sm font-semibold text-ink">
              {s.evidence} <span className="font-normal text-ink-tertiary">{s.readOn(BENCHMARKS_READ_ON)}</span>
            </p>
            <ul className="mt-3 grid gap-x-8 md:grid-cols-2">
              {EVIDENCE.map((row) => (
                <li key={row.id} className="border-t border-line-subtle py-3">
                  <p className="type-sm font-medium text-ink">{row.function}</p>
                  <p className="mt-1 type-xs text-ink-secondary">
                    {row.effect}. {row.setting}. {row.caveat}.
                  </p>
                  <a href={row.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 type-xs text-brand-violet-strong hover:underline">
                    {row.citation}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="type-sm font-semibold text-ink">{s.pay}</p>
            <p className="mt-2 type-xs text-ink-secondary">
              <a href={pay.url} target="_blank" rel="noopener noreferrer" className="text-brand-violet-strong hover:underline">
                {pay.label}
              </a>
              . {pay.period}. {pay.measure}
            </p>
            {dept && (
              <p className="mt-2 type-xs text-ink-secondary">
                <a href={dept.source.url} target="_blank" rel="noopener noreferrer" className="text-brand-violet-strong hover:underline">
                  {dept.source.label}
                </a>
                . {dept.note}
              </p>
            )}
          </div>
          <div>
            <p className="type-sm font-semibold text-ink">{s.illustrations}</p>
            <ul className="mt-2 space-y-1.5">
              {ILLUSTRATIONS.map((i) => (
                <li key={i.id} className="type-xs text-ink-secondary">
                  {i.text}. <span className="text-ink-tertiary">{s.selfReported}: {i.status}.</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="type-sm font-semibold text-ink">
              {s.prices} <span className="font-normal text-ink-tertiary">{s.readOn(PRICES_READ_ON)}</span>
            </p>
            <ul className="mt-2 divide-y divide-line-subtle border-t border-line-subtle type-xs">
              {(Object.keys(TOKEN_PRICES) as (keyof typeof TOKEN_PRICES)[]).map((p) => (
                <li key={p} className="grid gap-1 py-2.5 md:grid-cols-[9rem_1fr_1.2fr_auto] md:gap-4">
                  <span className="flex items-center gap-1.5 font-medium text-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <PublicDemoImg src={SIM_PROVIDER_LOGOS[p].src} alt="" width={14} height={14} className={`h-3.5 w-3.5 ${SIM_PROVIDER_LOGOS[p].mono ? 'logo-mono' : ''}`} />
                    {SIM_PROVIDER_LABELS[p]}
                  </span>
                  <span className="text-ink-secondary">{SEAT_PRICES[p].usd > 0 ? s.seat(SEAT_PRICES[p].plan, SEAT_PRICES[p].usd) : `${SEAT_PRICES[p].plan}: ${SEAT_PRICES[p].note}`}</span>
                  <span className="text-ink-secondary tabular-nums">{TOKEN_PRICES[p].map((t) => `${t.model} $${t.input} / $${t.output}`).join(', ')}</span>
                  <a href={TOKEN_PRICES[p][0].source.url} target="_blank" rel="noopener noreferrer" className="text-brand-violet-strong hover:underline">
                    {s.link}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 type-xs text-ink-tertiary">{s.tokenUnit}</p>
          </div>
          <div>
            <p className="type-sm font-semibold text-ink">
              {s.tools} <span className="font-normal text-ink-tertiary">{s.readOn(TOOLING_READ_ON)}</span>
            </p>
            <ul className="mt-2 divide-y divide-line-subtle border-t border-line-subtle type-xs">
              {TOOL_IDS.map((id) => (
                <li key={id} className="grid gap-1 py-2.5 md:grid-cols-[11rem_1fr_1fr_auto] md:gap-4">
                  <span className="font-medium text-ink">{TOOLING[id].label}</span>
                  <span className="text-ink-secondary">{TOOLING[id].examples}</span>
                  <span className="tabular-nums text-ink-secondary">{s.toolRange(formatMoney(TOOLING[id].monthly.optimistic, 'USD'), formatMoney(TOOLING[id].monthly.conservative, 'USD'))}</span>
                  <a href={TOOLING[id].source.url} target="_blank" rel="noopener noreferrer" className="text-brand-violet-strong hover:underline">
                    {s.link}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 type-xs text-ink-tertiary">{s.toolsNote(TOOLING_READ_ON)}</p>
          </div>
        </div>
      )}
    </section>
  )
}

