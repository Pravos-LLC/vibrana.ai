import { Resend } from 'resend'

const resendClient = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.FROM_EMAIL || 'John Ellison <john@vibrana.ai>'

interface EmailPayload {
  /** Sensitive feedback never logs provider exception payloads. Not forwarded to Resend. */
  suppressErrorDetails?: boolean
  from: string
  to: string
  subject: string
  text?: string
  html: string
  cc?: string | string[]
  replyTo?: string | string[]
  tags?: Array<{ name: string; value: string }>
  headers?: Record<string, string>
  attachments?: Array<{ filename: string; content: Buffer }>
}

interface EmailResult {
  data: { id: string } | null
  error: { message: string; name: string } | null
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    const { data, error } = await resendClient.emails.send({
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      tags: payload.tags,
      headers: payload.headers,
      attachments: payload.attachments,
    })

    if (error) {
      return {
        data: null,
        error: { message: error.message, name: error.name }
      }
    }

    return {
      data: data ? { id: data.id } : null,
      error: null
    }
  } catch (e) {
    const error = e as Error
    if (payload.suppressErrorDetails) {
      console.error('Resend SDK error')
    } else {
      console.error('Resend SDK error:', error)
      console.error('Error details:', JSON.stringify(e))
    }
    return {
      data: null,
      error: { message: error.message, name: 'sdk_error' }
    }
  }
}

// One automatic retry on a transient failure. Resend occasionally returns a
// rate-limit / transient 4xx-5xx on cold starts; a single retry after a short
// backoff resolves the "first send silently lost, second send instant" symptom.
export async function sendEmailWithRetry(
  payload: EmailPayload,
  retries = 1
): Promise<EmailResult> {
  let last = await sendEmail(payload)
  for (let attempt = 0; attempt < retries && last.error; attempt++) {
    console.warn(
      `Email send failed (attempt ${attempt + 1}/${retries + 1}) to ${payload.to}: ${last.error.message}. Retrying...`
    )
    await new Promise((r) => setTimeout(r, 600))
    last = await sendEmail(payload)
  }
  return last
}

export const resend = resendClient
