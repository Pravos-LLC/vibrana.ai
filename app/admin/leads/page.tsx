'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { AdminNav } from '@/src/components/AdminNav'
import { useAdminAuth } from '@/src/hooks/useAdminAuth'
import { SPRINT_TRACK_NAMES } from '@/src/ai-build-sprint-content'
import { isSprintTrackId } from '@/src/lib/sprint-tracks'

const STAGES = ['new', 'booked', 'qualified', 'proposal', 'won', 'lost', 'nurture', 'archived'] as const

interface Lead {
  id: string
  created_at: string
  contact_name: string
  email: string
  company_name: string
  role: string | null
  website: string | null
  intent: string
  track: string | null
  status: typeof STAGES[number]
  timeline: string
  goals: string
  proposal_value_usd: number | null
  lost_reason: string | null
  source: string
  metadata: Record<string, string> | null
}

export default function LeadsPage() {
  const { secret, authenticated, mounted, login, logout, setSecret } = useAdminAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (authSecret: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${authSecret}` } })
      if (response.status === 401) throw new Error('Invalid credentials')
      if (!response.ok) throw new Error('Could not load leads')
      const result = await response.json()
      setLeads(result.leads)
      setError('')
      return true
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load leads')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mounted && authenticated && secret) load(secret)
  }, [authenticated, load, mounted, secret])

  const updateStage = async (lead: Lead, status: Lead['status']) => {
    const previous = lead.status
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item))
    const response = await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ id: lead.id, status }),
    })
    if (!response.ok) {
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: previous } : item))
      setError('The lead stage was not saved.')
    }
  }

  if (!mounted) return <div className="min-h-screen bg-surface-base" />
  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-base px-6">
        <form className="w-full max-w-sm space-y-4" onSubmit={async (event) => { event.preventDefault(); if (await load(secret)) login(secret) }}>
          <h1 className="text-3xl font-semibold text-ink">Sales pipeline</h1>
          <label className="block text-sm text-ink-secondary" htmlFor="lead-secret">Admin secret</label>
          <input id="lead-secret" type="password" required value={secret} onChange={(event) => setSecret(event.target.value)} className="input w-full" />
          {error && <p className="text-sm text-brand-red-strong">{error}</p>}
          <button className="btn-primary w-full" type="submit">Open pipeline</button>
        </form>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <AdminNav onLogout={logout} />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="type-xs uppercase tracking-wider text-ink-tertiary">Commercial system of record</p><h1 className="mt-2 text-3xl font-semibold">Sales pipeline</h1></div>
          <button type="button" onClick={() => load(secret)} className="btn-secondary"><RefreshCw className="h-4 w-4" />{loading ? 'Refreshing' : 'Refresh'}</button>
        </div>
        {error && <p className="mt-5 text-sm text-brand-red-strong">{error}</p>}
        <div className="mt-8 overflow-x-auto rounded-xl border border-line-subtle">
          <table className="min-w-full between:border-t between:border-line-subtle text-left text-sm">
            <thead className="bg-surface-raised text-xs uppercase tracking-wider text-ink-tertiary"><tr><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Path</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Stage</th></tr></thead>
            <tbody className="between:border-t between:border-line-subtle">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top">
                  <td className="px-4 py-4"><p className="font-medium text-ink">{lead.contact_name} · {lead.company_name}</p><a href={`mailto:${lead.email}`} className="mt-1 block text-xs text-brand-violet-strong">{lead.email}</a>{lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-ink-tertiary">Website <ExternalLink className="h-3 w-3" /></a>}</td>
                  <td className="px-4 py-4"><p className="font-medium">{lead.intent === 'ai_build_sprint' ? 'AI Build Sprint' : 'Transformation'}</p><p className="mt-1 text-xs text-ink-tertiary">{isSprintTrackId(lead.track) ? SPRINT_TRACK_NAMES[lead.track] : lead.track || lead.timeline}</p></td>
                  <td className="max-w-md px-4 py-4 text-sm leading-6 text-ink-secondary">{lead.goals}</td>
                  <td className="px-4 py-4"><p>{lead.source}</p><p className="mt-1 text-xs text-ink-tertiary">{lead.metadata?.utm_campaign || 'No campaign'}</p></td>
                  <td className="px-4 py-4"><select aria-label={`Stage for ${lead.contact_name}`} className="select min-w-32" value={lead.status} onChange={(event) => updateStage(lead, event.target.value as Lead['status'])}>{STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></td>
                </tr>
              ))}
              {!loading && leads.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-tertiary">No engagement inquiries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
