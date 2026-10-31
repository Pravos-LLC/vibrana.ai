import type { Metadata } from 'next'
import AIBuildSprintPage from '@/src/views/AIBuildSprintPage'
import { SPRINT_META } from '@/src/ai-build-sprint-content'

export const metadata: Metadata = {
  title: SPRINT_META.title,
  description: SPRINT_META.description,
  alternates: { canonical: 'https://www.vibrana.ai/ai-build-sprint' },
  openGraph: {
    type: 'website',
    url: 'https://www.vibrana.ai/ai-build-sprint',
    title: SPRINT_META.title,
    description: SPRINT_META.description,
  },
}

export default function Page() {
  return <AIBuildSprintPage />
}
