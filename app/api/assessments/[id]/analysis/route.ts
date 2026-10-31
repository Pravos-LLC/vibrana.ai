import { NextRequest, NextResponse } from 'next/server';
import { getAssessment } from '@/src/lib/assessment/db';
import { generateIndustryAnalysisForAssessment } from '@/lib/assessment/generate-industry-analysis';
import { isStructuredAnalysis } from '@/lib/assessment/analysis-schema';

// The analysis pipeline: up to two drafts, each checked by a judge model, plus the rest of the work.
export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing assessment ID' }, { status: 400 });
    }

    const assessment = await getAssessment(id);

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const analysis = isStructuredAnalysis(assessment.analysis) ? assessment.analysis : assessment.industry_analysis || null;
    return NextResponse.json({
      hasAnalysis: !!analysis,
      analysis,
      // Set when the pipeline ran and nothing passed, so the results page stops waiting.
      analysisFailed: !analysis && assessment.analysis_meta?.status === 'failed',
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing assessment ID' }, { status: 400 });
    }

    // Public and unauthenticated: only ever fills a missing analysis. Forced
    // regeneration wipes the stored analysis and spends OpenRouter credit, so it
    // lives behind CRON_SECRET at /api/admin/assessment-analysis.
    const result = await generateIndustryAnalysisForAssessment(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      cached: result.cached,
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
