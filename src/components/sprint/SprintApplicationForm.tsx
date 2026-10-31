'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { currentEntry, trackCallClick, trackFunnel } from '@/src/lib/funnel/client'
import { Button, Field, Input, Select } from '@/src/components/prism'
import { SPRINT_FIT_CALL_URL, SPRINT_FORM } from '@/src/ai-build-sprint-content'
import { isSprintTrackId, type SprintTrackId } from '@/src/lib/sprint-tracks'
import { useFormGuard } from '@/lib/form-guard/client'

/** The short sprint fit-call form. Posts to /api/sprint-inquiries (same route, table and emails as the old application). */
interface FitCallFormState {
  name: string
  email: string
  companyName: string
  track: SprintTrackId | ''
  desiredOutcome: string
  botField: string
}

const INITIAL: FitCallFormState = {
  name: '',
  email: '',
  companyName: '',
  track: '',
  desiredOutcome: '',
  botField: '',
}

const TRACK_OPTIONS = [{ value: '', label: SPRINT_FORM.trackPlaceholder }, ...SPRINT_FORM.trackOptions]

export function SprintApplicationForm() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState<FitCallFormState>(INITIAL)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const guard = useFormGuard()

  const attribution = useMemo(() => ({
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || '',
    utm_content: searchParams.get('utm_content') || '',
    referrer: typeof document === 'undefined' ? '' : document.referrer,
  }), [searchParams])

  useEffect(() => {
    const requestedTrack = searchParams.get('track')
    if (isSprintTrackId(requestedTrack)) {
      setForm((current) => ({ ...current, track: requestedTrack }))
    }
  }, [searchParams])

  const update = <K extends keyof FitCallFormState>(key: K, value: FitCallFormState[K]) => {
    if (!started) {
      setStarted(true)
      trackFunnel('sprint_form_start')
    }
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.includes('@') || !form.companyName.trim()) {
      setError(SPRINT_FORM.errors.contact)
      return
    }
    if (!form.track) {
      setError(SPRINT_FORM.errors.track)
      return
    }
    if (form.desiredOutcome.trim().length < 10) {
      setError(SPRINT_FORM.errors.outcome)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/sprint-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...attribution, entry: currentEntry(), ...guard.payload() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || SPRINT_FORM.errors.fallback)

      trackFunnel('sprint_form_complete', { track: form.track })
      trackCallClick('sprint-form-submit')
      // The button promises a call, so the next screen is the calendar itself.
      window.location.assign(SPRINT_FIT_CALL_URL)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : SPRINT_FORM.errors.fallback)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} aria-labelledby="fit-call-form-heading" className="rounded-2xl border border-line-subtle bg-surface-base p-6 shadow-[0_2px_24px_rgba(124,58,237,0.07)] md:p-8" noValidate>
      <h3 id="fit-call-form-heading" className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink">{SPRINT_FORM.heading}</h3>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label={SPRINT_FORM.labels.name} htmlFor="sprint-name" required>
          <Input id="sprint-name" autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} />
        </Field>
        <Field label={SPRINT_FORM.labels.email} htmlFor="sprint-email" required>
          <Input id="sprint-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={form.email} onChange={(event) => update('email', event.target.value)} />
        </Field>
        <Field label={SPRINT_FORM.labels.company} htmlFor="sprint-company" required>
          <Input id="sprint-company" autoComplete="organization" value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
        </Field>
        <Field label={SPRINT_FORM.labels.track} htmlFor="sprint-track" required>
          <Select
            id="sprint-track"
            value={form.track}
            options={TRACK_OPTIONS}
            onChange={(event) => {
              const value = event.target.value
              update('track', isSprintTrackId(value) ? value : '')
              if (isSprintTrackId(value)) trackFunnel('sprint_track_selected', { track: value })
            }}
          />
        </Field>
        <Field label={SPRINT_FORM.labels.outcome} htmlFor="sprint-outcome" required hint={SPRINT_FORM.outcomeHint} className="sm:col-span-2">
          <Input id="sprint-outcome" maxLength={400} value={form.desiredOutcome} onChange={(event) => update('desiredOutcome', event.target.value)} />
        </Field>
        {/* Honeypot: hidden from people and assistive tech; bots that fill it are rejected by the API. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="sprint-extra">{SPRINT_FORM.honeypotLabel}</label>
          <input id="sprint-extra" name="sprint-extra" tabIndex={-1} autoComplete="off" value={form.botField} onChange={(event) => update('botField', event.target.value)} />
        </div>
      </div>

      {error && <p role="alert" className="mt-5 text-sm text-brand-red-strong">{error}</p>}

      <div className="mt-7">
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">{submitting ? SPRINT_FORM.submitting : SPRINT_FORM.submit}</Button>
        <p className="type-sm mt-3 text-ink-secondary">
          {SPRINT_FORM.footnote} {SPRINT_FORM.directBooking}{' '}
          <a href={SPRINT_FIT_CALL_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackCallClick('sprint-form')} className="rounded font-medium text-brand-violet-strong underline decoration-line-strong underline-offset-4 hover:text-ink">
            {SPRINT_FORM.directBookingLink}
          </a>
        </p>
      </div>
    </form>
  )
}
