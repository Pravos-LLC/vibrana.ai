'use client';
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

import { AssessmentResult, CompanyInsights } from '@/src/types/assessment';
import { EvidencePanel } from './EvidencePanel';
import { WorkflowEstimatePanel } from './WorkflowEstimatePanel';
import MaturityRadar from './MaturityRadar';
import ArchetypeQuadrant from '@/src/components/assessment/ArchetypeQuadrant';
import { Share2, ArrowRight, AlertTriangle, CheckCircle2, X, Mail, Globe, Download, CheckCircle, TrendingUp, Info, Search, XCircle, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { Linkedin } from '@/src/components/icons/BrandIcons';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { analysisSections, type StoredAnalysis } from '@/lib/assessment/analysis-render';
import { ASSESSMENT_ANALYSIS_COPY as AC } from '@/src/assessment-analysis-content';
import { generateAssessmentPDF } from '@/src/lib/assessment/pdf-generator';
import { useFormGuard } from '@/lib/form-guard/client';
import { PUBLIC_DEMO_DOWNLOAD } from '@/src/public-demo-download-content';
import { RESULTS_WHITEPAPER_CARD } from '@/src/results-dashboard-whitepaper-card-content';
import type { EntryPoint } from '@/src/lib/funnel/entry';
import { currentEntry, trackCallClick, trackFunnel } from '@/src/lib/funnel/client';

interface ResultsDashboardProps {
  result: AssessmentResult;
  assessmentId?: string;
  analysisGenerating?: boolean;
  /** Front door of the visit that produced this report (stored with it); falls back to this tab's. */
  entry?: EntryPoint;
}

// Helper function to categorize maturity signals
function categorizeSignal(signal: string) {
  const lower = signal.toLowerCase();

  // Positive signals
  if (
    lower.includes('mentions ai') ||
    lower.includes('digital transformation') ||
    lower.includes('data-driven') ||
    lower.includes('machine learning') ||
    lower.includes('automation') ||
    lower.includes('analytics') ||
    lower.includes('cloud') ||
    lower.includes('modern')
  ) {
    return {
      icon: <CheckCircle className="w-4 h-4 text-brand-violet-strong shrink-0 mt-0.5" />,
      type: 'positive',
      bgColor: 'bg-green-500/5',
      borderColor: 'border-green-500/20',
    };
  }

  // Opportunity signals
  if (
    lower.includes('no mention') ||
    lower.includes('traditional') ||
    lower.includes('basic') ||
    lower.includes('limited') ||
    lower.includes('manual') ||
    lower.includes('legacy')
  ) {
    return {
      icon: <TrendingUp className="w-4 h-4 text-brand-amber-strong shrink-0 mt-0.5" />,
      type: 'opportunity',
      bgColor: 'bg-yellow-500/5',
      borderColor: 'border-yellow-500/20',
    };
  }

  // Neutral/informational
  return {
    icon: <Info className="w-4 h-4 text-brand-blue-strong shrink-0 mt-0.5" />,
    type: 'info',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
  };
}

// Helper function to get company logo URL
function getCompanyLogoUrl(website: string, insights?: CompanyInsights) {
  // Try OG Image first
  if (insights?.metadata?.ogImage) {
    return insights.metadata.ogImage;
  }

  // Try favicon
  if (insights?.metadata?.favicon) {
    return insights.metadata.favicon;
  }

  // Fallback to Clearbit Logo API
  try {
    const domain = new URL(website).hostname;
    return `https://logo.clearbit.com/${domain}`;
  } catch {
    return null;
  }
}

// Results live only in this browser's localStorage, so a shared results URL would open empty.
const ASSESSMENT_URL = 'https://www.vibrana.ai/ai-transformation/assessment';

export default function ResultsDashboard({ result, assessmentId, analysisGenerating, entry: reportEntry }: ResultsDashboardProps) {
  const { archetype, axisScores, dimensionScores, blockers, overallScore, recommendations, companyData, companyInsights, analysis: initialAnalysis } = result;
  const [showEmailSent, setShowEmailSent] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [whitepaperSending, setWhitepaperSending] = useState(false);
  const [whitepaperSent, setWhitepaperSent] = useState(false);
  const guard = useFormGuard();
  const [analysis, setAnalysis] = useState<StoredAnalysis>(initialAnalysis || null);
  const [analysisLoading, setAnalysisLoading] = useState(analysisGenerating && !initialAnalysis);
  const chartRef = useRef<HTMLDivElement>(null);


  // Funnel: one report_view per open (docs/funnel-measurement.md).
  const entryRef = useRef<EntryPoint>('direct');
  useEffect(() => {
    entryRef.current = reportEntry ?? currentEntry();
    trackFunnel('report_view', { analysis: !!initialAnalysis }, entryRef.current);
    // Once per mount: a later analysis arriving is not a second open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable smooth scrolling on this page for performance
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // Poll for industry analysis if it's being generated
  useEffect(() => {
    if (!assessmentId || analysis || !analysisGenerating) {
      return;
    }

    let mounted = true;
    let attempts = 0;
    const maxAttempts = 24; // 24 attempts * 5 seconds = 2 minutes max (two drafts, each judged)
    const pollInterval = 5000; // 5 seconds

    const pollForAnalysis = async () => {
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/analysis`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.hasAnalysis && data.analysis && mounted) {
          setAnalysis(data.analysis);
          setAnalysisLoading(false);
        } else if (data.analysisFailed && mounted) {
          // Nothing passed the checks; the report stands without a written analysis.
          setAnalysisLoading(false);
        } else if (mounted && attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForAnalysis, pollInterval);
        } else if (mounted) {
          // Stop loading after max attempts
          setAnalysisLoading(false);
        }
      } catch (error) {
        console.error('Error polling for analysis:', error);
        if (mounted && attempts < maxAttempts) {
          attempts++;
          setTimeout(pollForAnalysis, pollInterval);
        } else if (mounted) {
          setAnalysisLoading(false);
        }
      }
    };

    // Start polling after a short delay to give the background process time to start
    const initialDelay = setTimeout(pollForAnalysis, 2000);

    return () => {
      mounted = false;
      clearTimeout(initialDelay);
    };
  }, [assessmentId, analysisGenerating, analysis]);

  const handleShare = async () => {
    const shareText = `I'm a ${archetype.name} - AI Readiness Assessment. Score: ${overallScore}/100.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI Readiness: ${archetype.name}`,
          text: shareText,
          url: ASSESSMENT_URL,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${ASSESSMENT_URL}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleDownloadPDF = () => {
    trackFunnel('report_pdf_download', { analysis: !!(analysis ?? result.analysis) }, entryRef.current);
    generateAssessmentPDF({ ...result, analysis: analysis ?? result.analysis });
  };

  const handleWhitepaperDownload = async () => {
    if (whitepaperSending || whitepaperSent) return;

    setWhitepaperSending(true);
    setWhitepaperSent(true);

    // Send the request before navigating away. BotID adds a challenge step before the
    // fetch goes out, so a fire-and-forget call could be cancelled by the redirect.
    // Capped so a slow request never holds the user on this page.
    await Promise.race([
      fetch('/api/whitepaper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          email: companyData.email,
          source: 'assessment-results',
          ...guard.payload(),
        }),
      }).catch(() => {
        // Silently fail - user will still get PDF download on thank-you page
      }),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]);

    // Redirect immediately to thank-you page (PDF downloads there)
    window.location.href = '/ai-transformation/thank-you';
  };

  const logoUrl = getCompanyLogoUrl(companyData.website, companyInsights);

  return (
    <div className="min-h-screen bg-surface-overlay text-ink">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-line-subtle bg-surface-overlay">
        <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="type-sm font-medium text-ink-secondary">AI Readiness Report</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 type-sm hover:bg-surface-card transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 type-sm hover:bg-surface-card transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <Link
              href="/ai-transformation"
              className="flex items-center gap-2 rounded-lg bg-surface-card-hover px-3 py-1.5 type-sm hover:bg-surface-card-hover transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Close</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Email notification banner */}
      {showEmailSent && (
        <div className="bg-green-500/10 border-b border-green-500/20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-brand-violet-strong" />
              <span className="type-sm text-brand-violet-strong">
                A copy of this report has been sent to {companyData.email}
              </span>
            </div>
            <button
              onClick={() => setShowEmailSent(false)}
              className="text-brand-violet-strong hover:text-brand-violet-strong"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Hero Section - Redesigned */}
        <section className="mb-12">
          <div className="grid lg:grid-cols-[200px_1fr] gap-8 items-start">
            {/* Left: Company Visual + Score + Archetype */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              {/* Company Logo/Favicon */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface-card border border-line-subtle p-3 flex items-center justify-center overflow-hidden">
                {logoUrl && !logoError ? (
                  <PublicDemoImg
                    src={logoUrl}
                    alt={`${companyData.name} logo`}
                    className="max-w-full max-h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="text-3xl font-bold text-ink-secondary">
                    {companyData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Company Links */}
              <div className="flex flex-col gap-1.5 w-full">
                <a
                  href={companyData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-brand-violet-strong hover:text-brand-violet-strong"
                >
                  <Globe className="w-3 h-3" />
                  Website
                </a>
                {companyData.linkedin && (
                  <a
                    href={companyData.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-violet-strong hover:text-brand-violet-strong"
                  >
                    <Linkedin className="w-3 h-3" />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Score Display - Moved to left */}
              <div className="w-full p-4 rounded-xl bg-surface-card border border-line-subtle">
                <p className="type-xs text-ink-secondary mb-1">AI Readiness Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink">{overallScore}</span>
                  <span className="type-sm text-ink-tertiary">/100</span>
                </div>
              </div>

              {/* Archetype Badge - Moved to left */}
              <div className="w-full p-4 rounded-xl bg-surface-card border border-line-subtle">
                <p className="type-xs text-ink-secondary mb-1">AI Archetype</p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: archetype.color }}
                >
                  {archetype.name}
                </p>
                <p className="type-xs text-ink-tertiary mt-1">{archetype.hook}</p>
              </div>
            </div>

            {/* Right: Report Header + Executive Summary */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-line-subtle">
                  <span className="type-xs text-ink-secondary">AI Readiness Report</span>
                </div>
                <span className="type-xs text-ink-tertiary">•</span>
                <span className="type-xs text-ink-tertiary">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-ink mb-4">
                {companyData.name}
              </h1>

              {/* Executive Summary */}
              <div className="p-5 bg-linear-to-br/srgb from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                <h2 className="type-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  About you, from your website
                </h2>
                {companyInsights?.company_summary ? (
                  <div className="space-y-3">
                    <p className="type-sm text-ink-secondary leading-relaxed">
                      {companyInsights.company_summary}
                    </p>
                    <p className="type-sm text-ink-secondary leading-relaxed">
                      With an AI Readiness Score of <strong className="text-ink">{overallScore}/100</strong> and a{' '}
                      <strong style={{ color: archetype.color }}>{archetype.name}</strong> profile, {companyData.name} demonstrates{' '}
                      {overallScore >= 70
                        ? 'broad self-reported foundations. This heuristic result still requires technical, governance, workforce, and operating diligence before any investment or deployment decision.'
                        : overallScore >= 50
                        ? 'mixed self-reported foundations. Treat the lower-scoring dimensions as questions for direct evidence review, not as predictions of value or success.'
                        : 'limited self-reported foundations across several dimensions. The score is a discussion aid and does not predict readiness, timeline, value, or success.'
                      }
                    </p>
                    <p className="type-sm text-ink-secondary leading-relaxed">
                      {companyInsights.tech_insights?.mentions_ai
                        ? 'Your public website contains AI or technology signals. These have not been verified against internal systems or operating evidence.'
                        : 'We did not identify sufficient public website evidence to characterize current AI practice. Direct diligence is required.'
                      }
                    </p>
                  </div>
                ) : (
                  <p className="type-sm text-ink-secondary leading-relaxed">
                    {archetype.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quadrant + Scores Section */}
        <section className="mb-12">
          <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">
            {/* Left: Quadrant */}
            <div className="hidden lg:block">
              <ArchetypeQuadrant
                axisScores={axisScores}
                predictedArchetype={archetype}
                totalAnswered={999}
              />
            </div>

            {/* Right: Three Score Cards */}
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-surface-card border border-line-subtle">
                <div className="flex justify-between items-center mb-3">
                  <span className="type-base text-ink">Strategic Vision</span>
                  <span className="text-xl font-semibold">{axisScores.vision}/100</span>
                </div>
                <div className="h-2 rounded-full bg-surface-card-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${axisScores.vision}%` }}
                  />
                </div>
                <p className="type-sm text-ink-secondary mt-2">Leadership, Culture & Governance</p>
              </div>

              <div className="p-5 rounded-xl bg-surface-card border border-line-subtle">
                <div className="flex justify-between items-center mb-3">
                  <span className="type-base text-ink">Operational Capability</span>
                  <span className="text-xl font-semibold">{axisScores.ops}/100</span>
                </div>
                <div className="h-2 rounded-full bg-surface-card-hover overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${axisScores.ops}%`, background: 'linear-gradient(90deg, rgba(124,58,237,0.5), rgba(45,212,191,0.6))', boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.25)' }}
                  />
                </div>
                <p className="type-sm text-ink-secondary mt-2">Data, Technology & Talent</p>
              </div>

            </div>
          </div>
        </section>

        {/* Mobile: Axis Scores */}
        <div className="lg:hidden grid grid-cols-2 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-surface-card border border-line-subtle">
            <p className="type-xs text-ink-tertiary mb-1">Vision</p>
            <span className="text-xl font-semibold text-brand-blue-strong">{axisScores.vision}</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-card border border-line-subtle">
            <p className="type-xs text-ink-tertiary mb-1">Ops</p>
            <span className="text-xl font-semibold text-brand-violet-strong">{axisScores.ops}</span>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="mb-12 p-6 rounded-2xl bg-surface-card border border-line-subtle">
          <h2 className="heading-subsection mb-6 text-center">Readiness Gap Analysis</h2>
          <div ref={chartRef} className="w-full max-w-md mx-auto">
            <MaturityRadar dimensionScores={dimensionScores} showColors={true} />
          </div>
          <p className="type-xs text-ink-secondary text-center mt-4">
            Your self-reported score in each dimension (0 to 100)
          </p>
        </div>

        {/* Dimension Scores Table */}
        <div className="mb-12">
          <h2 className="heading-subsection mb-6">Dimension Scores</h2>
          <div className="rounded-xl overflow-hidden border border-line-subtle">
            {/* Table Header */}
            <div className="bg-linear-to-r/srgb from-purple-600/15 to-teal-400/20 px-6 py-3 grid grid-cols-[1fr_120px_120px] gap-4">
              <span className="text-sm font-semibold text-ink">Dimension</span>
              <span className="text-sm font-semibold text-ink text-center">Score</span>
              <span className="text-sm font-semibold text-ink text-center">Status</span>
            </div>
            {/* Table Rows */}
            <div className="between:border-t between:border-line-subtle">
              {dimensionScores.map((d, idx) => {
                const status = d.score >= 70 ? 'Strong' : d.score >= 50 ? 'Developing' : 'Needs Work';
                const statusColor = d.score >= 70 ? 'text-brand-violet-strong' : d.score >= 50 ? 'text-brand-amber-strong' : 'text-brand-red-strong';
                return (
                  <div
                    key={idx}
                    className={`px-6 py-4 grid grid-cols-[1fr_120px_120px] gap-4 items-center ${
                      idx % 2 === 0 ? 'bg-white/2' : 'bg-transparent'
                    }`}
                  >
                    <span className="text-sm text-ink">{d.dimension}</span>
                    <span className="text-sm text-ink-secondary text-center">{d.score}/100</span>
                    <span className={`text-sm font-medium text-center ${statusColor}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* What We Discovered Section - Rebalanced Layout */}
        {companyInsights && (
          <section className="mb-12">
            <div className="bg-surface-card rounded-2xl border border-line-subtle p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Search className="w-5 h-5 text-brand-violet-strong" />
                <h2 className="heading-subsection m-0">From your website</h2>
              </div>
              <p className="type-sm text-ink-secondary -mt-3 mb-6">A model&apos;s summary of your public homepage. We have not verified it, and it does not affect your score.</p>

              <div className="grid gap-6">
                {/* Technology profile and homepage signals */}
                <div className="space-y-4">
                  {/* Technology Signals */}
                  {companyInsights.tech_insights && (
                    <div>
                      <h3 className="text-sm font-medium text-ink-secondary uppercase tracking-wider mb-3">
                        Technology Profile
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {companyInsights.tech_insights.mentions_ai ? (
                            <CheckCircle className="w-4 h-4 text-brand-violet-strong" />
                          ) : (
                            <XCircle className="w-4 h-4 text-ink-tertiary" />
                          )}
                          <span className="type-sm text-ink-secondary">
                            AI/ML mentioned on website
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {companyInsights.tech_insights.has_roadmap ? (
                            <CheckCircle className="w-4 h-4 text-brand-violet-strong" />
                          ) : (
                            <XCircle className="w-4 h-4 text-ink-tertiary" />
                          )}
                          <span className="type-sm text-ink-secondary">
                            Technology roadmap visible
                          </span>
                        </div>
                      </div>

                      {companyInsights.tech_insights.ai_use_cases.length > 0 && (
                        <div className="mt-3">
                          <p className="type-xs text-ink-tertiary mb-2">AI use cases mentioned:</p>
                          <div className="flex flex-wrap gap-2">
                            {companyInsights.tech_insights.ai_use_cases.map((useCase, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-blue-500/10 text-brand-blue-strong rounded text-xs border border-blue-500/20"
                              >
                                {useCase}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Maturity Signals - Moved to left */}
                  {companyInsights.ai_maturity?.signals && companyInsights.ai_maturity.signals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ink-secondary uppercase tracking-wider mb-3">
                        Signals on your homepage
                      </h3>
                      <div className="space-y-2">
                        {companyInsights.ai_maturity.signals.slice(0, 4).map((signal: string, i: number) => {
                          const category = categorizeSignal(signal);
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded-lg ${category.bgColor} border ${category.borderColor}`}
                            >
                              {category.icon}
                              <p className="text-xs text-ink-secondary leading-relaxed">
                                {signal}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Industry-Specific Insights Section */}
        {(analysis || analysisLoading) && (
          <section className="mb-12">
            <div className="bg-linear-to-br/srgb from-indigo-900/20 to-purple-900/20 rounded-2xl border border-indigo-500/20 p-6 md:p-8">
              <h2 className="heading-subsection mb-6 flex items-center gap-3">
                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {AC.heading}
              </h2>
              {analysisLoading ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-indigo-300 font-medium">{AC.generatingTitle}</p>
                    <p className="text-xs text-ink-secondary mt-1">{AC.generatingBody}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-none space-y-6">
                  {analysisSections(analysis).map((section, i) => (
                    <div key={i}>
                      {section.heading && <h3 className="text-lg font-semibold text-ink mb-3">{section.heading}</h3>}
                      {section.paragraphs.map((p, j) => (
                        <div key={j} className="mb-4">
                          <p className="text-ink-secondary leading-relaxed">{p.text}</p>
                          {p.basis &&
                            (p.basisUrl ? (
                              <a href={p.basisUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-ink-tertiary underline hover:text-ink">
                                {p.basis}
                              </a>
                            ) : (
                              <p className="mt-1 text-xs text-ink-tertiary">{p.basis}</p>
                            ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Blockers */}
        {blockers.length > 0 && (
          <div className="mb-12">
            <h2 className="heading-subsection mb-6">Your lowest-scoring areas</h2>
            <div className="space-y-4">
              {blockers.map((blocker, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-red-500/20 bg-red-500/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-red-500/10 text-brand-red-strong shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="type-base font-semibold text-brand-red-strong mb-1">{blocker.issue}</h3>
                      <p className="type-sm text-ink-secondary">{blocker.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <WorkflowEstimatePanel workflows={result.workflows} />

        <EvidencePanel dimensionScores={dimensionScores} />

        {/* Recommendations Roadmap */}
        {recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="heading-subsection mb-6">Your next steps</h2>
            <div className="space-y-8">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="relative pl-10 border-l-2 border-line-subtle"
                >
                  {/* Larger timeline dot */}
                  <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-linear-to-br/srgb from-indigo-500 to-purple-600 border-2 border-surface-base flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">{idx + 1}</span>
                  </div>

                  {/* Connecting line to next phase */}
                  {idx < recommendations.length - 1 && (
                    <div className="absolute left-0 top-10 bottom-0 w-px bg-linear-to-b/srgb from-line to-transparent" />
                  )}

                  <div className="p-6 rounded-xl bg-surface-card border border-line-subtle hover:bg-white/[0.07] transition-all">
                    {/* Phase header */}
                    <div className="flex items-center gap-4 mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                        <span className="text-sm font-semibold text-indigo-300">{rec.phase}</span>
                      </span>
                    </div>

                    {/* Title and description */}
                    <h3 className="text-lg font-semibold text-ink mb-2">{rec.title}</h3>
                    <p className="text-sm text-ink-secondary mb-4">{rec.description}</p>

                    {/* Action items */}
                    <ul className="space-y-2">
                      {rec.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-ink-secondary">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500/60 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Whitepaper Upgrade Card */}
        <div className="mb-12">
          <div className="p-6 md:p-8 rounded-2xl bg-linear-to-br/srgb from-purple-900/30 to-blue-900/30 border border-purple-500/20">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Icon */}
              <div className="w-14 h-14 shrink-0 rounded-xl bg-linear-to-br/srgb from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                <FileText className="w-7 h-7 text-brand-violet-strong" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold text-ink mb-2">
                  {RESULTS_WHITEPAPER_CARD.heading}
                </h3>
                <p className="type-sm text-ink-secondary mb-4">
                  {RESULTS_WHITEPAPER_CARD.body}
                </p>

                {/* Highlights */}
                <div className="grid sm:grid-cols-2 gap-2 mb-5">
                  {RESULTS_WHITEPAPER_CARD.highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 type-sm text-ink-secondary">
                      <CheckCircle className="w-4 h-4 text-brand-violet-strong shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Action */}
                {whitepaperSent ? (
                  <div className="flex items-center gap-2 text-brand-violet-strong type-sm">
                    <CheckCircle className="w-5 h-5" />
                    {/* POST /api/whitepaper (and /api/assessments) both normalize to
                        trim+lowercase server-side; normalize here too so this always
                        matches the address the notification claim/send actually used,
                        even for a report stored before this normalization existed. */}
                    <span>{PUBLIC_DEMO_DOWNLOAD.sentLabel} {companyData.email.trim().toLowerCase()}</span>
                  </div>
                ) : (
                  <button
                    onClick={handleWhitepaperDownload}
                    disabled={whitepaperSending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r/srgb from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-violet-500/30 backdrop-blur-md text-ink font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {whitepaperSending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-line-strong border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {PUBLIC_DEMO_DOWNLOAD.sendLabel}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-linear-to-br/srgb from-indigo-900/40 to-violet-900/40 border border-indigo-500/20 text-center">
          <h2 className="heading-subsection mb-3">Want to talk it through?</h2>
          <p className="type-base text-ink-secondary mb-6 max-w-lg mx-auto">
            Book a 30-minute call with one of our builders to go through your results and pick a first workflow. No commitment.
          </p>
          <Link
            href="https://calendar.app.google/2DswLVndhkpMVx7K7"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCallClick('report', entryRef.current)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 type-base font-semibold text-indigo-900 hover:bg-indigo-50 transition-colors"
          >
            Book a 30-minute call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
