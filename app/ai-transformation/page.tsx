import type { Metadata } from 'next'
import AITransformationView from '@/src/views/AITransformationPage'
import { SITE_OG_IMAGE } from '@/src/og/site-og-image'

export const metadata: Metadata = {
  title: 'AI-Native Transformation: 12-Week Company-Wide Program | Vibrana',
  description:
    'Move from scattered AI pilots to a company-wide operating model with implemented workflows, role-specific learning, governance, and internal ownership.',
  alternates: { canonical: 'https://www.vibrana.ai/ai-transformation' },
  openGraph: {
    images: [SITE_OG_IMAGE],
    type: 'website',
    url: 'https://www.vibrana.ai/ai-transformation',
    title: 'AI-Native Transformation | Vibrana',
    description:
      'A 12-week pathway from readiness evidence to implemented workflows and internal ownership.',
  },
}

export default function AITransformationPage() {
  return <AITransformationView />
}
