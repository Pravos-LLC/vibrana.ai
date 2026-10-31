import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { generateIndustryAnalysisForAssessment } from '@/lib/assessment/generate-industry-analysis';

// The analysis pipeline: up to two drafts, each checked by a judge model, plus the rest of the work.
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authHeader);
  // timingSafeEqual throws on a length mismatch, so check that first. A length
  // check alone is not timing-sensitive information worth protecting.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, force } = body as { id?: string; force?: boolean };

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const result = await generateIndustryAnalysisForAssessment(id, { force: !!force });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, reason: result.pipeline?.reason }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      cached: result.cached,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
