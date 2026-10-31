import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const stages = ['new', 'booked', 'qualified', 'proposal', 'won', 'lost', 'nurture', 'archived'] as const

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const provided = request.headers.get('authorization')
  if (!provided) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(provided)
  // timingSafeEqual throws on a length mismatch, so check that first. A length
  // check alone is not timing-sensitive information worth protecting.
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('engagement_inquiries')
    .select('id, created_at, updated_at, contact_name, email, company_name, role, website, intent, track, status, timeline, goals, proposal_value_usd, lost_reason, source, metadata')
    .order('created_at', { ascending: false })
    .limit(250)

  if (error) {
    console.error('Admin leads fetch error:', error)
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 })
  }

  return NextResponse.json({ leads: data || [] })
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(stages),
  proposalValueUsd: z.number().int().min(0).nullable().optional(),
  lostReason: z.string().trim().max(1000).nullable().optional(),
})

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = updateSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const input = parsed.data
  const changes: Record<string, string | number | null> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }
  if (input.proposalValueUsd !== undefined) changes.proposal_value_usd = input.proposalValueUsd
  if (input.lostReason !== undefined) changes.lost_reason = input.lostReason
  if (input.status === 'booked') changes.booked_at = new Date().toISOString()

  const { data, error } = await supabase.from('engagement_inquiries').update(changes).eq('id', input.id).select().single()
  if (error) {
    console.error('Admin lead update error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
  return NextResponse.json({ lead: data })
}
