import { NextRequest, NextResponse } from 'next/server';
import { recordShare } from '@/src/lib/simulator/server/db';

/** Counts a share click (simulator_runs.share_count). Always 204: the count is best effort. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await recordShare(slug);
  } catch (err) {
    console.error('[simulator] share count failed:', err instanceof Error ? err.message : err);
  }
  return new NextResponse(null, { status: 204 });
}
