import { NextRequest, NextResponse } from 'next/server';
import { deleteRun } from '@/src/lib/simulator/server/db';

/** The creator deletes a run with the owner token; /r/<slug> then returns 410. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const outcome = await deleteRun(slug, request.headers.get('x-owner-token'));
    if (outcome === 'deleted') return new NextResponse(null, { status: 204 });
    if (outcome === 'forbidden') return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    console.error('[simulator] run delete failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Unable to delete' }, { status: 500 });
  }
}
