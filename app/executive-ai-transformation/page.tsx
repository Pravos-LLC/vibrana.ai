import type { Metadata } from 'next'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { AssessmentSection } from '@/src/components/assessment/AssessmentSection'
import { ExecutiveHero } from '@/src/components/enterprise/ExecutiveHero'
import { ExecutiveProblem } from '@/src/components/enterprise/ExecutiveProblem'
import { ExecutiveWorkflowTime } from '@/src/components/enterprise/ExecutiveWorkflowTime'
import { ExecutiveMethodologyBridge } from '@/src/components/enterprise/ExecutiveMethodologyBridge'
import { ExecutiveTeam } from '@/src/components/enterprise/ExecutiveTeam'
import { ExecutiveFAQ } from '@/src/components/enterprise/ExecutiveFAQ'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  title: "Executive AI Transformation — Vibrana",
  description:
    "The leadership layer's own workflows, redesigned as part of the same engagement as the rest of the company - not a separate coaching track.",
  alternates: { canonical: 'https://www.vibrana.ai/executive-ai-transformation' },
  openGraph: {
    images: [SITE_OG_IMAGE],
    type: 'website',
    url: 'https://www.vibrana.ai/executive-ai-transformation',
    title: 'Executive AI Transformation — Vibrana',
    description:
      "The leadership layer's own workflows, redesigned as part of the same engagement as the rest of the company.",
  },
}

export default function ExecutiveAITransformationPage() {
  return (
    <EnterprisePageShell>
      <ExecutiveHero />
      <ExecutiveProblem />
      <ExecutiveWorkflowTime />
      <ExecutiveMethodologyBridge />
      <ExecutiveTeam />
      <ExecutiveFAQ />
      <AssessmentSection />
    </EnterprisePageShell>
  )
}
