import { supabase } from '@/lib/supabase'
import type { EntryPoint } from './entry'

export type FunnelEventName = 'call_click' | 'roi_lead'

/**
 * One anonymous row in funnel_events (supabase/migrations/20261016200000_funnel_measurement.sql).
 * Never throws: a lost count must not fail the request it rides on.
 */
export async function recordFunnelEvent(event: FunnelEventName, entry: EntryPoint, location: string | null = null): Promise<boolean> {
  try {
    const { error } = await supabase.from('funnel_events').insert({ event, entry_point: entry, location })
    if (error) {
      console.error(`[funnel] ${event} not recorded:`, error.message)
      return false
    }
    return true
  } catch (err) {
    console.error(`[funnel] ${event} not recorded:`, err instanceof Error ? err.message : err)
    return false
  }
}
