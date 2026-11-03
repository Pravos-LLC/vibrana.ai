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

// The countdown, the next milestone and the sample report's day counts derive from today's date,
// so the prerendered HTML is regenerated hourly rather than frozen at build time. The browser then
// recounts from its own date after mount.
export const revalidate = 3600

export default function Page() {
  // The date this HTML was generated (at most an hour old).
  return <EUAIActReadinessPage today={new Date().toISOString().slice(0, 10)} />
}
