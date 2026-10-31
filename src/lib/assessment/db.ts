// Assessment data-access helpers, ported from john-ellison.com lib/supabase.ts.
// Uses Vibrana's existing service-role client at @/lib/supabase.
// Note: leads table renamed to `assessment_leads` to avoid colliding with future generic leads.

import { supabase } from '@/lib/supabase'
import type { QualitySignals } from '@/lib/assessment/quality-signals'
import { collapsePlusTag } from '@/lib/form-guard/validation'
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows'
import type { EntryPoint } from '@/src/lib/funnel/entry'

export interface Assessment {
  id: string
  created_at: string
  company_name: string
  website: string
  linkedin: string
  email: string
  team_size?: string
  revenue_band?: string
  /** Raw answers: question id -> option score. Absent on rows saved before 2026-10-15. */
  answers?: Record<string, number>
  /** Which question set the answers come from: 2 from 2026-10-16, 1 before; null on older rows (version 1). */
  instrument_version?: number | null
  /** Workflows the buyer named after the questions (instrument version 2), or null. */
  workflows?: AssessmentWorkflows | null
  dimension_scores: Record<string, number>
  overall_score: number
  readiness_level: string
  blockers: any[]
  recommendations: any[]
  company_insights?: any
  archetype?: any
  axis_scores?: any
  industry_analysis?: string
  /** Structured analysis (lib/assessment/analysis-schema.ts); rows before 2026-10-16 use industry_analysis. */
  analysis?: unknown
  analysis_meta?: Record<string, unknown> | null
  // Legacy partner-review columns. New submissions are always 'delivered'.
  brand?: string | null
  status?: 'pending_review' | 'reviewed' | 'delivered'
  started_at?: string | null
  completed_at?: string | null
  duration_seconds?: number | null
  quality_signals?: QualitySignals | null
  /** Front door (src/lib/funnel/entry.ts); null before 2026-10-16 or from a page loaded before then. */
  entry_point?: EntryPoint | null
  /** Which assessment: 'ai-readiness' (default) or 'eu-ai-act' (from 2026-10-17). */
  assessment_type?: 'ai-readiness' | 'eu-ai-act'
  /** EU AI Act profile (src/lib/eu-ai-act/engine.ts EUProfile); null for AI Readiness rows. */
  compliance_profile?: unknown
}

export async function saveAssessment(assessment: Omit<Assessment, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessment)
      .select()

    if (error) {
      console.error('Error saving assessment:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Exception saving assessment:', err)
    return { success: false, error: String(err) }
  }
}

const NOTIFICATION_CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Atomic claim so a replayed or raced POST to /api/assessments can't re-send the
 * receipt/report email or reschedule the nurture sequence for the same address
 * within a rolling 24h window. The assessment itself is always saved regardless
 * of the outcome here; only the request that wins this claim gets to notify.
 *
 * Mirrors whitepaper_leads' atomic claim-by-flip (app/api/whitepaper/route.ts):
 * a plain INSERT wins the claim outright (unique on email); a request that loses
 * the INSERT to a unique-violation instead tries a conditional UPDATE that only
 * matches an expired claim. Each statement is a single atomic DB operation, so
 * concurrent requests for the same email can't both win.
 *
 * Keys on the +tag-collapsed address (name+1@x and name+2@x claim the same row),
 * matching lib/form-guard/server.ts's rate-limit email bucket: the claim's purpose
 * is one report + nurture sequence per inbox per 24h, and +tag variants are the
 * same inbox. The literal, uncollapsed `email` is still what gets saved and mailed
 * -- this function only affects which row is read/written.
 */
/** `scope` keeps another assessment's claim (e.g. the EU AI Act one) from blocking this one's email. */
function claimKey(email: string, scope?: string): string {
  const key = collapsePlusTag(email)
  return scope ? `${key}#${scope}` : key
}

export async function claimAssessmentNotification(email: string, scope?: string): Promise<boolean> {
  const key = claimKey(email, scope)
  try {
    const now = new Date()
    const { error: insertError } = await supabase
      .from('assessment_notification_claims')
      .insert({ email: key, claimed_at: now.toISOString() })

    if (!insertError) return true
    if (insertError.code !== '23505') {
      console.error('Assessment notification claim insert failed:', insertError.message)
      return false
    }

    const windowStart = new Date(now.getTime() - NOTIFICATION_CLAIM_WINDOW_MS).toISOString()
    const { data: renewed, error: updateError } = await supabase
      .from('assessment_notification_claims')
      .update({ claimed_at: now.toISOString() })
      .eq('email', key)
      .lt('claimed_at', windowStart)
      .select('email')

    if (updateError) {
      console.error('Assessment notification claim renewal failed:', updateError.message)
      return false
    }

    return !!renewed && renewed.length > 0
  } catch (err) {
    console.error('Exception claiming assessment notification:', err)
    return false
  }
}

/**
 * Releases a claim taken by claimAssessmentNotification so the next request for the
 * same email can retry the notification (mirrors app/api/whitepaper/route.ts, which
 * flips whitepaper_sent back to false on a failed send). Deletes the row outright
 * rather than resetting claimed_at, since "no successful send happened" is exactly
 * the pre-claim state. Keys on the same +tag-collapsed address as the claim above.
 */
export async function releaseAssessmentNotificationClaim(email: string, scope?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('assessment_notification_claims')
      .delete()
      .eq('email', claimKey(email, scope))

    if (error) {
      console.error('Assessment notification claim release failed:', error.message)
    }
  } catch (err) {
    console.error('Exception releasing assessment notification claim:', err)
  }
}

/**
 * Whether `email` already has the whitepaper (POST /api/whitepaper flipped
 * whitepaper_leads.whitepaper_sent for it). Used to skip a redundant PDF push
 * in the Day 10 nurture email. On any error this fails open (returns false),
 * since not skipping the email is the pre-existing behavior, not a regression.
 */
export async function isWhitepaperAlreadySent(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('whitepaper_leads')
      .select('whitepaper_sent')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error checking whitepaper_leads:', error.message)
      return false
    }

    return !!(data as { whitepaper_sent?: boolean } | null)?.whitepaper_sent
  } catch (err) {
    console.error('Exception checking whitepaper_leads:', err)
    return false
  }
}

export interface Lead {
  id: string
  created_at: string
  email: string
  company_name: string
  website: string
  linkedin?: string
  team_size?: string
  revenue_band?: string
  company_insights?: any
  converted_to_assessment: boolean
  /** Where the lead first came from (e.g. 'simulator'). Set once: a later source never overwrites it. */
  source?: string
  /** The latest simulator run this lead asked about. */
  simulator_run_id?: string
  /** That run's public slug, so the CRM can link the result without a join. */
  simulator_run_slug?: string
}

export async function saveLead(lead: Omit<Lead, 'id' | 'created_at' | 'converted_to_assessment'>) {
  try {
    const { source, ...rest } = lead
    const { data, error } = await supabase
      .from('assessment_leads')
      .upsert({ ...rest, converted_to_assessment: false }, { onConflict: 'email' })
      .select()

    if (error) {
      console.error('Error saving lead:', error)
      return { success: false, error: error.message }
    }

    if (source) {
      // Keep the first source: only fill it when the row has none yet.
      const { error: sourceError } = await supabase
        .from('assessment_leads')
        .update({ source })
        .eq('email', lead.email)
        .is('source', null)
      if (sourceError) console.error('Error setting lead source:', sourceError)
    }

    return { success: true, data }
  } catch (err) {
    console.error('Exception saving lead:', err)
    return { success: false, error: String(err) }
  }
}

export async function markLeadConverted(email: string) {
  try {
    const { error } = await supabase
      .from('assessment_leads')
      .update({ converted_to_assessment: true })
      .eq('email', email)

    if (error) {
      console.error('Error marking lead converted:', error)
    }
  } catch (err) {
    console.error('Exception marking lead converted:', err)
  }
}

export async function getAssessment(id: string) {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching assessment:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Exception fetching assessment:', err)
    return null
  }
}

export async function updateAssessmentAnalysis(
  id: string,
  fields: { analysis: unknown; analysis_meta: Record<string, unknown> | null; industry_analysis?: string | null }
) {
  try {
    const { error } = await supabase.from('assessments').update(fields).eq('id', id)

    if (error) {
      console.error('Error updating assessment analysis:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Exception updating assessment analysis:', err)
    return { success: false, error: String(err) }
  }
}

export interface WhitepaperLead {
  id: string
  created_at: string
  email: string
  source: string
  whitepaper_sent: boolean
  nurture_sequence_started: boolean
}

export async function saveWhitepaperLead(email: string, source: string) {
  try {
    const { data, error } = await supabase
      .from('whitepaper_leads')
      .upsert(
        { email, source, whitepaper_sent: false, nurture_sequence_started: false },
        { onConflict: 'email' }
      )
      .select()

    if (error) {
      console.error('Error saving whitepaper lead:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Exception saving whitepaper lead:', err)
    return { success: false, error: String(err) }
  }
}

export async function markWhitepaperSent(email: string) {
  try {
    const { error } = await supabase
      .from('whitepaper_leads')
      .update({ whitepaper_sent: true })
      .eq('email', email)

    if (error) {
      console.error('Error marking whitepaper sent:', error)
    }
  } catch (err) {
    console.error('Exception marking whitepaper sent:', err)
  }
}
