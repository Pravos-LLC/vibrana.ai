'use client'

import { useState } from 'react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Check, Download, FileText, Link2, PhoneCall } from 'lucide-react'
import { Button } from '@/src/components/prism'
import { FormGuardFields, type FormGuard } from '@/lib/form-guard/client'
import type { CompanyProfile, CreateRunResponse, SimulatorLeadFields } from '@/src/lib/simulator/api'
import type { SimulatorResult } from '@/src/lib/simulator/types'
import { leadTeamSize } from '@/src/lib/simulator/format'
import { SIM_LEAD, SIM_SECTOR_LABELS, SIM_SHARE } from '@/src/simulator-content'
import { panel } from './ResultView'

const OWNER_KEY = (slug: string) => `vibrana-sim-owner:${slug}`

export function sharePath(slug: string) {
  return `/ai-transformation/simulator/r/${slug}`
}

export function cardPngPath(slug: string) {
  return `${sharePath(slug)}/card`
}

/** Beacon a share (copy or download). Fire and forget. */
function beaconShare(slug: string) {
  try {
    const url = `/api/simulator/runs/${slug}/share`
    if (!navigator.sendBeacon?.(url)) void fetch(url, { method: 'POST', keepalive: true })
  } catch {
    /* analytics only */
  }
}

export type RunHandle = { slug: string; ownerToken: string | null }

/** The readiness assessment, prefilled from this model (team size, sector, website, company). */
export function assessmentHref(result: SimulatorResult, companyName?: string | null): string {
  return `/ai-transformation/assessment?${new URLSearchParams({
    from: 'simulator',
    teamSize: leadTeamSize(result.inputs.headcount),
    sector: SIM_SECTOR_LABELS[result.inputs.sector],
    ...(result.inputs.domain ? { website: `https://${result.inputs.domain}` } : {}),
    ...(companyName?.trim() ? { company: companyName.trim() } : {}),
  }).toString()}`
}

type Props = {
  result: SimulatorResult
  guard: FormGuard
  profile: CompanyProfile | null
  /** Live mode can choose the company name on the card; a shared run already has one. */
  run: RunHandle | null
  onRun: (run: RunHandle | null) => void
  /** The name the card shows, from the cached company profile. */
  companyName: string
}

export function SimulatorActions(props: Props) {
  const { result, guard, profile, run, onRun } = props
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lead, setLead] = useState<'plan' | 'talk' | null>(null)

  async function ensureRun(): Promise<RunHandle | null> {
    if (run) return run
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/simulator/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: result.inputs,
          companyName: props.companyName.trim() || undefined,
          ...guard.payload(),
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as CreateRunResponse
      if (!data.slug) throw new Error('no slug')
      try {
        localStorage.setItem(OWNER_KEY(data.slug), data.ownerToken)
      } catch {
        /* private mode: the token still arrives in the plan email */
      }
      const handle = { slug: data.slug, ownerToken: data.ownerToken }
      onRun(handle)
      return handle
    } catch {
      setError(SIM_SHARE.error)
      return null
    } finally {
      setBusy(false)
    }
  }

  /** One action: make the link if needed, then copy it. */
  async function copyLink() {
    track('simulator_share_clicked')
    const handle = await ensureRun()
    if (!handle) return
    const url = `${window.location.origin}${sharePath(handle.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      /* the link is shown below to copy by hand */
    }
    beaconShare(handle.slug)
  }

  async function downloadCard() {
    const handle = await ensureRun()
    if (!handle) return
    beaconShare(handle.slug)
    const a = document.createElement('a')
    a.href = cardPngPath(handle.slug)
    a.download = ''
    a.click()
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section className={`${panel} p-5 md:p-8`}>
        {lead ? (
          <LeadForm intent={lead} result={result} guard={guard} profile={profile} ensureRun={ensureRun} companyName={props.companyName} onCancel={() => setLead(null)} />
        ) : (
          <div>
            <h2 className="font-display type-xl font-semibold tracking-tight text-ink md:type-2xl">{SIM_LEAD.heading}</h2>
            <p className="mt-1.5 max-w-xl type-sm text-ink-secondary">{SIM_LEAD.sub}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setLead('plan')} icon={FileText}>
                {SIM_LEAD.planCta}
              </Button>
              <Button variant="secondary" onClick={() => setLead('talk')} icon={PhoneCall}>
                {SIM_LEAD.talkCta}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className={`${panel} p-5 md:p-8`}>
        <h2 className="font-display type-lg font-semibold tracking-tight text-ink">{SIM_SHARE.heading}</h2>
        <p className="mt-1.5 type-sm text-ink-secondary">{SIM_SHARE.sub}</p>
        <FormGuardFields guard={guard} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={copyLink} loading={busy} disabled={busy} icon={copied ? Check : Link2}>
            {busy ? SIM_SHARE.copying : copied ? SIM_SHARE.copied : SIM_SHARE.copy}
          </Button>
          <Button variant="secondary" onClick={downloadCard} disabled={busy} icon={Download}>
            {SIM_SHARE.download}
          </Button>
        </div>
        {run && <p className="mt-3 break-all type-xs text-ink-tertiary tabular-nums">{`vibrana.ai${sharePath(run.slug)}`}</p>}
        {error && <p className="field-error mt-2">{error}</p>}
      </section>
    </div>
  )
}

function LeadForm({
  intent,
  result,
  guard,
  profile,
  ensureRun,
  companyName,
  onCancel,
}: {
  intent: 'plan' | 'talk'
  result: SimulatorResult
  guard: FormGuard
  profile: CompanyProfile | null
  ensureRun: () => Promise<RunHandle | null>
  companyName: string
  onCancel: () => void
}) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState(companyName)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setMessage(null)
    const handle = await ensureRun()
    if (!handle) {
      setState('error')
      setMessage(SIM_LEAD.error)
      return
    }
    const extra: SimulatorLeadFields = { source: 'simulator', simulatorRunSlug: handle.slug, intent, ...(note.trim() ? { note: note.trim() } : {}) }
    try {
      const res = await fetch('/api/assessment-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          companyName: company.trim() || undefined,
          teamSize: leadTeamSize(result.inputs.headcount),
          companyInsights: profile,
          ...extra,
          ...guard.payload(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState('error')
        setMessage(typeof data?.error === 'string' ? data.error : SIM_LEAD.error)
        return
      }
      track('simulator_lead_submitted', { intent })
      setState('done')
    } catch {
      setState('error')
      setMessage(SIM_LEAD.error)
    }
  }

  if (state === 'done') {
    return <p className="type-sm font-medium text-ink">{intent === 'plan' ? SIM_LEAD.donePlan(email) : SIM_LEAD.doneTalk(email)}</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="font-display type-xl font-semibold text-ink">{intent === 'plan' ? SIM_LEAD.planTitle : SIM_LEAD.talkTitle}</p>
      {intent === 'talk' && <p className="type-sm text-ink-secondary">{SIM_LEAD.talkIntro}</p>}
      <FormGuardFields guard={guard} />
      <label className="block">
        <span className="field-label">{SIM_LEAD.email}</span>
        <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="field-label">{SIM_LEAD.company}</span>
        <input className="input" maxLength={200} autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
      {intent === 'talk' && (
        <label className="block">
          <span className="field-label">{SIM_LEAD.note}</span>
          <textarea className="input min-h-24" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={state === 'sending'} disabled={state === 'sending'} showArrow>
          {state === 'sending' ? SIM_LEAD.sending : intent === 'plan' ? SIM_LEAD.submitPlan : SIM_LEAD.submitTalk}
        </Button>
        <button type="button" onClick={onCancel} className="type-sm text-ink-secondary hover:text-ink">{SIM_LEAD.cancel}</button>
      </div>
      {message && <p className="field-error">{message}</p>}
      <p className="type-xs text-ink-tertiary">
        {SIM_LEAD.consentBefore}
        <Link href="/privacy" className="underline hover:text-ink">{SIM_LEAD.privacyLink}</Link>
        {SIM_LEAD.consentAfter}
      </p>
    </form>
  )
}
