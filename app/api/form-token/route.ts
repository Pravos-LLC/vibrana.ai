import { NextResponse } from 'next/server';
import { issueFormToken } from '@/lib/form-guard/server';

export const dynamic = 'force-dynamic';

/** Issues a signed render timestamp for the public forms' minimum fill-time check. */
export async function GET() {
  const token = issueFormToken();
  if (!token) {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ token }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
