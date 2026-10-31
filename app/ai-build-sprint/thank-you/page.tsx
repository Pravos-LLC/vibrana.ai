'use client'

import Link from 'next/link'
import { trackCallClick, trackFunnel } from '@/src/lib/funnel/client'
import { Calendar, CheckCircle2 } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button, Eyebrow } from '@/src/components/prism'
import { SPRINT_FIT_CALL_URL, SPRINT_SCORECARD_URL, SPRINT_THANK_YOU } from '@/src/ai-build-sprint-content'

export default function SprintThankYouPage() {
  return (
    <EnterprisePageShell>
      <main className="px-6 pb-24 pt-36 md:pt-44">
        <div className="mx-auto max-w-3xl">
          <CheckCircle2 className="h-10 w-10 text-brand-emerald-strong" />
          <Eyebrow className="mt-7">{SPRINT_THANK_YOU.eyebrow}</Eyebrow>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-ink md:text-7xl">{SPRINT_THANK_YOU.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-secondary">{SPRINT_THANK_YOU.description}</p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button href={SPRINT_FIT_CALL_URL} target="_blank" rel="noopener noreferrer" icon={Calendar} onClick={() => trackCallClick('sprint-thank-you')}>{SPRINT_THANK_YOU.primaryCta}</Button>
            <Button href={SPRINT_SCORECARD_URL} variant="secondary" onClick={() => trackFunnel('sprint_scorecard_click', { href: SPRINT_SCORECARD_URL })}>{SPRINT_THANK_YOU.secondaryCta}</Button>
          </div>
          <p className="mt-6 text-sm text-ink-tertiary">{SPRINT_THANK_YOU.note}</p>
          <Link href="/" className="mt-12 inline-block text-sm text-ink-secondary hover:text-ink">{SPRINT_THANK_YOU.back}</Link>
        </div>
      </main>
    </EnterprisePageShell>
  )
}
