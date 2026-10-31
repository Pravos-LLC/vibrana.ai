import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhitepaperEmail } from '@/lib/whitepaper-email';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { cleanSource, isValidEmail, normalizeEmail } from '@/lib/form-guard/validation';

// Whitepaper request from the assessment results page (ResultsDashboard). Records the
// lead and emails the PDF link. The page redirects to /ai-transformation/thank-you
// (which downloads the PDF) without waiting, so this route never blocks the user.
//
// Each address gets the email at most once. The send is guarded by an atomic claim
// (whitepaper_sent false -> true in one conditional UPDATE), so concurrent or repeated
// requests can't mail the same inbox twice. Every accepted request gets the same
// response body, so the endpoint doesn't reveal whether an address is already known.

const ACCEPTED = () => NextResponse.json({ success: true });

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Bots and over-limit senders get the normal success response: nothing saved, nothing mailed.
  const guard = await guardSubmission({
    config: FORM_GUARDS.whitepaper,
    headers: request.headers,
    ...guardFieldsFromBody(body),
    email: body?.email,
  });
  if (guard.action === 'drop') return ACCEPTED();
  if (guard.action === 'reject') return NextResponse.json({ error: guard.message }, { status: guard.status });

  const email = normalizeEmail(body?.email);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  const source = cleanSource(body?.source, 'website');

  // Record the lead. An existing row (and its source) is left untouched.
  const { error: insertError } = await supabase
    .from('whitepaper_leads')
    .upsert({ email, source }, { onConflict: 'email', ignoreDuplicates: true });
  if (insertError) {
    console.error('Whitepaper lead insert failed:', insertError.message);
    return NextResponse.json({ error: 'Could not record request' }, { status: 500 });
  }

  // Claim the send. Only the request that flips whitepaper_sent gets a row back.
  const { data: claimed, error: claimError } = await supabase
    .from('whitepaper_leads')
    .update({ whitepaper_sent: true })
    .eq('email', email)
    .eq('whitepaper_sent', false)
    .select('email');
  if (claimError) {
    console.error('Whitepaper send claim failed:', claimError.message);
    return NextResponse.json({ error: 'Could not record request' }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) return ACCEPTED();

  const sent = await sendWhitepaperEmail(email, source);
  if (!sent) {
    // Release the claim so the next request retries. The user already has the PDF
    // from the thank-you page.
    const { error: releaseError } = await supabase
      .from('whitepaper_leads')
      .update({ whitepaper_sent: false })
      .eq('email', email);
    if (releaseError) console.error('Whitepaper send claim release failed:', releaseError.message);
  }

  return ACCEPTED();
}
