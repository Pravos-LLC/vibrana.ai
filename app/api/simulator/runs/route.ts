import { NextRequest, NextResponse } from 'next/server';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { LIMITS, cleanText } from '@/lib/form-guard/validation';
import type { CreateRunResponse } from '@/src/lib/simulator/api';
import { simulate } from '@/src/lib/simulator/engine';
import { createRun, getCachedProfile, ipHash } from '@/src/lib/simulator/server/db';
import { sanitizeInputs } from '@/src/lib/simulator/server/sanitize';

/** Stores a shareable result. The server re-runs the engine; it never trusts client numbers. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const guard = await guardSubmission({
    config: FORM_GUARDS.simulatorRuns,
    headers: request.headers,
    ...guardFieldsFromBody(body),
  });
  if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status });
  // A dropped request gets no link. The visitor still has the result on screen.
  if (guard.action === 'drop') return NextResponse.json({ error: 'Unable to save this result' }, { status: 400 });

  const inputs = sanitizeInputs(body?.inputs);
  if (!inputs) return NextResponse.json({ error: 'Invalid simulation inputs' }, { status: 400 });

  // A shared run uses the cached company profile by default: name, logo and imagery. A name the
  // client sends wins; otherwise the name comes from the profile cache for the run's domain.
  const sentName = cleanText(body?.companyName, LIMITS.companyName);
  if (sentName === null) return NextResponse.json({ error: 'Invalid company name' }, { status: 400 });
  const cached = inputs.domain ? await getCachedProfile(inputs.domain).catch(() => null) : null;
  const companyName = sentName || cleanText(cached?.name, LIMITS.companyName) || null;

  try {
    const result = simulate(inputs);
    const created: CreateRunResponse = await createRun({
      inputs,
      result,
      showCompanyName: true,
      companyName,
      ipHash: ipHash(request.headers),
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[simulator] run save failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Unable to save this result' }, { status: 500 });
  }
}
