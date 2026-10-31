import { NextRequest, NextResponse, after } from 'next/server';
import { saveLead } from '@/src/lib/assessment/db';
import { sendSimulatorLeadEmails } from '@/src/lib/simulator/server/emails';
import { getRunBySlug, getRunId, isSlug, linkRunToLead } from '@/src/lib/simulator/server/db';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { LIMITS, cleanText, isValidEmail, normalizeEmail } from '@/lib/form-guard/validation';

const MAX_INSIGHTS_BYTES = 50_000;

function websiteFor(email: string) {
  const domain = email.split('@')[1];
  return domain ? `https://${domain}` : '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Bots and over-limit senders get the normal success response and nothing is saved.
    const guard = await guardSubmission({
      config: FORM_GUARDS.assessmentLeads,
      headers: request.headers,
      ...guardFieldsFromBody(body),
      email: body?.email,
    });
    if (guard.action === 'drop') {
      return NextResponse.json({ success: true, website: websiteFor(normalizeEmail(body?.email)) });
    }
    if (guard.action === 'reject') {
      return NextResponse.json({ error: guard.message }, { status: guard.status });
    }

    const email = normalizeEmail(body?.email);
    if (!body?.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const companyName = cleanText(body?.companyName, LIMITS.companyName);
    const linkedin = cleanText(body?.linkedin, LIMITS.url);
    const teamSize = cleanText(body?.teamSize, LIMITS.name);
    const revenueBand = cleanText(body?.revenueBand, LIMITS.name);
    if (companyName === null || linkedin === null || teamSize === null || revenueBand === null) {
      return NextResponse.json({ error: 'Invalid lead details' }, { status: 400 });
    }

    const companyInsights = body?.companyInsights ?? null;
    if (companyInsights !== null && JSON.stringify(companyInsights).length > MAX_INSIGHTS_BYTES) {
      return NextResponse.json({ error: 'Invalid lead details' }, { status: 400 });
    }

    // Simulator leads (spec 12): "get the full model" or "talk it through" on a stored run.
    let simulator: { slug: string; runId: string; intent: 'plan' | 'talk'; note: string } | null = null;
    if (body?.source === 'simulator') {
      const note = cleanText(body?.note, LIMITS.message);
      const intent = body?.intent === 'talk' ? 'talk' : body?.intent === 'plan' ? 'plan' : null;
      if (!isSlug(body?.simulatorRunSlug) || !intent || note === null) {
        return NextResponse.json({ error: 'Invalid lead details' }, { status: 400 });
      }
      const runId = await getRunId(body.simulatorRunSlug);
      if (!runId) {
        return NextResponse.json({ error: 'This simulation is no longer available' }, { status: 404 });
      }
      simulator = { slug: body.simulatorRunSlug, runId, intent, note };
    }

    // Derive website from email domain
    const emailDomain = email.split('@')[1];
    const website = websiteFor(email);

    const leadData = {
      email,
      company_name: companyName || emailDomain?.split('.')[0] || 'Unknown',
      website,
      linkedin: linkedin || '',
      team_size: teamSize || undefined,
      revenue_band: revenueBand || undefined,
      company_insights: companyInsights,
      ...(simulator ? { source: 'simulator', simulator_run_id: simulator.runId, simulator_run_slug: simulator.slug } : {}),
      // The EU AI Act Readiness form (src/components/eu-ai-act/EUAssessmentForm.tsx).
      ...(body?.source === 'eu-ai-act-assessment' ? { source: 'eu-ai-act-assessment' } : {}),
    };

    const { success, error, data } = await saveLead(leadData);

    if (!success) {
      console.error('Failed to save lead:', error);
      // Don't fail the request - lead capture is secondary
      return NextResponse.json({ success: false, error });
    }

    if (simulator) {
      const sim = simulator;
      const leadId = Array.isArray(data) ? (data[0] as { id?: string } | undefined)?.id : undefined;
      after(async () => {
        if (leadId) await linkRunToLead(sim.runId, leadId);
        const run = await getRunBySlug(sim.slug);
        if (!run || run === 'deleted') return;
        await sendSimulatorLeadEmails({ run, email, company: leadData.company_name, intent: sim.intent, note: sim.note });
      });
    }

    return NextResponse.json({ success: true, website });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
