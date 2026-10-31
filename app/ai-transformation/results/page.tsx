'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import ResultsDashboard from '@/src/components/assessment/ResultsDashboard'
import { AssessmentResult } from '@/src/types/assessment'
import { parseEntryPoint, type EntryPoint } from '@/src/lib/funnel/entry'

const REPORT_STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export default function ResultsPage() {
  const [report, setReport] = useState<AssessmentResult | null>(null)
  const [assessmentId, setAssessmentId] = useState<string | undefined>(undefined)
  const [analysisGenerating, setAnalysisGenerating] = useState(false)
  const [entry, setEntry] = useState<EntryPoint | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('assessmentReport')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (typeof parsed._storedAt === 'number' && Date.now() - parsed._storedAt > REPORT_STORAGE_TTL_MS) {
          localStorage.removeItem('assessmentReport')
          setLoading(false)
          return
        }
        const { _assessmentId, _analysisGenerating, _entry, _storedAt: _ignoredStoredAt, ...cleanReport } = parsed
        void _ignoredStoredAt
        setReport(cleanReport)
        setAssessmentId(_assessmentId)
        setAnalysisGenerating(_analysisGenerating || false)
        setEntry(parseEntryPoint(_entry) ?? undefined)
      } catch (e) {
        console.error('Failed to parse report:', e)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <EnterprisePageShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </EnterprisePageShell>
    )
  }

  if (!report) {
    return (
      <EnterprisePageShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-white px-4">
          <h1 className="heading-subsection mb-4">No Report Found</h1>
          <p className="type-base text-white/70 mb-8 text-center max-w-md">
            It looks like you haven&apos;t completed an assessment yet, or your results have expired.
          </p>
          <button onClick={() => router.push('/ai-transformation/assessment')} className="btn-primary">
            Take the Assessment
          </button>
        </div>
      </EnterprisePageShell>
    )
  }

  return (
    <EnterprisePageShell>
      <ResultsDashboard
        result={report}
        assessmentId={assessmentId}
        analysisGenerating={analysisGenerating}
        entry={entry}
      />
    </EnterprisePageShell>
  )
}
