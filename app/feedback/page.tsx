import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FeedbackForm } from '@/src/views/FeedbackForm'
import { FEEDBACK_UI, GENERAL_FEEDBACK_FORM } from '@/src/feedback-content'
import { getFeedbackForm } from '@/lib/feedback/forms'
import '@/src/styles/feedback.css'

// The general feedback form: one shared, anonymous link with no client identity in the URL.
// A response carries no attribution unless the respondent types their own name and email.
// Never indexed.
export const metadata: Metadata = {
  title: FEEDBACK_UI.metaTitle,
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function GeneralFeedbackPage() {
  const form = getFeedbackForm(GENERAL_FEEDBACK_FORM.slug)
  if (!form) notFound()

  return <FeedbackForm form={form} />
}
