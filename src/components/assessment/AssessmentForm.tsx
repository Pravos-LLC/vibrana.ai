'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AssessmentResult } from '@/src/types/assessment';
import FlowAssessment from './FlowAssessment';
import AssessmentSidebar from './AssessmentSidebar';
import ArchetypeQuadrant from './ArchetypeQuadrant';
import LiveRadarChart from './LiveRadarChart';
import { useAssessmentScores } from './useAssessmentScores';
import { ArrowRight, Mail, CheckCircle2, Calendar } from 'lucide-react';
import { gsap, prefersReducedMotion } from '@/src/lib/gsap';
import Link from 'next/link';
import { INQUIRY_OPTIONS } from '@/src/enterprise-content';
import { ASSESSMENT_COPY as c } from './assessment-copy';
import { FormGuardFields, useFormGuard } from '@/lib/form-guard/client';
import { ASSESSMENT_AREAS, questionsForTeamSize } from '@/src/assessment-questions-content';
import WorkflowModule from './WorkflowModule';
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows';
import type { EntryPoint } from '@/src/lib/funnel/entry';
import { currentEntry, trackCallClick, trackFunnel } from '@/src/lib/funnel/client';

// The six areas, each with the questions this team size is asked. Every area weighs the same
// (src/lib/assessment/scoring.ts, docs/assessment-methodology.md).
function dimensionsFor(teamSize: string) {
  const questions = questionsForTeamSize(teamSize);
  return ASSESSMENT_AREAS.map(({ key, dimension }) => ({ id: key, title: dimension, questions: questions[key], weight: 1 / 6 }));
}

const STEPS = [
  { id: 'company', title: 'Company Information' },
  { id: 'leadership', title: 'Leadership & Strategy' },
  { id: 'data', title: 'Data Readiness' },
  { id: 'technology', title: 'Technology Infrastructure' },
  { id: 'talent', title: 'Talent & Capability' },
  { id: 'governance', title: 'Governance & Responsible AI' },
  { id: 'culture', title: 'Culture & Change Readiness' },
];

interface AssessmentFormProps {
  onAssessmentStart?: () => void;
}

export default function AITransformationPage({ onAssessmentStart }: AssessmentFormProps = {}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    linkedin: '',
    email: '',
    teamSize: '',
    revenueBand: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [companyInsights, setCompanyInsights] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<AssessmentResult | null>(null);
  const startedAtRef = useRef<string | null>(null);
  // The front door this visit came through (docs/funnel-measurement.md), read once on mount.
  const entryRef = useRef<EntryPoint>('direct');
  useEffect(() => {
    entryRef.current = currentEntry();
  }, []);
  const [basePath, setBasePath] = useState(process.env.NEXT_PUBLIC_BASE_PATH || '');
  const [currentDimensionId, setCurrentDimensionId] = useState<string>('leadership');
  // After the scored questions comes the optional workflow step, then the report.
  const [phase, setPhase] = useState<'questions' | 'workflows'>('questions');
  const [returnToEnd, setReturnToEnd] = useState(false);
  const guard = useFormGuard();
  const DIMENSIONS = useMemo(() => dimensionsFor(companyData.teamSize), [companyData.teamSize]);
  const QUESTION_COUNT = DIMENSIONS.reduce((n, d) => n + d.questions.length, 0);

  // Calculate live scores for the sidebar visualization
  const {
    dimensionScores,
    axisScores,
    predictedArchetype,
    totalAnswered,
    totalQuestions,
    dimensionProgress,
  } = useAssessmentScores(DIMENSIONS, answers);

  // Handle dimension changes from FlowAssessment
  const handleDimensionChange = useCallback((dimensionId: string) => {
    setCurrentDimensionId(dimensionId);
  }, []);

  // GSAP animation for completion screen reveal
  useEffect(() => {
    if (report && !prefersReducedMotion()) {
      // Animate completion screen elements with staggered reveal
      const tl = gsap.timeline();
      tl.from('.results-reveal', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
      });
    }
  }, [report]);

  useEffect(() => {
    // Only check pathname on client after hydration
    if (!process.env.NEXT_PUBLIC_BASE_PATH && window.location.pathname.startsWith('/ai-readiness')) {
      setBasePath('/ai-readiness');
    }
  }, []);

  // Prefill from the AI Transformation Simulator (?from=simulator&company=&website=&teamSize=).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'simulator') return;
    const company = (params.get('company') || '').slice(0, 200);
    const website = (params.get('website') || '').slice(0, 500);
    const teamSize = params.get('teamSize') || '';
    setCompanyData((prev) => ({
      ...prev,
      name: company || prev.name,
      website: /^https?:\/\//.test(website) ? website : prev.website,
      teamSize: (INQUIRY_OPTIONS.teamSizes as readonly string[]).includes(teamSize) ? teamSize : prev.teamSize,
    }));
    setManuallyEdited({ website: !!website, name: !!company });
  }, []);

  // Derive website and company name from email domain
  const deriveFromEmail = (email: string) => {
    const domain = email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail') && !domain.includes('outlook') && !domain.includes('icloud')) {
      const companyName = domain.split('.')[0];
      // Capitalize first letter of company name
      const formattedName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
      return {
        website: `https://${domain}`,
        name: formattedName,
      };
    }
    return { website: '', name: '' };
  };

  // Auto-fill website and company name when email changes
  const [manuallyEdited, setManuallyEdited] = useState({ website: false, name: false });

  useEffect(() => {
    if (companyData.email) {
      const derived = deriveFromEmail(companyData.email);
      setCompanyData((prev) => ({
        ...prev,
        website: manuallyEdited.website ? prev.website : derived.website,
        name: manuallyEdited.name ? prev.name : derived.name,
      }));
    }
  }, [companyData.email, manuallyEdited]);

  const handleAnswer = useCallback((questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  }, []);

  const submitAssessment = useCallback(async (workflows: AssessmentWorkflows | null) => {
    setIsSubmitting(true);
    // Only the questions this team size was asked (a changed team size leaves no stray answers).
    const asked = new Set(DIMENSIONS.flatMap((d) => d.questions.map((q) => q.id)));
    const askedAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => asked.has(id)));
    try {
      const response = await fetch(`${basePath}/api/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyData, answers: askedAnswers, workflows, companyInsights, startedAt: startedAtRef.current, entryPoint: entryRef.current, ...guard.payload() }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result?.error || 'Failed to submit assessment.');
        return;
      }

      if (!result.report) {
        alert('Assessment submitted, but no report was returned.');
        return;
      }

      // Store report in localStorage for the results page
      // Include assessmentId and analysisGenerating flag for async analysis polling
      const reportWithMeta = {
        ...result.report,
        _assessmentId: result.assessmentId,
        _analysisGenerating: result.report.analysisGenerating,
        _storedAt: Date.now(),
        _entry: entryRef.current,
      };
      localStorage.setItem('assessmentReport', JSON.stringify(reportWithMeta));
      trackFunnel('assessment_complete', { workflows: workflows?.items.length ?? 0 }, entryRef.current);
      setReport(result.report);
    } catch (error) {
      console.error('Assessment submission error:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [basePath, companyData, answers, companyInsights, guard, DIMENSIONS]);

  // The last question leads to the optional workflow step - must be before any conditional returns
  const handleFlowComplete = useCallback(() => {
    setPhase('workflows');
  }, []);

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!startedAtRef.current) {
        startedAtRef.current = new Date().toISOString();
        trackFunnel('assessment_start', {}, entryRef.current);
      }
      // Save lead immediately (capture email early)
      fetch(`${basePath}/api/assessment-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: companyData.email,
          companyName: companyData.name,
          linkedin: companyData.linkedin,
          teamSize: companyData.teamSize,
          revenueBand: companyData.revenueBand,
          ...guard.payload(),
        }),
      }).catch((error) => console.error('Lead capture error:', error));

      // Start company analysis in background (non-blocking)
      setIsAnalyzing(true);
      const websiteToAnalyze = companyData.website || deriveFromEmail(companyData.email).website;

      fetch(`${basePath}/api/analyze-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: websiteToAnalyze, linkedin: companyData.linkedin, ...guard.payload() }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success && result.insights) {
            setCompanyInsights(result.insights);
            // Update lead with company insights
            fetch(`${basePath}/api/assessment-leads`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: companyData.email,
                companyName: companyData.name,
                linkedin: companyData.linkedin,
                teamSize: companyData.teamSize,
                revenueBand: companyData.revenueBand,
                companyInsights: result.insights,
                ...guard.payload(),
              }),
            }).catch((error) => console.error('Lead update error:', error));
          } else if (result.error) {
            console.warn('Company analysis skipped:', result.error);
          }
        })
        .catch((error) => {
          console.error('Analysis error:', error);
        })
        .finally(() => {
          setIsAnalyzing(false);
        });

      // Immediately advance to next step
      setCurrentStep(1);
      onAssessmentStart?.();
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show completion screen when report is ready
  if (report) {
    return (
      <div className="assessment-form-container max-w-6xl mx-auto px-4">
        <div className="completion-screen">
          {/* Header with success indicator */}
          <div className="results-reveal text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle2 className="w-5 h-5 text-brand-violet-strong" />
              <span className="type-sm text-brand-violet-strong">{c.shared.assessmentComplete}</span>
            </div>
          </div>

          {/* Two-column layout with visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8">
            {/* LEFT: Visualizations (desktop only) */}
            <div className="hidden lg:block space-y-4 results-reveal">
              <ArchetypeQuadrant
                axisScores={report.axisScores}
                predictedArchetype={report.archetype}
                totalAnswered={999}
              />
              <LiveRadarChart
                dimensionScores={report.dimensionScores}
                predictedArchetype={report.archetype}
                totalAnswered={999}
              />
            </div>

            {/* RIGHT: Results Summary */}
            <div className="results-reveal bg-surface-card backdrop-blur-xs border border-line-subtle rounded-xl p-6 md:p-8">
              {/* Personalized Intro */}
              <div className="mb-6 p-4 bg-linear-to-br/srgb from-amber-500/10 to-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Your answers put <span className="text-ink font-medium">{companyData.name}</span> at {report.overallScore}/100 overall. This is a summary of what you told us, not a measured or predicted readiness.
                </p>
              </div>

              {/* Archetype reveal */}
              <p className="type-xs text-ink-secondary uppercase tracking-wider mb-2">{c.shared.yourArchetype}</p>
              <h2
                className="heading-subsection mb-3"
                style={{ color: report.archetype.color }}
              >
                {report.archetype.name}
              </h2>
              <p className="type-lg text-ink-secondary mb-6">{report.archetype.hook}</p>

              {/* Scores display */}
              <div className="flex flex-wrap gap-4 mb-6">
                {/* Overall Score */}
                <div className="flex-1 min-w-[120px] p-4 rounded-xl bg-surface-card border border-line-subtle">
                  <p className="type-xs text-ink-tertiary mb-1">{c.orgResult.overallScore}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-ink">{report.overallScore}</span>
                    <span className="type-sm text-ink-tertiary">/100</span>
                  </div>
                </div>

                {/* Vision Score */}
                <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-surface-card border border-line-subtle">
                  <p className="type-xs text-ink-tertiary mb-1">{c.orgResult.vision}</p>
                  <span className="text-2xl font-semibold text-blue-400">{report.axisScores.vision}</span>
                </div>

                {/* Ops Score */}
                <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-surface-card border border-line-subtle">
                  <p className="type-xs text-ink-tertiary mb-1">{c.orgResult.ops}</p>
                  <span className="text-2xl font-semibold text-violet-400">{report.axisScores.ops}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-ink-secondary mb-8 p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                <Mail className="w-4 h-4 text-brand-violet-strong" />
                <span className="type-sm">{c.orgResult.reportSent(companyData.email)}</span>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/ai-transformation/results')}
                  className="btn-primary inline-flex items-center justify-center gap-2 flex-1"
                >
                  {c.orgResult.viewFullReport}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="https://calendar.app.google/2DswLVndhkpMVx7K7"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCallClick('assessment-complete', entryRef.current)}
                  className="btn-secondary inline-flex items-center justify-center gap-2 flex-1"
                >
                  <Calendar className="w-4 h-4" />
                  {c.orgResult.scheduleCall}
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile: Mini visualizations */}
          <div className="lg:hidden mt-6 grid grid-cols-2 gap-4 results-reveal">
            <div className="p-4 rounded-xl bg-surface-card border border-line-subtle text-center">
              <p className="type-xs text-ink-tertiary mb-1">Vision</p>
              <span className="text-2xl font-semibold text-blue-400">{report.axisScores.vision}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-line-subtle text-center">
              <p className="type-xs text-ink-tertiary mb-1">Ops</p>
              <span className="text-2xl font-semibold text-violet-400">{report.axisScores.ops}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isStepComplete = (stepId: string) => {
    if (stepId === 'company') {
      // Email + 2 ICP fields required (team size, revenue band).
      // Website + name auto-derived from email domain.
      return (
        companyData.email &&
        companyData.email.includes('@') &&
        companyData.teamSize &&
        companyData.revenueBand
      );
    }
    const dimension = DIMENSIONS.find((d) => d.id === stepId);
    if (!dimension) return false;
    const dimensionAnswers = dimension.questions.map((q) => answers[q.id]);
    return dimensionAnswers.every((a) => a !== undefined);
  };

  const renderIntroStep = () => {
    return (
      <div className="form-step active relative">
        <FormGuardFields guard={guard} />
        <div className="form-step-header mb-5">
          <span className="block type-xs text-brand-violet-strong uppercase tracking-wider mb-1">{c.shared.letsGetStarted}</span>
          <h2 className="heading-subsection text-ink m-0">{c.shared.companyInfoTitle}</h2>
          <p className="type-sm text-ink-secondary mt-2 leading-relaxed">
            {c.shared.companyInfoIntro}
          </p>
        </div>

        <div className="form-group mb-5">
          <label htmlFor="assessment-email" className="form-label block type-sm font-medium text-ink mb-2">{c.shared.workEmail} *</label>
          <input
            id="assessment-email"
            type="email"
            className="w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-lg text-ink type-sm transition-colors focus:outline-hidden focus:border-emerald-500/50 focus:bg-white/8 placeholder:text-ink-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            value={companyData.email}
            onChange={(e) => setCompanyData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="you@yourcompany.com"
            disabled={isAnalyzing}
          />
        </div>

        {/* Auto-detected fields */}
        {(companyData.name || companyData.website) && (
          <div className="p-4 bg-white/2 border border-white/6 rounded-lg mb-5">
            <p className="type-xs text-ink-secondary uppercase tracking-wider mb-3">{c.shared.autoDetected}</p>

            {companyData.name && (
              <div className="flex items-center justify-between mb-2">
                <span className="type-sm text-ink-secondary">{c.shared.companyField}</span>
                <input
                  type="text"
                  className="bg-transparent type-sm text-ink text-right border-none focus:outline-hidden focus:ring-0 w-auto"
                  value={companyData.name}
                  onChange={(e) => {
                    setManuallyEdited((prev) => ({ ...prev, name: true }));
                    setCompanyData((prev) => ({ ...prev, name: e.target.value }));
                  }}
                />
              </div>
            )}

            {companyData.website && (
              <div className="flex items-center justify-between">
                <span className="type-sm text-ink-secondary">{c.shared.websiteField}</span>
                <input
                  type="text"
                  className="bg-transparent type-sm text-ink text-right border-none focus:outline-hidden focus:ring-0 w-auto max-w-[200px]"
                  value={companyData.website}
                  onChange={(e) => {
                    setManuallyEdited((prev) => ({ ...prev, website: true }));
                    setCompanyData((prev) => ({ ...prev, website: e.target.value }));
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <div className="form-group">
            <label htmlFor="assessment-team-size" className="form-label block type-sm font-medium text-ink mb-2">{c.shared.teamSize} *</label>
            <select
              id="assessment-team-size"
              className="w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-lg text-ink type-sm transition-colors focus:outline-hidden focus:border-emerald-500/50 focus:bg-white/8 disabled:opacity-50 disabled:cursor-not-allowed"
              value={companyData.teamSize}
              onChange={(e) => setCompanyData((prev) => ({ ...prev, teamSize: e.target.value }))}
              disabled={isAnalyzing}
            >
              <option value="" disabled>
                {c.shared.selectTeamSize}
              </option>
              {INQUIRY_OPTIONS.teamSizes.map((opt) => (
                <option key={opt} value={opt} className="bg-white text-ink">
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assessment-revenue" className="form-label block type-sm font-medium text-ink mb-2">{c.shared.annualRevenue} *</label>
            <select
              id="assessment-revenue"
              className="w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-lg text-ink type-sm transition-colors focus:outline-hidden focus:border-emerald-500/50 focus:bg-white/8 disabled:opacity-50 disabled:cursor-not-allowed"
              value={companyData.revenueBand}
              onChange={(e) => setCompanyData((prev) => ({ ...prev, revenueBand: e.target.value }))}
              disabled={isAnalyzing}
            >
              <option value="" disabled>
                {c.shared.selectRevenue}
              </option>
              {INQUIRY_OPTIONS.revenueBands.map((opt) => (
                <option key={opt} value={opt} className="bg-white text-ink">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="type-xs text-ink-secondary mt-4">
          {c.shared.analyzeNote}
        </p>
        <p className="type-xs text-ink-tertiary mt-3 leading-relaxed">
          {c.shared.consentBefore}<Link href="/privacy" className="underline hover:text-ink">{c.shared.consentLink}</Link>{c.shared.consentAfter}
        </p>
      </div>
    );
  };

  // If we're past the intro step, show the flow assessment with sidebar
  if (currentStep > 0) {
    return (
      <div className="assessment-form-container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8">
          {/* LEFT: Visualization Sidebar (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <AssessmentSidebar
                dimensionScores={dimensionScores}
                axisScores={axisScores}
                predictedArchetype={predictedArchetype}
                currentDimensionId={currentDimensionId}
                totalAnswered={totalAnswered}
                isAnalyzing={isAnalyzing}
                companyInsights={companyInsights}
              />
            </div>
          </div>

          {/* RIGHT: Assessment Form */}
          <div className="assessment-form bg-surface-card backdrop-blur-xs border border-line-subtle rounded-xl p-6 md:p-8">
            {/* Mobile: Mini archetype badge */}
            {totalAnswered >= 3 && predictedArchetype && (
              <div className="lg:hidden mb-6 flex items-center justify-between p-3 bg-white/4 border border-white/6 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: predictedArchetype.color }}
                  />
                  <span className="text-xs text-ink-secondary">Emerging as</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: predictedArchetype.color }}
                  >
                    {predictedArchetype.name}
                  </span>
                </div>
                <div className="text-xs text-ink-tertiary">
                  {totalAnswered}/{totalQuestions}
                </div>
              </div>
            )}

            {phase === 'workflows' ? (
              <WorkflowModule
                onSubmit={submitAssessment}
                onBack={() => {
                  setReturnToEnd(true);
                  setPhase('questions');
                }}
                isSubmitting={isSubmitting}
              />
            ) : (
            <FlowAssessment
              startAtEnd={returnToEnd}
              dimensions={DIMENSIONS}
              answers={answers}
              onAnswer={handleAnswer}
              onComplete={handleFlowComplete}
              onDimensionChange={handleDimensionChange}
              companyInsights={companyInsights}
              isAnalyzing={isAnalyzing}
              isSubmitting={isSubmitting}
            />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Intro step
  return (
    <div className="assessment-form-container max-w-xl mx-auto">
      {/* Stats Header */}
      <div className="assessment-stats flex justify-center gap-6 md:gap-10 mb-8 pb-6 border-b border-line-subtle">
        <div className="stat-item text-center">
          <div className="stat-value type-lg font-bold text-ink">{QUESTION_COUNT}</div>
          <div className="stat-label type-xs uppercase tracking-wider text-ink-tertiary">{c.shared.questionsLabel}</div>
        </div>
        <div className="stat-item text-center">
          <div className="stat-value type-lg font-bold text-ink">{DIMENSIONS.length}</div>
          <div className="stat-label type-xs uppercase tracking-wider text-ink-tertiary">{c.shared.dimensionsLabel}</div>
        </div>
      </div>

      {/* Intro Form */}
      <div className="assessment-form bg-surface-card backdrop-blur-xs border border-line-subtle rounded-xl p-5 md:p-6">
        {renderIntroStep()}

        <div className="form-nav mt-6 flex justify-end">
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={!isStepComplete(STEPS[0].id)}
          >
            {c.shared.startAssessment}
          </button>
        </div>
      </div>
    </div>
  );
}
