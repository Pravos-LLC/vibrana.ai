import type { Metadata } from 'next'
import { SprintFitCheck } from '@/src/components/sprint-fit/SprintFitCheck'
import { FIT } from '@/src/sprint-fit-content'
export const metadata: Metadata = { title: 'Sprint Fit Check | Vibrana', description: FIT.intro, alternates: { canonical: 'https://www.vibrana.ai/ai-build-sprint/readiness' } }
export default function Page() { return <SprintFitCheck /> }
