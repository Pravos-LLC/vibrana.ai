'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminNav } from '@/src/components/AdminNav';
import { useAdminAuth } from '@/src/hooks/useAdminAuth';
import { formatDuration } from '@/lib/assessment/quality-signals';
import { analysisPlainText } from '@/lib/assessment/analysis-render';
import type { StructuredAnalysis } from '@/lib/assessment/analysis-schema';

interface Row {
  id: string;
  created_at: string;
  email: string;
  website?: string;
  company_name?: string;
  status: string;
  overall_score?: number;
  archetype?: { name?: string };
  industry_analysis?: string | null;
  analysis?: StructuredAnalysis | null;
  analysis_meta?: { status?: string; reason?: string } | null;
  duration_seconds?: number | null;
  quality_signals?: {
    all_max_answers?: boolean;
    suspiciously_fast?: boolean;
    max_answer_ratio?: number;
  } | null;
  answers?: Record<string, number>;
  /** 'eu-ai-act' rows come from /eu-ai-act-readiness: rules-based results, no written analysis. */
  assessment_type?: 'ai-readiness' | 'eu-ai-act';
  compliance_profile?: { scope?: string; role?: string; riskTier?: string; obligations?: unknown[] } | null;
}

function qualityBadges(signals: Row['quality_signals']) {
  if (!signals) return null;
  const badges: { label: string; className: string }[] = [];
  if (signals.suspiciously_fast) {
    badges.push({ label: 'Fast completion', className: 'bg-amber-500/15 text-brand-amber-strong' });
  }
  if (signals.all_max_answers) {
    badges.push({ label: 'All max answers', className: 'bg-red-500/15 text-brand-red-strong' });
  }
  return badges;
}

export default function AssessmentReviewPage() {
  const { secret, authenticated, mounted, login } = useAdminAuth();
  const [secretInput, setSecretInput] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [analysisDrafts, setAnalysisDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/assessment-review', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load');
        setRows([]);
      } else {
        const data: Row[] = json.data || [];
        setRows(data);
        setAnalysisDrafts(
          Object.fromEntries(data.map((r) => [r.id, analysisPlainText(r.analysis ?? r.industry_analysis)]))
        );
        if (data[0]) setSelectedId((prev) => prev || data[0].id);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    if (authenticated) load();
  }, [authenticated, load]);

  const generateAnalysis = async (id: string, force = false) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/assessment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ id, force }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.reason ? `No analysis stored: ${json.reason}` : json?.error || 'Analysis generation failed');
        return;
      }
      setAnalysisDrafts((d) => ({ ...d, [id]: analysisPlainText(json.analysis) }));
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (!mounted) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base text-ink p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold mb-4">Assessment Review</h1>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="Admin secret"
            className="w-full px-3 py-2 rounded bg-surface-frost border border-line-subtle text-ink placeholder:text-ink-tertiary focus:outline-hidden focus:border-violet-500 mb-3"
          />
          <button
            onClick={() => login(secretInput)}
            className="w-full py-2 rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Assessment submissions</h1>
            <p className="text-sm text-ink-secondary">
              Every organization assessment, newest first. Generate or regenerate the written analysis here; it is stored only if it passes the code checks and the judge.
            </p>
          </div>
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded bg-surface-card border border-line-subtle text-ink hover:bg-surface-overlay transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && <p className="text-brand-red-strong text-sm mb-4">{error}</p>}
        {loading && <p className="text-ink-secondary text-sm">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-ink-secondary text-sm">No submissions yet.</p>
        )}

        <div className="space-y-4">
            {rows.map((r) => {
              const badges = qualityBadges(r.quality_signals);
              return (
                <div
                  key={r.id}
                  className={`rounded-xl border bg-surface-card p-5 cursor-pointer transition-colors ${
                    selectedId === r.id ? 'border-violet-500' : 'border-line-subtle'
                  }`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {r.company_name || r.email}
                      </p>
                      <p className="text-sm text-ink-secondary">{r.email}</p>
                      <p className="text-xs text-ink-tertiary mt-1">
                        {new Date(r.created_at).toLocaleString()} · score {r.overall_score ?? '—'} ·{' '}
                        {r.assessment_type === 'eu-ai-act'
                          ? `EU AI Act · ${r.compliance_profile?.riskTier ?? '—'} · ${r.compliance_profile?.role ?? '—'} · ${r.compliance_profile?.obligations?.length ?? 0} obligations`
                          : r.archetype?.name || '—'}
                      </p>
                      <p className="text-xs text-ink-tertiary mt-1">
                        Duration: {formatDuration(r.duration_seconds)}
                      </p>
                      {badges && badges.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {badges.map((b) => (
                            <span key={b.label} className={`text-xs px-2 py-0.5 rounded ${b.className}`}>
                              {b.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {r.id === selectedId && r.assessment_type !== 'eu-ai-act' ? (
                    <>
                      {analysisDrafts[r.id] ? (
                        <div className="mt-4 rounded-lg border border-line-subtle bg-surface-overlay p-3 text-sm">
                          <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">
                            Industry analysis
                          </p>
                          <p className="whitespace-pre-wrap text-ink-secondary">{analysisDrafts[r.id]}</p>
                        </div>
                      ) : null}
                      {r.analysis_meta?.reason ? (
                        <p className={`mt-2 text-xs ${r.analysis_meta.status === 'failed' ? 'text-brand-amber-strong' : 'text-ink-tertiary'}`}>
                          Pipeline: {r.analysis_meta.reason}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => generateAnalysis(r.id, !!analysisDrafts[r.id] || !!r.analysis_meta)}
                          disabled={busyId === r.id}
                          className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                          {analysisDrafts[r.id] ? 'Regenerate analysis' : 'Generate analysis'}
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
