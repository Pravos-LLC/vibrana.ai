import { NextRequest, NextResponse } from 'next/server'
import { FORM_GUARDS, guardBeacon } from '@/lib/form-guard/server'
import { isCallLocation, parseEntryPoint } from '@/src/lib/funnel/entry'
import { recordFunnelEvent } from '@/src/lib/funnel/db'

/**
 * Counts a "Book a call" click (src/lib/funnel/client.ts trackCallClick). The booking itself
 * happens on Google Calendar, which reports nothing back, so this click is the last funnel step
 * the site can see. Stores the front door and where the link sat, nothing about the visitor
 * (docs/funnel-measurement.md). Answers 204 whatever happens: it is a beacon, not a form.
 */
export const dynamic = 'force-dynamic'

const MAX_BODY = 512

export async function POST(request: NextRequest) {
  // Same-site JSON only: a JSON body forces a CORS preflight on any other site, and browsers that send
  // Sec-Fetch-Site say where the request came from. Stops another page inflating the count.
  if (!(request.headers.get('content-type') || '').includes('application/json')) return new NextResponse(null, { status: 415 })
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return new NextResponse(null, { status: 403 })
  let body: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY) return new NextResponse(null, { status: 400 })
    body = JSON.parse(text)
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  const { event, entry, location } = (body ?? {}) as Record<string, unknown>
  const entryPoint = parseEntryPoint(entry)
  if (event !== 'call_click' || !entryPoint || !isCallLocation(location)) {
    return new NextResponse(null, { status: 400 })
  }

  const guard = await guardBeacon({ config: FORM_GUARDS.funnelEvents, headers: request.headers })
  if (guard.action !== 'allow') return new NextResponse(null, { status: guard.action === 'reject' ? guard.status : 204 })

  await recordFunnelEvent('call_click', entryPoint, location)
  return new NextResponse(null, { status: 204 })
}
