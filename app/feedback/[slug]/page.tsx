import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FeedbackForm } from '@/src/views/FeedbackForm'
import { FEEDBACK_UI } from '@/src/feedback-content'
import { getFeedbackForm } from '@/lib/feedback/forms'
import '@/src/styles/feedback.css'

// A shared, anonymous feedback link: one URL per client, no per-recipient tokens. A response carries
// no attribution unless the respondent types their own name and email on the contact step.
// Never indexed.
export const metadata: Metadata = {
  title: FEEDBACK_UI.metaTitle,
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function FeedbackPage({ params }: Props) {
  const { slug } = await params
  const form = getFeedbackForm(slug)
  if (!form) notFound()

  return <FeedbackForm form={form} />
}
