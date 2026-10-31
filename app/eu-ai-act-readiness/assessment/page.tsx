import type { Metadata } from 'next'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Eyebrow } from '@/src/components/prism'
import EUAssessmentForm from '@/src/components/eu-ai-act/EUAssessmentForm'
import { EU_FORM as c, EU_META } from '@/src/eu-ai-act-readiness-content'

export const metadata: Metadata = {
  title: `${c.title} | Vibrana`,
  description: EU_META.description,
  alternates: { canonical: 'https://www.vibrana.ai/eu-ai-act-readiness/assessment' },
}

export default function Page() {
  return (
    <EnterprisePageShell>
      <section className="px-6 pb-24 pt-28 md:pt-36">
        <div className="mb-12 text-center">
          <Eyebrow className="mb-6">{c.badge}</Eyebrow>
          <h1 className="heading-section mb-6">
            <span className="text-gradient-prism">{c.title}</span>
          </h1>
          <p className="type-lg mx-auto max-w-2xl leading-relaxed text-ink-secondary">{c.intro}</p>
        </div>
        <EUAssessmentForm />
      </section>
    </EnterprisePageShell>
  )
}
