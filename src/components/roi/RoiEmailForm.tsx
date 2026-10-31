'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { currentEntry, trackFunnel } from '@/src/lib/funnel/client'
import { Button, Field, Input } from '@/src/components/prism'
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client'
import type { Assumptions, WorkflowInput } from '@/src/lib/roi/calc'
import { ROI_EMAIL } from '@/src/roi-calculator-content'

/** "Email me this": creates a lead (source roi-calculator) and emails the estimate. */
export function RoiEmailForm({ inputs, assumptions, ready }: { inputs: WorkflowInput[]; assumptions: Assumptions; ready: boolean }) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const guard = useFormGuard()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!ready) return setError(ROI_EMAIL.errors.empty)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(ROI_EMAIL.errors.email)
    setStatus('sending')
    setError('')
    try {
      const params = new URLSearchParams(window.location.search)
      const response = await fetch('/api/roi-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          companyName: company,
          ...assumptions,
          workflows: inputs,
          utm_source: params.get('utm_source') || '',
          utm_campaign: params.get('utm_campaign') || '',
          entry: currentEntry(),
          ...guard.payload(),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || ROI_EMAIL.errors.fallback)
      trackFunnel('roi_email_sent', { workflows: inputs.length })
      setStatus('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : ROI_EMAIL.errors.fallback)
      setStatus('idle')
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className="type-sm font-medium text-ink">
        {ROI_EMAIL.done}
      </p>
    )
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="roi-email-heading" className="relative">
      <h3 id="roi-email-heading" className="type-base font-semibold text-ink">{ROI_EMAIL.heading}</h3>
      <p className="type-xs mt-1 text-ink-secondary">{ROI_EMAIL.body}</p>
      <div className="mt-4 space-y-3">
        <Field label={ROI_EMAIL.label} htmlFor="roi-email">
          <Input id="roi-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={ROI_EMAIL.company} htmlFor="roi-company">
          <Input id="roi-company" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
      </div>
      <FormGuardFields guard={guard} />
      {error && (
        <p role="alert" className="mt-3 type-sm text-brand-red-strong">
          {error}
        </p>
      )}
      <Button type="submit" variant="secondary" loading={status === 'sending'} className="mt-4 w-full justify-center">
        {status === 'sending' ? ROI_EMAIL.submitting : ROI_EMAIL.submit}
      </Button>
      <p className="type-xs mt-3 text-ink-secondary">
        {ROI_EMAIL.consentBefore}
        <Link href={ROI_EMAIL.privacyHref} className="underline hover:text-ink">
          {ROI_EMAIL.privacyLink}
        </Link>
        {ROI_EMAIL.consentAfter}
      </p>
    </form>
  )
}
