'use client'

import { useId, useState } from 'react'
import { FormGuardFields } from '@/lib/form-guard/client'
import {
  COMPANY_BRAIN_LAB_INTENT,
  COMPANY_BRAIN_LAB_LIMITS,
  type CompanyBrainLabAnswers,
} from '@/lib/company-brain-lab-application'
import { COMPANY_BRAIN_LAB, TEAM_SIZE_OPTIONS } from '@/src/company-brain-lab-content'
import { useEnterpriseInquiry } from '@/src/hooks/useEnterpriseInquiry'
import { Button, Eyebrow, Field, Input, Select, Textarea } from '@/src/components/prism'

const initialForm = {
  contactName: '',
  email: '',
  companyName: '',
  teamSize: TEAM_SIZE_OPTIONS[0].value as string,
  implementationOwner: '',
  workflow: '',
  importance: '',
  access: '',
  commitment: '',
  constraints: '',
}

type FormState = typeof initialForm
const copy = COMPANY_BRAIN_LAB.application

/** The long answers, in form order. Limits come from the route contract. */
const ANSWERS: {
  field: keyof CompanyBrainLabAnswers
  label: string
  placeholder?: string
  multiline: boolean
  required: boolean
}[] = [
  { field: 'implementationOwner', label: copy.fields.owner, placeholder: copy.fields.ownerPlaceholder, multiline: false, required: true },
  { field: 'workflow', label: copy.fields.workflow, placeholder: copy.fields.workflowPlaceholder, multiline: true, required: true },
  { field: 'importance', label: copy.fields.importance, placeholder: copy.fields.importancePlaceholder, multiline: true, required: true },
  { field: 'access', label: copy.fields.access, multiline: true, required: true },
  { field: 'commitment', label: copy.fields.commitment, placeholder: copy.fields.commitmentPlaceholder, multiline: false, required: true },
  { field: 'constraints', label: copy.fields.constraints, placeholder: copy.fields.constraintsPlaceholder, multiline: true, required: false },
]

export function CompanyBrainLabApplication() {
  const [form, setForm] = useState<FormState>(initialForm)
  const { guard, submitInquiry, isSubmitting, isSubmitted, error, reset } = useEnterpriseInquiry()
  const idPrefix = useId()
  const fieldId = (field: keyof FormState) => `${idPrefix}-${field}`
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const success = await submitInquiry({ intent: COMPANY_BRAIN_LAB_INTENT, ...form })
    if (success) setForm(initialForm)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-frost p-7 backdrop-blur-md md:p-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'var(--gradient-prism)' }} />
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-ink md:text-5xl">
        {copy.title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-secondary">{copy.body}</p>

      {isSubmitted ? (
        <div className="mt-8 rounded-2xl border p-6">
          <p className="text-base leading-7 text-ink">{copy.success}</p>
          <button type="button" onClick={reset} className="mt-4 text-sm font-medium text-brand-violet-strong hover:text-ink">
            {copy.another}
          </button>
        </div>
      ) : (
        <form className="relative mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <FormGuardFields guard={guard} />
          <Field label={copy.fields.sponsor} htmlFor={fieldId('contactName')}>
            <Input id={fieldId('contactName')} required maxLength={120} value={form.contactName} onChange={(event) => update('contactName', event.target.value)} />
          </Field>
          <Field label={copy.fields.email} htmlFor={fieldId('email')}>
            <Input id={fieldId('email')} required type="email" maxLength={255} value={form.email} onChange={(event) => update('email', event.target.value)} />
          </Field>
          <Field label={copy.fields.company} htmlFor={fieldId('companyName')}>
            <Input id={fieldId('companyName')} required maxLength={160} value={form.companyName} onChange={(event) => update('companyName', event.target.value)} />
          </Field>
          <Field label={copy.fields.teamSize} htmlFor={fieldId('teamSize')}>
            <Select id={fieldId('teamSize')} required value={form.teamSize} onChange={(event) => update('teamSize', event.target.value)} options={[...TEAM_SIZE_OPTIONS]} />
          </Field>
          {ANSWERS.map(({ field, label, placeholder, multiline, required }) => {
            const { min, max } = COMPANY_BRAIN_LAB_LIMITS[field]
            const props = {
              id: fieldId(field),
              required,
              value: form[field],
              maxLength: max,
              minLength: min > 1 ? min : undefined,
              placeholder,
              onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, event.target.value),
            }
            return (
              <Field key={field} label={label} htmlFor={props.id} hint={copy.characterCount(form[field].length, max)} className="md:col-span-2">
                {multiline ? <Textarea rows={required ? 4 : 3} {...props} /> : <Input {...props} />}
              </Field>
            )
          })}
          {error && <p role="alert" className="text-sm text-brand-red-strong md:col-span-2">{error}</p>}
          <div className="mt-2 flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-xs leading-5 text-ink-tertiary">
              {copy.privacy}{' '}
              <a className="underline underline-offset-2 hover:text-ink" href={copy.privacyLink.href}>
                {copy.privacyLink.label}
              </a>{' '}
              {copy.withdraw}
            </p>
            <Button type="submit" loading={isSubmitting} showArrow className="after:hidden! bg-(--violet)! text-white!">
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
