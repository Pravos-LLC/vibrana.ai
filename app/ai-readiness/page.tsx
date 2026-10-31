import type { Metadata } from 'next'
import AIReadinessPage from '@/src/views/AIReadinessPage'
import { READINESS_META } from '@/src/ai-readiness-content'

export const metadata: Metadata = {
  title: READINESS_META.title,
  description: READINESS_META.description,
  alternates: { canonical: 'https://www.vibrana.ai/ai-readiness' },
  openGraph: {
    type: 'website',
    url: 'https://www.vibrana.ai/ai-readiness',
    title: READINESS_META.ogTitle,
    description: READINESS_META.description,
  },
}

export default function Page() {
  return <AIReadinessPage />
}
