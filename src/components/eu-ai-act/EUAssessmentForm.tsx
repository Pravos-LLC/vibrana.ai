'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FlowAssessment from '@/src/components/assessment/FlowAssessment'
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client'
import { INQUIRY_OPTIONS } from '@/src/enterprise-content'
import { EU_QUESTIONS, EU_SECTIONS } from '@/src/eu-ai-act-questions-content'
import { EU_FORM as c, EU_RESULTS as R, EU_RESULTS_HREF } from '@/src/eu-ai-act-readiness-content'
import { evaluate } from '@/src/lib/eu-ai-act/engine'
import type { EntryPoint } from '@/src/lib/funnel/entry'
import { currentEntry, trackFunnel } from '@/src/lib/funnel/client'
import { EU_REPORT_STORAGE_KEY } from './storage'

// FlowAssessment takes "dimensions"; the EU sections fit that shape (the weight is unused here).
const SECTIONS = EU_SECTIONS.map((s) => ({ id: s.key, title: s.title, questions: EU_QUESTIONS[s.key], weight: 0 }))
const QUESTION_COUNT = SECTIONS.reduce((n, s) => n + s.questions.length, 0)

const FREE_MAIL = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'gmx']

function companyFromEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain || FREE_MAIL.some((d) => domain.includes(d))) return { name: '', website: '' }
  const base = domain.split('.')[0]
  return { name: base.charAt(0).toUpperCase() + base.slice(1), website: `https://${domain}` }
}

const input =
  'w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-lg text-ink type-sm transition-colors focus:outline-hidden focus:border-brand-violet/50 placeholder:text-ink-tertiary'

export default function EUAssessmentForm() {
  const router = useRouter()
  const guard = useFormGuard()
  const [company, setCompany] = useState({ email: '', name: '', website: '', teamSize: '', revenueBand: '' })
  const [nameEdited, setNameEdited] = useState(false)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef<string | null>(null)
  const entry = useRef<EntryPoint>('direct')
  useEffect(() => {
    entry.current = currentEntry()
  }, [])

  useEffect(() => {
    const derived = companyFromEmail(company.email)
    setCompany((prev) => ({ ...prev, website: derived.website, name: nameEdited ? prev.name : derived.name }))
  }, [company.email, nameEdited])

  const live = useMemo(() => evaluate(answers, company), [answers, company])
  const ready = company.email.includes('@') && company.name.trim() && company.teamSize && company.revenueBand

  const start = () => {
    startedAt.current = new Date().toISOString()
    trackFunnel('eu_ai_act_assessment_start', {}, entry.current)
    fetch('/api/assessment-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: company.email, companyName: company.name, teamSize: company.teamSize, revenueBand: company.revenueBand, source: 'eu-ai-act-assessment', ...guard.payload() }),
    }).catch(() => {})
    setStarted(true)
  }

  const submit = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/eu-ai-act-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: { ...company, website: company.website || `https://${company.email.split('@')[1] ?? ''}` },
          answers,
          startedAt: startedAt.current,
          entryPoint: entry.current,
          ...guard.payload(),
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.profile) throw new Error(result?.error || c.submitError)
      localStorage.setItem(
        EU_REPORT_STORAGE_KEY,
        JSON.stringify({ profile: result.profile, company: { name: company.name, email: company.email }, assessmentId: result.assessmentId, storedAt: Date.now(), entry: entry.current }),
      )
      trackFunnel('eu_ai_act_assessment_complete', { obligations: result.profile.obligations.length }, entry.current)
      router.push(EU_RESULTS_HREF)
    } catch (e) {
      setError(e instanceof Error ? e.message : c.submitError)
      setSubmitting(false)
    }
  }, [answers, company, guard, router])

  if (!started) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex justify-center gap-10 border-b border-line-subtle pb-6">
          <div className="text-center">
            <div className="type-lg font-bold text-ink">{QUESTION_COUNT}</div>
            <div className="type-xs uppercase tracking-wider text-ink-tertiary">{c.questionsLabel}</div>
          </div>
          <div className="text-center">
            <div className="type-lg font-bold text-ink">{SECTIONS.length}</div>
            <div className="type-xs uppercase tracking-wider text-ink-tertiary">{c.sectionsLabel}</div>
          </div>
        </div>
        <div className="relative rounded-xl border border-line-subtle bg-surface-card p-5 md:p-6">
          <FormGuardFields guard={guard} />
          <h2 className="heading-subsection m-0 text-ink">{c.startTitle}</h2>
          <p className="type-sm mt-2 leading-relaxed text-ink-secondary">{c.startIntro}</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="eu-email" className="type-sm mb-2 block font-medium text-ink">{c.workEmail} *</label>
              <input id="eu-email" type="email" className={input} value={company.email} placeholder="you@yourcompany.com" onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="eu-company" className="type-sm mb-2 block font-medium text-ink">{c.company} *</label>
              <input
                id="eu-company"
                type="text"
                className={input}
                value={company.name}
                onChange={(e) => {
                  setNameEdited(true)
                  setCompany((p) => ({ ...p, name: e.target.value }))
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="eu-team" className="type-sm mb-2 block font-medium text-ink">{c.teamSize} *</label>
                <select id="eu-team" className={input} value={company.teamSize} onChange={(e) => setCompany((p) => ({ ...p, teamSize: e.target.value }))}>
                  <option value="" disabled>{c.selectTeamSize}</option>
                  {INQUIRY_OPTIONS.teamSizes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="eu-revenue" className="type-sm mb-2 block font-medium text-ink">{c.revenue} *</label>
                <select id="eu-revenue" className={input} value={company.revenueBand} onChange={(e) => setCompany((p) => ({ ...p, revenueBand: e.target.value }))}>
                  <option value="" disabled>{c.selectRevenue}</option>
                  {INQUIRY_OPTIONS.revenueBands.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
          <p className="type-xs mt-5 leading-relaxed text-ink-tertiary">
            {c.consentBefore}<Link href="/privacy" className="underline hover:text-ink">{c.consentLink}</Link>{c.consentAfter} {c.disclaimer}
          </p>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" onClick={start} disabled={!ready}>{c.start}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 lg:grid-cols-[320px_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-line-subtle bg-surface-card p-5">
          <div className="type-xs font-medium uppercase tracking-wider text-ink-tertiary">{R.eyebrow}</div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink-tertiary">{R.labels.scope}</dt>
              <dd className="font-medium text-ink">{answers.eu_scope === undefined ? '…' : R.scopeLabels[live.scope]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.role}</dt>
              <dd className="font-medium text-ink">{answers.eu_build === undefined ? '…' : R.roleLabels[live.role]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.tier}</dt>
              <dd className="font-medium text-ink">{answers.eu_gen === undefined ? '…' : R.tierLabels[live.riskTier]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.obligations}</dt>
              <dd className="font-medium tabular-nums text-ink">{answers.eu_gen === undefined ? '…' : live.obligations.length}</dd>
            </div>
          </dl>
        </div>
      </aside>
      <div className="rounded-xl border border-line-subtle bg-surface-card p-6 md:p-8">
        <FlowAssessment
          dimensions={SECTIONS}
          answers={answers}
          onAnswer={(id, score) => setAnswers((prev) => ({ ...prev, [id]: score }))}
          onComplete={submit}
          companyInsights={null}
          isAnalyzing={false}
          isSubmitting={submitting}
        />
        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-ink">
            <span>{error}</span>
            <button className="btn-secondary" onClick={submit} disabled={submitting}>{c.retry}</button>
          </div>
        )}
      </div>
    </div>
  )
}
