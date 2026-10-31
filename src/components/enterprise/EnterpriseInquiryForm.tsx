'use client'

import React, { useId, useState } from 'react'
import { FormGuardFields } from '@/lib/form-guard/client'
import { useEnterpriseInquiry, type EnterpriseInquiryInput } from '@/src/hooks/useEnterpriseInquiry'
import { INQUIRY_OPTIONS } from '@/src/enterprise-content'
import { Button, Eyebrow, Field, Input, Select, Textarea } from '@/src/components/prism'

interface EnterpriseInquiryFormProps {
  title?: string
  subtitle?: string
}

const INITIAL_STATE: EnterpriseInquiryInput = {
  intent: INQUIRY_OPTIONS.intents[0],
  contactName: '',
  email: '',
  companyName: '',
  teamSize: INQUIRY_OPTIONS.teamSizes[0],
  revenueBand: INQUIRY_OPTIONS.revenueBands[0],
  departmentFocus: '',
  timeline: INQUIRY_OPTIONS.timelines[0],
  goals: '',
}

const toOptions = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }))

export function EnterpriseInquiryForm({
  title = 'Start the conversation',
  subtitle = 'Tell us where your organization is today and what kind of transformation you want to lead.',
}: EnterpriseInquiryFormProps) {
  const { guard, submitInquiry, isSubmitting, isSubmitted, error, message, reset } = useEnterpriseInquiry()
  const [form, setForm] = useState<EnterpriseInquiryInput>(INITIAL_STATE)
  const idPrefix = useId()
  const fieldId = (field: keyof EnterpriseInquiryInput) => `${idPrefix}-${field}`

  const updateField = (field: keyof EnterpriseInquiryInput, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const success = await submitInquiry(form)
    if (success) setForm(INITIAL_STATE)
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-frost p-8 backdrop-blur-md md:p-10"
    >
      {/* Top prism accent line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-prism)' }} />

      <div className="max-w-3xl">
        <Eyebrow>Enterprise Inquiry</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-secondary md:text-base">{subtitle}</p>
      </div>

      {isSubmitted ? (
        <div
          className="mt-8 rounded-2xl border px-5 py-4"
          style={{ borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.10)' }}
        >
          <Eyebrow>Inquiry received</Eyebrow>
          <p className="mt-2 text-sm text-ink">
            {message || 'Thanks. We will review this and follow up shortly.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 type-xs uppercase tracking-[0.12em] text-ink-secondary transition-colors hover:text-ink"
          >
            Submit another inquiry
          </button>
        </div>
      ) : (
        <form className="relative mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormGuardFields guard={guard} />
          <Field label="What are you here about?" htmlFor={fieldId('intent')} className="md:col-span-2">
            <Select id={fieldId('intent')} required value={form.intent} onChange={(e) => updateField('intent', e.target.value)} options={toOptions(INQUIRY_OPTIONS.intents)} />
          </Field>

          <Field label="Contact name" htmlFor={fieldId('contactName')}>
            <Input id={fieldId('contactName')} required value={form.contactName} onChange={(e) => updateField('contactName', e.target.value)} />
          </Field>

          <Field label="Work email" htmlFor={fieldId('email')}>
            <Input id={fieldId('email')} required type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </Field>

          <Field label="Company" htmlFor={fieldId('companyName')}>
            <Input id={fieldId('companyName')} required value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
          </Field>

          <Field label="Team size" htmlFor={fieldId('teamSize')}>
            <Select id={fieldId('teamSize')} value={form.teamSize} onChange={(e) => updateField('teamSize', e.target.value)} options={toOptions(INQUIRY_OPTIONS.teamSizes)} />
          </Field>

          <Field label="Revenue band" htmlFor={fieldId('revenueBand')}>
            <Select id={fieldId('revenueBand')} value={form.revenueBand} onChange={(e) => updateField('revenueBand', e.target.value)} options={toOptions(INQUIRY_OPTIONS.revenueBands)} />
          </Field>

          <Field label="Timeline" htmlFor={fieldId('timeline')}>
            <Select id={fieldId('timeline')} value={form.timeline} onChange={(e) => updateField('timeline', e.target.value)} options={toOptions(INQUIRY_OPTIONS.timelines)} />
          </Field>

          <Field label="Department focus" htmlFor={fieldId('departmentFocus')} className="md:col-span-2">
            <Input id={fieldId('departmentFocus')}
              required
              value={form.departmentFocus}
              onChange={(e) => updateField('departmentFocus', e.target.value)}
              placeholder="Example: product, support, finance, leadership"
            />
          </Field>

          <Field label="Goals" htmlFor={fieldId('goals')} className="md:col-span-2">
            <Textarea id={fieldId('goals')}
              required
              rows={5}
              value={form.goals}
              onChange={(e) => updateField('goals', e.target.value)}
              placeholder="What has changed in your business, where is adoption stuck, and what kind of capability do you want to build?"
            />
          </Field>

          {error && <p className="text-sm text-brand-red-strong md:col-span-2">{error}</p>}

          <div className="mt-2 flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-xs leading-5 text-ink-tertiary">
              Use this form if you want to explore a transformation engagement, role-based rollout, or internal
              builder support. This is not the course signup path.
            </p>
            <Button type="submit" loading={isSubmitting} showArrow>
              {isSubmitting ? 'Sending' : 'Send inquiry'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
