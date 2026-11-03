import { useMemo } from 'react'
import { NORTHWIND_COMPANY, northwindProfile } from '@/scripts/eu-ai-act-report/northwind'
import { actionPlan, reportRows } from '@/src/lib/eu-ai-act/report'

/**
 * The landing page's sample report: Northwind Logistics, the fictional demo company (never a
 * client), scored by the real engine from fixed answers. Days and "in force" are counted from
 * `today`, so the preview's today line and day counts stay true whenever it is read.
 */
export function useSampleReport(today: string) {
  const profile = useMemo(() => northwindProfile(), [])
  return useMemo(() => {
    const rows = reportRows(profile, today)
    return { company: NORTHWIND_COMPANY, profile, rows, plan: actionPlan(profile, rows) }
  }, [profile, today])
}

export type SampleReport = ReturnType<typeof useSampleReport>
