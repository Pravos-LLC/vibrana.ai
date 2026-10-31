'use client'
import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BRIEF_CONTENT } from '@/src/sprint-brief-content'
import { FIT, SPRINT_FLOW as C } from '@/src/sprint-fit-content'
import { EMPTY_FIT, FIT_VERSION, fitAnswersSchema, fitBriefText, fitStepError, type FitAnswers } from '@/src/lib/sprint-fit'
import { EMPTY_BUSINESS_CASE, calculateBusinessCase, inferWebsiteFromEmail, type BusinessCaseInputs, type CompanyContext, type SprintBrief } from '@/src/lib/sprint-brief'
import type { ProfileResponse } from '@/src/lib/simulator/api'
import type { SectorId } from '@/src/lib/simulator/types'
import { SIM_SECTOR_LABELS } from '@/src/simulator-content'
import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client'
import { trackFunnel } from '@/src/lib/funnel/client'
import { Navigation } from '@/src/components/Navigation'
import { Footer } from '@/src/sections/Footer'
import { Button } from '@/src/components/prism/Button'
import { answeredFitRows, Choices, FitQuestion } from './FitPanels'
import { SprintBriefView } from './SprintBriefView'
import styles from './fit.module.css'
const STORAGE = 'vibrana-sprint-fit-v2'
const INITIAL_COMPANY: CompanyContext = { name: '', website: '', description: '', sector: 'other', confirmed: false }
const LEGACY_STEPS: Record<number, number> = { 0: 0, 2: 1, 3: 2, 4: 3, 5: 4 }
type Contact = { name: string; email: string; role: string }
type ProfileState = 'idle' | 'loading' | 'ready' | 'manual'
export function SprintFitCheck() {
  const [answers, setAnswers] = useState<FitAnswers>(EMPTY_FIT)
  const [contact, setContact] = useState<Contact>({ name: '', email: '', role: '' })
  const [company, setCompany] = useState<CompanyContext>(INITIAL_COMPANY)
  const [businessCase, setBusinessCase] = useState<BusinessCaseInputs>(EMPTY_BUSINESS_CASE)
  const [noWebsite, setNoWebsite] = useState(false)
  const [step, setStep] = useState(0)
  const [brief, setBrief] = useState<SprintBrief | null>(null)
  const [emailDelivered, setEmailDelivered] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [restored, setRestored] = useState(false)
  const [profileLogo, setProfileLogo] = useState<string | null>(null)
  const [profileState, setProfileState] = useState<ProfileState>('idle')
  const heading = useRef<HTMLHeadingElement>(null)
  const profileRequest = useRef(0)
  const websiteEdited = useRef(false)
  const started = useRef(false)
  const submissionId = useRef('')
  const attemptedFingerprint = useRef('')
  const savedPayload = useRef<Record<string, unknown> | null>(null)
  const guard = useFormGuard({ turnstile: true })
  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE) || 'null')
      const parsed = fitAnswersSchema.safeParse(stored?.answers)
      if (stored?.version === FIT_VERSION && stored.expires > Date.now() && parsed.success) setAnswers(parsed.data)
      else sessionStorage.removeItem(STORAGE)
      sessionStorage.removeItem('vibrana-sprint-fit-v1')
    } catch { /* Storage is optional. */ }
    submissionId.current = crypto.randomUUID()
    setRestored(true)
    trackFunnel('fit_view', { version: FIT_VERSION }, 'sprint')
  }, [])
  useEffect(() => {
    if (!restored) return
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ version: FIT_VERSION, expires: Date.now() + 86400000, answers })) } catch { /* Storage is optional. */ }
  }, [answers, restored])
  function change(key: keyof FitAnswers, value: string | boolean) {
    if (answers[key] === value) return
    if (!started.current) { started.current = true; trackFunnel('fit_start', { version: FIT_VERSION }, 'sprint') }
    setAnswers(a => ({ ...a, [key]: value, ...(key === 'metric' ? { baseline: '', target: '' } : {}) }))
    if (key === 'metric') setBusinessCase(EMPTY_BUSINESS_CASE)
    setError('')
  }
  function updateCompany(patch: Partial<CompanyContext>) {
    setCompany(c => ({ ...c, ...patch, confirmed: false }))
    if ('website' in patch) { profileRequest.current++; setProfileState('idle'); setProfileLogo(null) }
    else if ('description' in patch || 'sector' in patch) { profileRequest.current++; setProfileState('manual') }
    setError('')
  }
  function move(next: number) {
    setStep(next); setError(''); setNotice('')
    requestAnimationFrame(() => heading.current?.focus())
  }
  async function research() {
    const request = ++profileRequest.current
    if (noWebsite || !company.website.trim()) { setProfileState('manual'); return }
    setProfileState('loading')
    try {
      await guard.turnstile.ready()
      const response = await fetch('/api/sprint-fit/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: company.website, ...guard.payload() }) })
      const data: ProfileResponse & { researchedAt?: string } = await response.json()
      if (request !== profileRequest.current) return
      if (!response.ok || !data.ok) { setProfileState('manual'); return }
      const p = data.profile
      setCompany(c => ({ ...c, description: c.description || p.summary || '', sector: p.sector, profileDomain: p.domain, researchedAt: p.researchedAt || data.researchedAt, confirmed: false }))
      setProfileLogo(p.logoUrl)
      setProfileState('ready')
    } catch { if (request === profileRequest.current) setProfileState('manual') } finally { guard.turnstile.refresh() }
  }
  function contactError() {
    if (!contact.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) || !contact.role.trim() || !company.name.trim()) return C.errors.contact
    if (!noWebsite) {
      try { const url = new URL(/^https?:\/\//i.test(company.website) ? company.website : `https://${company.website}`); if (!company.website.trim() || !url.hostname.includes('.') || url.username || url.password || !['https:', 'http:'].includes(url.protocol)) return C.errors.website } catch { return C.errors.website }
    }
    return ''
  }
  function stepError() {
    if (step === 1) return contactError()
    if (step === 6) return fitStepError(answers, 5) || fitStepError(answers, 6)
    if (step === 4 && Object.entries(businessCase).some(([key, value]) => key !== 'currency' && value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < (key === 'peoplePerTask' ? 1 : 0) || value > (key === 'peoplePerTask' ? 10000 : 1000000)))) return C.errors.numbers
    if (step === 7) return contactError() || (!company.confirmed ? C.errors.company : '')
    return fitStepError(answers, LEGACY_STEPS[step])
  }
  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = stepError()
    if (problem) { setError(problem); return }
    trackFunnel('fit_step_complete', { step, version: FIT_VERSION }, 'sprint')
    if (step === 7) { await submit(); return }
    if (step === 1) void research()
    move(step + 1)
  }
  function reset() {
    profileRequest.current++; setProfileState('idle'); setProfileLogo(null); setAnswers(EMPTY_FIT); setCompany(INITIAL_COMPANY); setContact({ name: '', email: '', role: '' }); setBusinessCase(EMPTY_BUSINESS_CASE); setNoWebsite(false); websiteEdited.current = false; setBrief(null); started.current = false; attemptedFingerprint.current = ''; savedPayload.current = null; submissionId.current = crypto.randomUUID()
    try { sessionStorage.removeItem(STORAGE) } catch { /* Storage is optional. */ }
    move(0)
  }
  async function submit() {
    setSending(true); setError('')
    try {
      await guard.turnstile.ready()
      const fingerprint = JSON.stringify({ answers, contact, company, businessCase, noWebsite })
      if (attemptedFingerprint.current && attemptedFingerprint.current !== fingerprint) submissionId.current = crypto.randomUUID()
      attemptedFingerprint.current = fingerprint
      const params = new URLSearchParams(location.search)
      const attribution = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(k => [k, (params.get(k) || '').slice(0, 200)]))
      const payload = { ...contact, companyName: company.name, companyWebsite: noWebsite ? '' : company.website, track: answers.startingPoint === 'workflow' ? 'workflow' : 'product', desiredOutcome: fitBriefText(answers).slice(0, 4000), fitCheck: answers, briefRequest: { company: { ...company, website: noWebsite ? '' : company.website }, businessCase, submissionId: submissionId.current }, ...attribution, ...guard.payload(), entry: 'sprint' }
      const response = await fetch('/api/sprint-inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok || typeof result.inquiryId !== 'string' || !result.brief) throw new Error(C.errors.save)
      savedPayload.current = payload
      setBrief(result.brief); setEmailDelivered(result.emailDelivered === true)
      trackFunnel('fit_complete', { version: FIT_VERSION }, 'sprint')
      trackFunnel('fit_brief_shared', { version: FIT_VERSION }, 'sprint')
      requestAnimationFrame(() => heading.current?.focus())
    } catch { setError(C.errors.save) } finally { setSending(false); guard.turnstile.refresh() }
  }
  async function resendEmail() {
    if (!savedPayload.current) return
    setSending(true); setNotice('')
    try {
      await guard.turnstile.ready()
      const response = await fetch('/api/sprint-inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...savedPayload.current, ...guard.payload(), resendEmail: true }) })
      const result = await response.json()
      if (!response.ok || typeof result.inquiryId !== 'string' || result.emailDelivered !== true) throw new Error(C.emailRetryFailed)
      setEmailDelivered(true)
    } catch { setNotice(C.emailRetryFailed) } finally { setSending(false); guard.turnstile.refresh() }
  }
  async function download(format: 'html' | 'pdf') {
    if (!brief) return
    setExporting(true); setNotice('')
    try {
      const { sprintBriefHtml, sprintBriefPdf } = await import('@/src/lib/sprint-brief-export')
      const blob = format === 'html' ? new Blob([await sprintBriefHtml(brief)], { type: 'text/html;charset=utf-8' }) : await sprintBriefPdf(brief)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `sprint-brief.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      trackFunnel('fit_brief_download', { version: FIT_VERSION, format }, 'sprint')
    } catch { setNotice(C.exportError) } finally { setExporting(false) }
  }
  const calculation = calculateBusinessCase(businessCase)
  const formatNumber = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
  const formatMoney = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: businessCase.currency, maximumFractionDigits: 0 }).format(value)
  const casePreview = calculation.currentHours !== null || businessCase.softwareCostMonthly !== null ? <section className={styles.casePreview}><h3>{C.businessCase}</h3><dl className={styles.stats}>{calculation.currentHours !== null ? <div><dt>{C.currentHours}</dt><dd>{formatNumber(calculation.currentHours)}</dd></div> : null}{calculation.releasedHours !== null ? <div><dt>{calculation.releasedHours < 0 ? C.additionalHours : C.releasedHours}</dt><dd>{formatNumber(Math.abs(calculation.releasedHours))}</dd></div> : null}{calculation.currentCost !== null ? <div><dt>{C.currentCost}</dt><dd>{formatMoney(calculation.currentCost)}</dd></div> : null}{businessCase.softwareCostMonthly !== null ? <div><dt>{C.softwareCost}</dt><dd>{formatMoney(businessCase.softwareCostMonthly)}</dd></div> : null}</dl><p className={styles.caption}>{BRIEF_CONTENT.capacityNote}</p></section> : null
  const rows = answeredFitRows(answers)
  const summarySteps: Record<string, number> = { [FIT.rows.startingPoint]: 0, [FIT.rows.user]: 2, [FIT.rows.outcome]: 2, [FIT.rows.current]: 3, [FIT.rows.tools]: 3, [FIT.rows.metric]: 4, [FIT.rows.baseline]: 4, [FIT.rows.target]: 4, [FIT.rows.access]: 5, [FIT.rows.owner]: 5, [FIT.rows.participation]: 5, [FIT.rows.review]: 5, [FIT.rows.timing]: 6, [FIT.rows.funding]: 6 }
  const summary = <dl className={styles.summaryList}>{company.name ? <div><dt><button type="button" className={styles.summaryEdit} disabled={sending} onClick={() => move(1)}>{C.companyName}<span aria-hidden> ↗</span></button></dt><dd>{company.name}</dd></div> : null}{rows.map(([label, value]) => <div key={label}><dt><button type="button" disabled={sending} className={styles.summaryEdit} onClick={() => move(summarySteps[label] ?? 0)} aria-label={`${C.edit} ${label}`}>{label}<span aria-hidden> ↗</span></button></dt><dd>{value}</dd></div>)}</dl>
  const numericFields = Object.keys(C.numbers).filter(k => k !== 'currency' && ((answers.metric === 'spend') ? ['softwareCostMonthly'].includes(k) : k !== 'softwareCostMonthly')) as (Exclude<keyof BusinessCaseInputs, 'currency'>)[]
  return <div className={`prism-light ${styles.page}`}>
    <Navigation />
    <main className={styles.main}>
      <Link href="/ai-build-sprint" className={styles.backLink}><span aria-hidden>← </span>{C.back}</Link>
      <header className={styles.intro}><h1>{C.title}</h1></header>
      {brief ? <><h2 className={styles.resultTitle} ref={heading} tabIndex={-1}>{C.created}</h2><div className={styles.resultLayout}><SprintBriefView brief={brief} /><aside className={styles.resultActions}><div className={styles.booking}><img src="/assets/team/john-ellison.webp" width={100} height={100} alt={C.johnAlt} /><h2>{C.john}</h2><p className={styles.caption}>{C.johnRole}</p><p>{C.callHint}</p><Button href={SPRINT_FIT_CALL_URL} showArrow onClick={() => trackFunnel('fit_call_clicked', { version: FIT_VERSION }, 'sprint')}>{C.call}</Button></div><p className={styles.caption} role="status">{emailDelivered ? C.emailSent : C.emailFailed}</p>{!emailDelivered ? <Button variant="secondary" disabled={sending} loading={sending} onClick={resendEmail}>{C.resendEmail}</Button> : null}<div className={styles.downloads}><Button variant="secondary" onClick={() => download('html')} disabled={exporting}>{C.downloadHtml}</Button><Button variant="secondary" onClick={() => download('pdf')} disabled={exporting}>{C.downloadPdf}</Button></div><p className={styles.caption} role="status">{exporting ? C.preparing : notice}</p><button className={styles.textButton} disabled={sending || exporting} onClick={() => { setBrief(null); submissionId.current = crypto.randomUUID(); move(7) }}>{FIT.result.edit}</button></aside></div></> : <div className={`${styles.layout} ${rows.length ? '' : styles.withoutSummary}`}>
      <form className={styles.question} onSubmit={advance} noValidate>
        <fieldset disabled={!restored || sending} className={styles.formFields} aria-describedby={error ? 'fit-error' : undefined}>
          <div className={styles.progress} aria-label={`${FIT.step} ${step + 1} ${FIT.of} ${C.flow.length}`}>{C.flow.map((s, i) => <span key={s} className={i <= step ? styles.complete : ''} />)}</div>
          <p className={styles.stepLabel}>{FIT.step} {step + 1} {FIT.of} {C.flow.length}<span aria-hidden> · </span>{C.flow[step]}</p>
          {rows.length ? <details className={styles.mobileSummary}><summary>{C.summary}<span>{rows.length} {C.summaryCount}</span></summary>{summary}</details> : null}
          <h2 ref={heading} tabIndex={-1}>{C.headings[step]}</h2>
          <div key={step} className={styles.enter}>
            {step === 0 || step === 2 || step === 5 ? <FitQuestion step={LEGACY_STEPS[step]} answers={answers} onChange={change} /> : null}
            {step === 1 ? <><div className={styles.fieldGrid}>{(['name', 'email', 'role'] as const).map(key => <label key={key} className={styles.field}>{key === 'role' ? C.role : FIT.labels[key]}<input name={key} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'role' ? 'organization-title' : key} required maxLength={key === 'email' ? 255 : 120} value={contact[key]} onChange={e => setContact(c => ({ ...c, [key]: e.target.value }))} onBlur={key === 'email' ? () => { if (!websiteEdited.current && !noWebsite) updateCompany({ website: inferWebsiteFromEmail(contact.email) }) } : undefined} /></label>)}<label className={styles.field}>{C.companyName}<input autoComplete="organization" required maxLength={160} value={company.name} onChange={e => updateCompany({ name: e.target.value })} /></label></div><label className={styles.field}>{C.website}<input type="text" inputMode="url" autoComplete="url" maxLength={500} disabled={noWebsite} value={company.website} onChange={e => { websiteEdited.current = true; updateCompany({ website: e.target.value, profileDomain: undefined, researchedAt: undefined, description: '' }) }} /></label><label className={styles.checkbox}><input type="checkbox" checked={noWebsite} onChange={e => { setNoWebsite(e.target.checked); updateCompany({ website: '', profileDomain: undefined, researchedAt: undefined, description: '' }) }} />{C.noWebsite}</label><p className={styles.caption}>{C.profileNotice}</p></> : null}
            {step === 3 ? <><label className={styles.field}>{FIT.labels.current}<textarea value={answers.current} maxLength={1200} rows={4} onChange={e => change('current', e.target.value)} /></label><label className={styles.checkbox}><input type="checkbox" checked={answers.current === C.notBuilt} onChange={e => change('current', e.target.checked ? C.notBuilt : '')} />{C.noBuild}</label><label className={styles.field}>{FIT.labels.tools}<input value={answers.tools} maxLength={1200} onChange={e => change('tools', e.target.value)} /></label></> : null}
            {step === 4 ? <><Choices label={C.headings[4]} options={FIT.metrics} value={answers.metric} onChange={v => change('metric', v)} />{answers.metric && answers.metric !== 'unknown' ? <details className={styles.numbers}><summary>{C.addNumbers}<span>{C.numbersOptional}</span></summary>{answers.metric === 'time' || answers.metric === 'capacity' || answers.metric === 'spend' ? <><p className={styles.caption}>{C.volumeHint}</p><div className={styles.fieldGrid}>{numericFields.map(key => <label className={styles.field} key={key}>{C.numbers[key]}<input type="number" min={key === 'peoplePerTask' ? 1 : 0} max={key === 'peoplePerTask' ? 10000 : 1000000} step="any" value={businessCase[key] ?? ''} onChange={e => setBusinessCase(b => ({ ...b, [key]: e.target.value === '' ? null : Number(e.target.value) }))} /></label>)}<label className={styles.field}>{C.numbers.currency}<select value={businessCase.currency} onChange={e => setBusinessCase(b => ({ ...b, currency: e.target.value as BusinessCaseInputs['currency'] }))}>{['GBP', 'EUR', 'USD'].map(v => <option key={v} value={v}>{v}</option>)}</select></label></div>{casePreview}</> : <><label className={styles.field}>{FIT.labels.baseline}<input maxLength={1200} value={answers.baseline} onChange={e => change('baseline', e.target.value)} /></label><label className={styles.field}>{FIT.labels.target}<input maxLength={1200} value={answers.target} onChange={e => change('target', e.target.value)} /></label></>}</details> : null}</> : null}
            {step === 6 ? <><fieldset className={styles.choiceGroup}><legend>{FIT.labels.timing}</legend><Choices options={FIT.timing} value={answers.timing} onChange={v => change('timing', v)} /></fieldset><fieldset className={styles.choiceGroup}><legend>{FIT.labels.funding}</legend><Choices options={FIT.funding} value={answers.funding} onChange={v => change('funding', v)} /></fieldset></> : null}
            {step === 7 ? <><div className={styles.contextCard}>{profileLogo || company.website ? <div className={styles.reviewIdentity}>{profileLogo ? <img src={profileLogo} alt="" width={48} height={48} onError={e => { e.currentTarget.hidden = true }} /> : null}<span>{company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></div> : null}<p className={styles.caption} role="status">{profileState === 'loading' ? C.researching : profileState === 'ready' ? C.researchReady : C.researchManual}</p><label className={styles.field}>{C.companyName}<input value={company.name} maxLength={160} required onChange={e => updateCompany({ name: e.target.value })} /></label><label className={styles.field}>{C.companyDescription}<textarea value={company.description} rows={3} maxLength={1200} onChange={e => updateCompany({ description: e.target.value })} /></label><label className={styles.field}>{C.industry}<select value={company.sector} onChange={e => updateCompany({ sector: e.target.value as SectorId })}>{Object.entries(SIM_SECTOR_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className={styles.checkbox}><input type="checkbox" checked={company.confirmed} onChange={e => setCompany(c => ({ ...c, confirmed: e.target.checked }))} />{C.confirmCompany}</label></div><div className={styles.reviewScope}><h3>{C.proposedScope}</h3><p>{answers.outcome || C.reviewHelp}</p><button type="button" className={styles.textButton} onClick={() => move(2)}>{C.edit}</button></div>{casePreview}<div className={styles.reviewRows}>{summary}</div></> : null}
          </div>
          <FormGuardFields guard={guard} />
          {error ? <p id="fit-error" role="alert" className={styles.error}>{error}</p> : null}
          <div className={styles.navigation}>{step > 0 ? <button type="button" className={styles.textButton} onClick={() => move(step - 1)}>{FIT.previous}</button> : <span />}<Button type="submit" loading={sending} showArrow>{step === C.flow.length - 1 ? FIT.finish : FIT.next}</Button></div>
        </fieldset>
      </form>
      {rows.length ? <aside className={styles.liveBrief}><h2>{C.summary}</h2>{summary}<button type="button" className={styles.textButton} disabled={sending} onClick={() => move(0)}>{C.edit}</button></aside> : null}
      </div>}
      <div className={styles.localFooter}><p>{FIT.privacy}</p><button className={styles.textButton} disabled={sending || exporting} onClick={reset}>{FIT.reset}</button></div>
    {brief ? <FormGuardFields guard={guard} /> : null}</main><Footer />
  </div>
}
