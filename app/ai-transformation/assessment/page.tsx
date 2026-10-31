import type { Metadata } from 'next'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { AssessmentSection } from '@/src/components/assessment/AssessmentSection'

export const metadata: Metadata = {
  title: 'AI Transformation Readiness Assessment | Vibrana',
  description: 'Evaluate your organization across six dimensions of AI readiness. 24 questions and a personalized report.',
  alternates: { canonical: 'https://www.vibrana.ai/ai-transformation/assessment' },
}

export default function AITransformationAssessmentPage() {
  return (
    <EnterprisePageShell>
      <AssessmentSection headingAs="h1" />
    </EnterprisePageShell>
  )
}
