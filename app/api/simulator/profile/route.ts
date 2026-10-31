import { NextRequest, NextResponse, after } from 'next/server';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { LIMITS, cleanText, isValidEmail, normalizeEmail } from '@/lib/form-guard/validation';
import { saveLead } from '@/src/lib/assessment/db';
import type { ProfileResponse } from '@/src/lib/simulator/api';
import { companyName as brandName, leadTeamSize } from '@/src/lib/simulator/format';
import { normalizeWebsite } from '@/src/lib/simulator/profile/domain';
import { buildProfile } from '@/src/lib/simulator/profile';

export const maxDuration = 60;

/**
 * The simulator's first step (spec 10): a work email, an optional website and a headcount.
 * The email becomes a lead the moment the step passes the guard, so a visitor who never
 * finishes is still in the CRM. Every failure, including a guard drop, returns the same
 * manual-sector response, so a bot learns nothing.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const record = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const manual: ProfileResponse = { ok: false, reason: 'manual', domain: normalizeWebsite(record.url)?.domain ?? null };

  const guard = await guardSubmission({
    config: FORM_GUARDS.simulatorProfile,
    headers: request.headers,
    ...guardFieldsFromBody(body),
    email: record.email,
  });
  if (guard.action === 'drop') return NextResponse.json(manual);
  if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status });

  const email = normalizeEmail(record.email);
  if (!isValidEmail(email)) return NextResponse.json({ error: 'A valid work email is required' }, { status: 400 });

  // A blank website is the "pick a sector" path: no scrape, just the lead.
  const response: ProfileResponse = normalizeWebsite(record.url) ? await buildProfile(record.url) : manual;

  const headcount = Number(record.headcount);
  const emailDomain = email.split('@')[1] ?? '';
  const site = response.ok ? response.profile.domain : response.domain;
  after(async () => {
    const result = await saveLead({
      email,
      company_name:
        (response.ok ? cleanText(response.profile.name, LIMITS.companyName) : null) ||
        brandName(site ?? emailDomain, response.ok ? response.profile.title : null) ||
        'Unknown',
      website: `https://${site ?? emailDomain}`,
      linkedin: '',
      team_size: Number.isInteger(headcount) && headcount > 0 ? leadTeamSize(headcount) : undefined,
      company_insights: response.ok ? response.profile : undefined,
      source: 'simulator',
    });
    if (!result.success) console.error('[simulator] entry lead not saved:', result.error);
  });

  return NextResponse.json(response);
}
