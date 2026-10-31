import { NextRequest, NextResponse } from 'next/server'
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server'
import { buildProfile } from '@/src/lib/simulator/profile'
import { normalizeWebsite } from '@/src/lib/simulator/profile/domain'

export const maxDuration = 60
/** Website research only. This does not create a simulator lead or persist contact details. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const site = normalizeWebsite(body.website)
  const manual = { ok: false, reason: 'manual', domain: site?.domain ?? null }
  const guard = await guardSubmission({ config: FORM_GUARDS.sprintFitProfile, headers: request.headers, ...guardFieldsFromBody(body) })
  if (guard.action === 'drop') return NextResponse.json(manual)
  if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status })
  if (!site) return NextResponse.json(manual)
  const result = await buildProfile(site.url, { requireSummary: true })
  return NextResponse.json(result)
}
