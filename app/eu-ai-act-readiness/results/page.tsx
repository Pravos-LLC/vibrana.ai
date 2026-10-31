'use client'

import { useEffect, useState } from 'react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { Button } from '@/src/components/prism'
import { EUResults } from '@/src/components/eu-ai-act/EUResults'
import { EU_REPORT_STORAGE_KEY, EU_REPORT_TTL_MS } from '@/src/components/eu-ai-act/storage'
import { EU_CTA, EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { isStoredReport } from '@/src/lib/eu-ai-act/report'
import { parseEntryPoint, type EntryPoint } from '@/src/lib/funnel/entry'
import { FunnelEvent } from '@/src/components/analytics/FunnelEvent'

type Stored = { profile: EUProfile; company: { name: string; email: string }; storedAt: number; entry?: string }

export default function Page() {
  const [stored, setStored] = useState<Stored | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EU_REPORT_STORAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Stored) : null
      if (parsed && typeof parsed.storedAt === 'number' && Date.now() - parsed.storedAt <= EU_REPORT_TTL_MS && isStoredReport(parsed)) setStored(parsed)
      else if (parsed) localStorage.removeItem(EU_REPORT_STORAGE_KEY)
    } catch {
      /* unreadable: show the empty state */
    }
    setLoading(false)
  }, [])

  const entry: EntryPoint | undefined = parseEntryPoint(stored?.entry) ?? undefined

  return (
    <EnterprisePageShell>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-violet-strong" />
        </div>
      ) : stored ? (
        <>
          <FunnelEvent name="eu_ai_act_report_view" />
          <EUResults profile={stored.profile} company={stored.company} entry={entry} />
        </>
      ) : (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="heading-subsection mb-4 text-ink">{R.emptyTitle}</h1>
          <p className="type-base mb-8 max-w-md text-ink-secondary">{R.emptyBody}</p>
          <Button href={EU_CTA.primary.href} showArrow>{EU_CTA.primary.short}</Button>
        </div>
      )}
    </EnterprisePageShell>
  )
}
