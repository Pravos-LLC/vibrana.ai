'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { track } from '@vercel/analytics'
import { motion, useReducedMotion } from 'framer-motion'
import { Building2, Check, Globe, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Button, Eyebrow } from '@/src/components/prism'
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client'
import type { CompanyProfile, ProfileResponse } from '@/src/lib/simulator/api'
import { ADOPTION_TARGET_MAX, ADOPTION_TARGET_MIN, paceForTarget, simulate } from '@/src/lib/simulator/engine'
import { REGION_CURRENCY } from '@/src/lib/simulator/assumptions'
import { sectorExample } from '@/src/lib/simulator/sector-examples'
import { DEFAULT_TOOLS, STACK, STACK_IDS, TOOLING, TOOL_IDS, type StackId, type ToolId } from '@/src/lib/simulator/tooling'
import {
  CAPS,
  DATA_RULES,
  PROVIDERS,
  READINESS_DIMENSIONS,
  SECTOR_IDS,
  type AssumptionOverrides,
  type Cap,
  type DataRule,
  type ProviderId,
  type Delivery,
  type ReadinessAnswer,
  type ReadinessDimension,
  type ReadinessInput,
  type Region,
  type SectorId,
  type SimulatorInputs,
} from '@/src/lib/simulator/types'
import { companyName as brandName, displayDomain, formatPercent, regionForIso, regionForLocale, regionForTld, sizeBand } from '@/src/lib/simulator/format'
import {
  SIM_DATA_RULES,
  SIM_DRAWER,
  SIM_INTRO,
  SIM_PACES,
  SIM_PROVIDER_LABELS,
  SIM_ADVANCED,
  SIM_PROVIDER_LOGOS,
  SIM_READINESS,
  SIM_STACK_LABELS,
  SIM_SECTOR_LABELS,
  SIM_STEPS,
} from '@/src/simulator-content'
import { CompanyLogo, ResultView, panel } from './ResultView'
import { SectorLogo } from './SectorLogo'
import { AssumptionsDrawer } from './AssumptionsDrawer'
import { SimulatorActions, assessmentHref, type RunHandle } from './SimulatorActions'
import { SamplePreview } from './SamplePreview'
import { RangeInput } from './RangeInput'

type Step = 'company' | 'reading' | 'profile' | 'setup' | 'result'
const s = SIM_STEPS
const PROFILE_TIMEOUT_MS = 50_000
const DATA_ICON: Record<DataRule, LucideIcon> = { public: Globe, internal: Building2, client: ShieldCheck }

export function SimulatorApp({ landing }: { landing?: ReactNode } = {}) {
  const guard = useFormGuard({ turnstile: true })
  const [step, setStep] = useState<Step>('company')
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [people, setPeople] = useState('')
  const [peopleError, setPeopleError] = useState<string | null>(null)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [domain, setDomain] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [sector, setSector] = useState<SectorId | null>(null)
  const [providers, setProviders] = useState<ProviderId[]>(['anthropic', 'google'])
  const [cap, setCap] = useState<Cap>(50)
  const [dataRule, setDataRule] = useState<DataRule>('internal')
  const [adoptionTarget, setAdoptionTarget] = useState(0.8)
  const [overrides, setOverrides] = useState<AssumptionOverrides>({})
  const [readiness, setReadiness] = useState<ReadinessInput>({})
  const [tools, setTools] = useState<ToolId[]>(DEFAULT_TOOLS)
  const [delivery, setDelivery] = useState<Delivery>('consultant')
  const [stack, setStack] = useState<StackId[]>([])
  const [localeRegion, setLocaleRegion] = useState<Region>('us')
  const [editing, setEditing] = useState(false)
  const [run, setRun] = useState<RunHandle | null>(null)
  const viewed = useRef(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocaleRegion(regionForLocale(navigator.language).region)
  }, [])

  // Region: the company's own country when the homepage says, else its domain, else the visitor's locale.
  const detectedRegion: Region = regionForIso(profile?.hqCountry) ?? regionForTld(domain) ?? localeRegion

  const headcount = Number(people)
  const headcountValid = Number.isInteger(headcount) && headcount >= 5 && headcount <= 100_000

  const inputs: SimulatorInputs | null = useMemo(() => {
    if (!sector || !headcountValid || providers.length === 0) return null
    return {
      domain,
      headcount,
      sector,
      providers,
      cap,
      dataRule,
      pace: paceForTarget(adoptionTarget),
      adoptionTarget,
      classifiedMix: profile && profile.sector === sector ? profile.functionMix : null,
      ...(Object.keys(readiness).length > 0 ? { readiness } : {}),
      tools,
      stack,
      delivery,
      overrides: { region: detectedRegion, ...overrides },
    }
  }, [sector, headcountValid, headcount, providers, cap, dataRule, adoptionTarget, domain, profile, overrides, detectedRegion, readiness, tools, stack, delivery])

  const result = useMemo(() => {
    if (!inputs) return null
    try {
      return simulate(inputs)
    } catch {
      return null
    }
  }, [inputs])

  // A share link is a snapshot: any change after it was made needs a new one.
  const inputsKey = inputs ? JSON.stringify({ ...inputs, overrides: { ...inputs.overrides, newWorkLabel: undefined } }) : ''
  useEffect(() => {
    setRun(null)
  }, [inputsKey])

  useEffect(() => {
    if (step === 'result' && result && !viewed.current) {
      viewed.current = true
      track('simulator_result_viewed', { sector: result.inputs.sector, band: sizeBand(result.inputs.headcount), pace: result.resolved.pace })
    }
    if (step === 'result' || step === 'setup') topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll once per step change
  }, [step])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  /** One call for both paths: the visitor becomes a lead, and a website (if given) gets read. */
  async function submitCompany(e?: React.FormEvent, skipWebsite = false) {
    e?.preventDefault()
    setSubmitError(null)
    let invalid = false
    if (!headcountValid) {
      setPeopleError(s.company.errors.people)
      invalid = true
    }
    if (!emailValid) {
      setEmailError(s.company.errors.email)
      invalid = true
    }
    if (invalid) return
    const site = skipWebsite ? '' : url.trim()
    track('simulator_started', { path: site ? 'website' : 'manual' })
    if (site) setStep('reading')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
    try {
      // The invisible Turnstile check usually finishes in about a second; a quick submit waits for it.
      await guard.turnstile.ready()
      const res = await fetch('/api/simulator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: site, email: email.trim(), headcount, ...guard.payload() }),
        signal: controller.signal,
      })
      if (res.status === 400 || res.status === 429) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        setSubmitError(err?.error ?? s.company.errors.failed)
        setStep('company')
        return
      }
      const data = (await res.json()) as ProfileResponse
      if (data.ok) {
        setProfile(data.profile)
        setDomain(data.profile.domain)
        setSector(data.profile.sector)
        setManual(false)
      } else {
        setProfile(null)
        setDomain(site ? (data.domain ?? displayDomain(site)) : null)
        setManual(true)
      }
    } catch {
      setProfile(null)
      setDomain(site ? displayDomain(site) : null)
      setManual(true)
    } finally {
      clearTimeout(timer)
      guard.turnstile.refresh()
    }
    setStep('profile')
  }

  const setupControls = (
    <SetupControls
      hideSector={step === 'setup'}
      profile={profile}
      domain={domain}
      manual={manual}
      sector={sector}
      onSector={setSector}
      providers={providers}
      onProviders={setProviders}
      cap={cap}
      onCap={setCap}
      dataRule={dataRule}
      onDataRule={setDataRule}
      adoptionTarget={adoptionTarget}
      onAdoptionTarget={setAdoptionTarget}
      readiness={readiness}
      onReadiness={setReadiness}
      tools={tools}
      onTools={setTools}
      stack={stack}
      onStack={setStack}
    />
  )

  const region = inputs?.overrides?.region ?? detectedRegion
  const currency = REGION_CURRENCY[region]
  const shownName = profile?.name || brandName(result?.inputs.domain, profile?.title) || null

  if (step === 'result' && result) {
    return (
      <div ref={topRef} className="scroll-mt-28">
        <ResultView
          result={result}
          currency={currency}
          profile={profile}
          companyName={shownName}
          growthLabel={overrides.newWorkLabel || SIM_DRAWER.newWork.placeholder}
          editing={editing}
          onEdit={() => setEditing((v) => !v)}
          editPanel={setupControls}
          assessmentHref={assessmentHref(result, shownName)}
          onDelivery={setDelivery}
          toolbar={
            <AssumptionsDrawer
              result={result}
              overrides={overrides}
              onChange={setOverrides}
              onReset={() => setOverrides({})}
              classifiedFrom={profile && profile.sector === result.inputs.sector ? profile.domain : null}
            />
          }
          actions={
            <SimulatorActions
              result={result}
              guard={guard}
              profile={profile}
              run={run}
              onRun={setRun}
              companyName={shownName ?? ''}
            />
          }
        />
      </div>
    )
  }

  return (
    <>
    <div ref={topRef} className="grid scroll-mt-28 grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      <div className="min-w-0">
        <Eyebrow gradient="prism">{SIM_INTRO.eyebrow}</Eyebrow>
        <h1 className="mt-4 font-display type-4xl font-semibold leading-[1.05] tracking-tight text-ink">{SIM_INTRO.title}</h1>
        <p className="mt-4 max-w-xl type-lg leading-8 text-ink-secondary">{SIM_INTRO.subtitle}</p>

        <div className="mt-8">
          {(step === 'company' || step === 'reading') && (
            <form onSubmit={(e) => submitCompany(e)} className={`${panel} p-5 md:p-7`} noValidate>
              <FormGuardFields guard={guard} />
              {step === 'reading' ? (
                <Reading domain={displayDomain(url)} />
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                    <label className="block sm:col-span-2">
                      <span className="field-label">{s.company.emailLabel}</span>
                      <input
                        id="sim-email"
                        className="input"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder={s.company.emailPlaceholder}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setEmailError(null)
                        }}
                        aria-invalid={!!emailError}
                      />
                      {emailError ? <span className="field-error">{emailError}</span> : <span className="mt-1.5 block type-xs text-ink-tertiary">{s.company.emailHint}</span>}
                    </label>
                    <label className="block">
                      <span className="field-label">{s.company.urlLabel}</span>
                      <input id="sim-url" className="input" inputMode="url" autoComplete="url" placeholder={s.company.urlPlaceholder} value={url} onChange={(e) => setUrl(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="field-label">{s.company.peopleLabel}</span>
                      <input
                        className="input tabular-nums"
                        inputMode="numeric"
                        placeholder={s.company.peoplePlaceholder}
                        value={people}
                        onChange={(e) => {
                          setPeople(e.target.value.replace(/[^\d]/g, ''))
                          setPeopleError(null)
                        }}
                        aria-invalid={!!peopleError}
                      />
                      {peopleError ? <span className="field-error">{peopleError}</span> : <span className="mt-1.5 block type-xs text-ink-tertiary">{s.company.peopleHint(headcountValid ? sizeBand(headcount) : null)}</span>}
                    </label>
                  </div>
                  <p className="mt-2 type-xs text-ink-tertiary">{s.company.urlHint}</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button type="submit" showArrow>
                      {s.company.submit}
                    </Button>
                    <button type="button" onClick={() => submitCompany(undefined, true)} className="type-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline">
                      {s.company.skip}
                    </button>
                  </div>
                  {submitError && <p className="field-error mt-3">{submitError}</p>}
                </>
              )}
            </form>
          )}

          {step === 'profile' && (
            <CompanyCard
              profile={profile}
              domain={domain}
              sector={sector}
              onSector={setSector}
              onContinue={() => setStep('setup')}
              onBack={() => {
                setProfile(null)
                setStep('company')
              }}
            />
          )}

          {step === 'setup' && (
            <div className={`${panel} p-5 md:p-7`}>
              <p className="font-display type-lg font-semibold text-ink">{s.setup.label}</p>
              <div className="mt-5">{setupControls}</div>
              <div className="mt-7">
                <Button onClick={() => setStep('result')} disabled={!result} showArrow>
                  {s.setup.submit}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-28">
        <SamplePreview />
        <p className="mt-3 type-xs text-ink-tertiary">{SIM_INTRO.sampleCaption}</p>
      </div>
    </div>
    {step === 'company' && landing}
    </>
  )
}

function CompanyCard({
  profile,
  domain,
  sector,
  onSector,
  onContinue,
  onBack,
}: {
  profile: CompanyProfile | null
  domain: string | null
  sector: SectorId | null
  onSector: (s: SectorId) => void
  onContinue: () => void
  onBack: () => void
}) {
  const reduce = useReducedMotion()
  const c = s.profile
  const name = profile?.name ?? brandName(domain ?? profile?.domain, profile?.title) ?? ''
  const choices = profile ? [profile.sector, ...profile.alternatives].slice(0, 3) : []
  const unsure = profile ? profile.confidence < 0.5 : false
  return (
    <motion.div
      className={`${panel} p-5 md:p-7`}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {profile ? (
        <>
          <p className="type-xs font-medium text-ink-tertiary">{c.label}</p>
          <div className="mt-3 flex items-center gap-4">
            <motion.div initial={reduce ? false : { opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <CompanyLogo profile={profile} name={name} size={64} />
            </motion.div>
            <div className="min-w-0">
              <p className="truncate font-display type-2xl font-semibold tracking-tight text-ink">{name}</p>
              <p className="type-xs text-ink-tertiary">{profile.domain}</p>
            </div>
          </div>
          {profile.summary && <p className="mt-4 type-sm leading-relaxed text-ink-secondary">{profile.summary}</p>}
        </>
      ) : (
        <>
          <p className="font-display type-lg font-semibold text-ink">{c.manualTitle}</p>
          <p className="mt-1 type-sm text-ink-secondary">{c.manualNote}</p>
        </>
      )}
      <fieldset className="mt-5">
        <legend className="field-label">{c.sectorLabel}</legend>
        {choices.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {choices.map((id) => (
              <button key={id} type="button" className={chip(sector === id)} onClick={() => onSector(id)} aria-pressed={sector === id}>
                {SIM_SECTOR_LABELS[id]}
                <SectorChipLogo id={id} />
              </button>
            ))}
          </div>
        )}
        <select className="input max-w-md" aria-label={c.sectorLabel} value={sector && !choices.includes(sector) ? sector : ''} onChange={(e) => onSector(e.target.value as SectorId)}>
          <option value="" disabled>
            {choices.length > 0 ? c.other : s.setup.sectorPick}
          </option>
          {SECTOR_IDS.map((id) => (
            <option key={id} value={id}>
              {SIM_SECTOR_LABELS[id]}
            </option>
          ))}
        </select>
        {unsure && <p className="mt-2 type-xs text-ink-tertiary">{s.setup.sectorUnsure(profile!.domain)}</p>}
      </fieldset>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onContinue} disabled={!sector} showArrow>
          {c.continue}
        </Button>
        <button type="button" onClick={onBack} className="type-sm text-ink-secondary underline-offset-4 hover:text-ink hover:underline">
          {c.notYou}
        </button>
      </div>
    </motion.div>
  )
}

/** The reading step. `progress` (0..0.95) drives it from outside, e.g. a motion-studio reel; without it, it runs on its own clock. */
export function Reading({ domain, progress: controlled }: { domain: string; progress?: number }) {
  const [own, setProgress] = useState(0)
  const progress = controlled ?? own
  useEffect(() => {
    if (controlled !== undefined) return
    const start = performance.now()
    let raf = 0
    // Eases toward 95% over about 14 seconds; the response jumps it to the next step.
    const tick = (now: number) => {
      const t = (now - start) / 14_000
      setProgress(0.95 * (1 - Math.exp(-3 * t)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [controlled])
  const active = Math.min(s.reading.lines.length - 1, Math.floor(progress / (0.95 / s.reading.lines.length)))
  return (
    <div aria-live="polite">
      <p className="type-xs font-medium text-ink-tertiary">{s.reading.label}</p>
      <p className="mt-1 font-display type-xl font-semibold text-ink">{domain}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgba(15,15,17,0.06)]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#7c3aed,#3b82f6,#2dd4bf)]" style={{ width: `${progress * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-1.5">
        {s.reading.lines.map((line, i) => (
          <li key={line} className={`flex items-center gap-2 type-sm transition-colors ${i < active ? 'text-ink-secondary' : i === active ? 'text-ink' : 'text-ink-tertiary'}`}>
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${i < active ? 'bg-[rgba(124,58,237,0.12)]' : ''}`}>
              {i < active ? <Check className="h-3 w-3 text-brand-violet-strong" aria-hidden /> : <span className={`h-1.5 w-1.5 rounded-full ${i === active ? 'animate-pulse bg-brand-violet' : 'bg-[rgba(15,15,17,0.2)]'}`} />}
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p className="mt-3 type-xs text-ink-tertiary">{s.reading.note}</p>
    </div>
  )
}

type SetupProps = {
  /** The sector was picked on the company card, so the setup step leaves it out. */
  hideSector?: boolean
  profile: CompanyProfile | null
  domain: string | null
  manual: boolean
  sector: SectorId | null
  onSector: (s: SectorId) => void
  providers: ProviderId[]
  onProviders: (p: ProviderId[]) => void
  cap: Cap
  onCap: (c: Cap) => void
  dataRule: DataRule
  onDataRule: (d: DataRule) => void
  adoptionTarget: number
  onAdoptionTarget: (v: number) => void
  readiness: ReadinessInput
  onReadiness: (r: ReadinessInput) => void
  tools: ToolId[]
  onTools: (t: ToolId[]) => void
  stack: StackId[]
  onStack: (s: StackId[]) => void
}

/** The example company for a sector, as a small mark at the end of its chip. */
function SectorChipLogo({ id }: { id: SectorId }) {
  const ex = sectorExample(id)
  return ex?.logo ? (
    <span className="border-l border-line-subtle pl-2 opacity-80">
      <SectorLogo example={ex} className="h-3.5" />
    </span>
  ) : null
}

const chip = (on: boolean) =>
  `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 type-sm transition-[border-color,background-color,transform] active:scale-[0.97] ${
    on ? 'border-brand-violet bg-[rgba(124,58,237,0.07)] text-ink' : 'border-line text-ink-secondary hover:border-line-strong hover:text-ink'
  }`

export function SetupControls(p: SetupProps) {
  const reduce = useReducedMotion()
  const unsure = p.profile && p.profile.confidence < 0.5
  const top3 = p.profile ? [p.profile.sector, ...p.profile.alternatives].slice(0, 3) : []
  const sectorNote = p.profile ? (unsure ? s.setup.sectorUnsure(p.profile.domain) : s.setup.sectorFound(p.profile.domain)) : p.manual && p.domain ? s.setup.sectorManual : s.setup.sectorPick
  const capIndex = CAPS.indexOf(p.cap)
  const pct = Math.round(p.adoptionTarget * 100)
  const lo = Math.round(ADOPTION_TARGET_MIN * 100)
  const hi = Math.round(ADOPTION_TARGET_MAX * 100)

  return (
    <div className="grid gap-7 md:grid-cols-2">
      <fieldset className="md:col-span-2" hidden={p.hideSector}>
        <legend className="field-label">{s.setup.sectorLabel}</legend>
        <p className="mb-2.5 type-xs text-ink-tertiary">{sectorNote}</p>
        {unsure && (
          <div className="mb-3 flex flex-wrap gap-2">
            {top3.map((id) => (
              <button key={id} type="button" className={chip(p.sector === id)} onClick={() => p.onSector(id)} aria-pressed={p.sector === id}>
                {SIM_SECTOR_LABELS[id]}
                <SectorChipLogo id={id} />
              </button>
            ))}
          </div>
        )}
        <select className="input max-w-md" value={p.sector ?? ''} onChange={(e) => p.onSector(e.target.value as SectorId)}>
          <option value="" disabled>
            {s.setup.sectorPick}
          </option>
          {SECTOR_IDS.map((id) => (
            <option key={id} value={id}>
              {SIM_SECTOR_LABELS[id]}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="md:col-span-2">
        <legend className="field-label">{s.setup.providersLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((id) => {
            const on = p.providers.includes(id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                className={chip(on)}
                onClick={() => {
                  const next = on ? p.providers.filter((x) => x !== id) : [...p.providers, id]
                  if (next.length > 0) p.onProviders(next)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <PublicDemoImg src={SIM_PROVIDER_LOGOS[id].src} alt="" width={16} height={16} className={`h-4 w-4 transition-opacity ${SIM_PROVIDER_LOGOS[id].mono ? 'logo-mono' : ''} ${on ? '' : 'opacity-60 grayscale'}`} />
                {SIM_PROVIDER_LABELS[id]}
                {on && <Check className="h-3.5 w-3.5 text-brand-violet-strong" aria-hidden />}
              </button>
            )
          })}
        </div>
        <p className="mt-2 type-xs text-ink-tertiary">{s.setup.providersHint}</p>
      </fieldset>

      <fieldset className="md:col-span-2">
        <legend className="field-label">{s.setup.dataLabel}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {DATA_RULES.map((id) => {
            const Icon = DATA_ICON[id]
            const on = p.dataRule === id
            return (
              <label
                key={id}
                className={`relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 transition-[border-color,background-color] ${on ? 'border-brand-violet bg-[rgba(124,58,237,0.045)]' : 'border-line-subtle hover:border-line'}`}
              >
                <input type="radio" name="sim-data" className="sr-only" checked={on} onChange={() => p.onDataRule(id)} />
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${on ? 'text-brand-violet-strong' : 'text-ink-tertiary'}`} strokeWidth={1.75} aria-hidden />
                  <span className="type-sm font-medium text-ink">{SIM_DATA_RULES[id].label}</span>
                </span>
                <span className="type-xs leading-relaxed text-ink-tertiary">{SIM_DATA_RULES[id].hint}</span>
                {on && (
                  <motion.span layoutId={reduce ? undefined : 'sim-data-check'} className="absolute right-3 top-3 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-violet">
                    <Check className="h-2.5 w-2.5 text-white" aria-hidden />
                  </motion.span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">{s.setup.capLabel}</legend>
        <div className="flex items-baseline justify-between">
          <span className="font-display type-xl font-semibold tabular-nums text-ink">${p.cap}</span>
        </div>
        <RangeInput min={0} max={CAPS.length - 1} step={1} value={capIndex} onChange={(v) => p.onCap(CAPS[v])} label={s.setup.capLabel} valueText={`$${p.cap}`} />
        <div className="mt-0.5 flex justify-between type-xs text-ink-tertiary tabular-nums">
          {CAPS.map((v) => (
            <span key={v} className={v === p.cap ? 'font-semibold text-ink' : undefined}>
              ${v}
            </span>
          ))}
        </div>
        <p className="mt-2 type-xs text-ink-tertiary">{s.setup.capHint}</p>
      </fieldset>

      <fieldset>
        <legend className="field-label">{s.setup.paceLabel}</legend>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display type-xl font-semibold tabular-nums text-ink">{s.setup.paceValue(formatPercent(p.adoptionTarget))}</span>
          <span className="type-xs font-medium text-brand-violet-strong">{SIM_PACES[paceForTarget(p.adoptionTarget)].label}</span>
        </div>
        <RangeInput min={lo} max={hi} step={1} value={pct} onChange={(v) => p.onAdoptionTarget(v / 100)} label={s.setup.paceLabel} valueText={s.setup.paceValue(`${pct}%`)} />
        <div className="relative mt-0.5 h-4 type-xs text-ink-tertiary">
          <span className="absolute left-0">{SIM_PACES.cautious.label}</span>
          <span className="absolute left-1/2 -translate-x-1/2">
            {SIM_PACES.steady.label}
          </span>
          <span className="absolute right-0">{SIM_PACES.ambitious.label}</span>
        </div>
        <p className="mt-2 type-xs text-ink-tertiary">{s.setup.paceHint}</p>
      </fieldset>

      <fieldset className="md:col-span-2">
        <legend className="field-label">{SIM_READINESS.heading}</legend>
        <p className="mb-3 type-xs text-ink-tertiary">{SIM_READINESS.sub}</p>
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
          {READINESS_DIMENSIONS.map((dim) => (
            <ReadinessQuestion key={dim} dim={dim} value={p.readiness[dim]} onChange={(v) => p.onReadiness(withAnswer(p.readiness, dim, v))} />
          ))}
        </div>
      </fieldset>

      <details className="group md:col-span-2 rounded-xl border border-line-subtle p-4 open:bg-surface-raised/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span>
            <span className="field-label !mb-0 block">{SIM_ADVANCED.heading}</span>
            <span className="mt-0.5 block type-xs text-ink-tertiary">{SIM_ADVANCED.sub}</span>
          </span>
          <span aria-hidden className="type-sm text-ink-tertiary transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-5 grid gap-6">
          <fieldset>
            <legend className="field-label">{SIM_ADVANCED.stackLabel}</legend>
            <p className="mb-2.5 type-xs text-ink-tertiary">{SIM_ADVANCED.stackHint}</p>
            <div className="flex flex-wrap gap-2">
              {STACK_IDS.map((id) => {
                const on = p.stack.includes(id)
                const addOn = STACK[id].addOn
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    className={chip(on)}
                    title={addOn ? addOn.plan : undefined}
                    onClick={() => p.onStack(on ? p.stack.filter((x) => x !== id) : [...p.stack, id])}
                  >
                    {SIM_STACK_LABELS[id]}
                    {addOn && <span className="type-xs text-ink-tertiary">{SIM_ADVANCED.stackAddOn(`$${addOn.usd}`, addOn.per)}</span>}
                    {on && <Check className="h-3.5 w-3.5 text-brand-violet-strong" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend className="field-label">{SIM_ADVANCED.buildLabel}</legend>
            <p className="mb-2.5 type-xs text-ink-tertiary">{SIM_ADVANCED.buildHint}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TOOL_IDS.map((id) => {
                const on = p.tools.includes(id)
                const t = TOOLING[id]
                return (
                  <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-[border-color,background-color] ${on ? 'border-brand-violet bg-[rgba(124,58,237,0.045)]' : 'border-line-subtle hover:border-line'}`}>
                    <input type="checkbox" className="mt-1 accent-[#7c3aed]" checked={on} onChange={() => p.onTools(on ? p.tools.filter((x) => x !== id) : [...p.tools, id])} />
                    <span className="min-w-0">
                      <span className="block type-sm font-medium text-ink">{t.label}</span>
                      <span className="block type-xs text-ink-tertiary">
                        {t.examples} · {SIM_ADVANCED.monthly(`$${t.monthly.central.toLocaleString('en-US')}`)}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
      </details>
    </div>
  )
}

function withAnswer(current: ReadinessInput, dim: ReadinessDimension, value: ReadinessAnswer | undefined): ReadinessInput {
  const next = { ...current }
  if (value === undefined) delete next[dim]
  else next[dim] = value
  return next
}

function ReadinessQuestion({ dim, value, onChange }: { dim: ReadinessDimension; value: ReadinessAnswer | undefined; onChange: (v: ReadinessAnswer | undefined) => void }) {
  const q = SIM_READINESS.questions[dim]
  return (
    <label className="block">
      <span className="mb-1.5 block type-sm text-ink">{q.label}</span>
      <select className="input" value={value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? undefined : (Number(e.target.value) as ReadinessAnswer))}>
        <option value="">{SIM_READINESS.notSure}</option>
        {q.options.map((o) => (
          <option key={o.score} value={o.score}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
