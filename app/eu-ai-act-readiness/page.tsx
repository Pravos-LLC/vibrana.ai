import type { Metadata } from 'next'
import EUAIActReadinessPage from '@/src/views/EUAIActReadinessPage'
import { EU_META } from '@/src/eu-ai-act-readiness-content'

export const metadata: Metadata = {
  title: EU_META.title,
  description: EU_META.description,
  alternates: { canonical: 'https://www.vibrana.ai/eu-ai-act-readiness' },
  openGraph: {
    type: 'website',
    url: 'https://www.vibrana.ai/eu-ai-act-readiness',
    title: EU_META.ogTitle,
    description: EU_META.description,
  },
}

export default function Page() {
  return <EUAIActReadinessPage />
}
