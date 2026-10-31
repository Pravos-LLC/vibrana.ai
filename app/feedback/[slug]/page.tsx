import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FeedbackForm } from '@/src/views/FeedbackForm'
import { FEEDBACK_UI, getFeedbackForm } from '@/src/feedback-content'
import { resolveRecipient } from '@/lib/feedback/recipients'
import '@/src/styles/feedback.css'

// A private link sent to one person. Never indexed, never cached: the greeting depends on ?r=.
export const metadata: Metadata = {
  title: FEEDBACK_UI.metaTitle,
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** FEEDBACK_BOOKING_URL is the 20 minute chat link on the thank-you screen. Hidden unless it is a real https URL. */
function bookingUrl(): string | null {
  const value = process.env.FEEDBACK_BOOKING_URL
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { slug } = await params
  const form = getFeedbackForm(slug)
  if (!form) notFound()

  const { r } = await searchParams
  const { token, recipient } = resolveRecipient(form.slug, r)

  return (
    <FeedbackForm
      form={form}
      token={token}
      recipient={recipient ? { name: recipient.name, role: recipient.role ?? null } : null}
      bookingUrl={bookingUrl()}
    />
  )
}
